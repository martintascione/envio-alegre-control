
import { Client, Order, ShippingStatus } from "@/lib/types";
import { toast } from "sonner";
import { getClientById } from "./clientUtils";
import { shippingStatusMap } from "@/lib/data";
import { WhatsAppSettings, MessageTemplate } from "./types";
import config from "@/config";

const applyTemplateVariables = (
  template: string,
  client: Client,
  order: Order
): string => {
  const currentDate = new Date();
  const estimatedDate = new Date(currentDate);
  estimatedDate.setDate(currentDate.getDate() + 14); // Fecha estimada para ejemplo (2 semanas)
  
  const formattedEstimatedDate = new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(estimatedDate);

  return template
    .replace(/\[cliente\]/g, client.name)
    .replace(/\[comercio\]/g, order.store)
    .replace(/\[pedido\]/g, order.productDescription)
    .replace(/\[fecha\]/g, formattedEstimatedDate)
    .replace(/\[tracking\]/g, order.trackingNumber || "Sin número de tracking");
};

export const updateOrderStatus = (
  clients: Client[], 
  setClients: React.Dispatch<React.SetStateAction<Client[]>>,
  orderId: string, 
  newStatus: ShippingStatus
) => {
  const updatedClients = clients.map(client => {
    const updatedOrders = client.orders.map(order => {
      if (order.id === orderId) {
        const newStatusHistory = [
          ...order.statusHistory,
          {
            status: newStatus,
            timestamp: new Date().toISOString(),
            notificationSent: false
          }
        ];
        
        return {
          ...order,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          statusHistory: newStatusHistory
        };
      }
      return order;
    });

    let clientStatus = client.status;
    const allFinished = updatedOrders.every(
      order => order.status === "arrived_in_argentina"
    );
    const someActive = updatedOrders.some(
      order => order.status !== "arrived_in_argentina" && 
              order.status !== "purchased"
    );

    if (allFinished) {
      clientStatus = "finished";
    } else if (someActive) {
      clientStatus = "active";
    } else {
      clientStatus = "pending";
    }

    return {
      ...client,
      orders: updatedOrders,
      status: clientStatus
    };
  });

  setClients(updatedClients);
  
  return updatedClients;
};

export const sendWhatsAppNotification = async (
  clients: Client[],
  setClients: React.Dispatch<React.SetStateAction<Client[]>>, 
  whatsAppSettings: WhatsAppSettings,
  order: Order, 
  client: Client
): Promise<boolean> => {
  if (!whatsAppSettings.notificationsEnabled) {
    console.log("Notificaciones por WhatsApp deshabilitadas");
    return false;
  }

  console.log(`Enviando notificación desde ${whatsAppSettings.whatsappNumber} a ${client.name} (${client.phone}) para el pedido ${order.id}`);
  console.log(`Estado actualizado a: ${shippingStatusMap[order.status]}`);
  
  let messageTemplate = whatsAppSettings.messageTemplates?.find(
    template => template.status === order.status && template.enabled
  );
  
  const message = messageTemplate 
    ? applyTemplateVariables(messageTemplate.template, client, order)
    : `Hola ${client.name}, tu pedido "${order.productDescription}" ha sido actualizado al estado: ${shippingStatusMap[order.status]}`;
  
  console.log("Mensaje a enviar:", message);
  
  try {
    let success = false;
    
    // Comprueba si debemos usar el modo de respaldo directamente
    if (config.whatsapp.fallbackMode || !whatsAppSettings.useWhatsAppAPI) {
      // Método de respaldo: abrir directamente el enlace de WhatsApp
      success = await sendFallbackWhatsAppLink(client.phone, message);
    } else {
      // Intenta primero el método de API
      try {
        const apiTimeout = new Promise<boolean>((_, reject) => {
          setTimeout(() => reject(new Error("Timeout al contactar la API")), config.whatsapp.directLinkTimeout);
        });
        
        const apiRequest = useWhatsAppApi(whatsAppSettings, client.phone, message);
        
        // Usar Promise.race para implementar un timeout
        success = await Promise.race([apiRequest, apiTimeout]);
      } catch (apiError) {
        console.warn("Error al enviar por API de WhatsApp, usando método de respaldo:", apiError);
        success = await sendFallbackWhatsAppLink(client.phone, message);
      }
    }
    
    if (success) {
      toast.success(`Notificación enviada a ${client.name}`, {
        description: `Estado: ${shippingStatusMap[order.status]}`,
        duration: 3000,
      });
      
      const updatedClients = clients.map(c => {
        if (c.id === client.id) {
          const updatedOrders = c.orders.map(o => {
            if (o.id === order.id) {
              const updatedHistory = o.statusHistory.map((h, index) => {
                if (index === o.statusHistory.length - 1) {
                  return { ...h, notificationSent: true };
                }
                return h;
              });
              
              return { ...o, statusHistory: updatedHistory };
            }
            return o;
          });
          
          return { ...c, orders: updatedOrders };
        }
        return c;
      });
      
      setClients(updatedClients);
      return true;
    } else {
      throw new Error("Error al enviar mensaje");
    }
  } catch (error) {
    console.error("Error al enviar notificación de WhatsApp:", error);
    toast.error("Error al enviar notificación de WhatsApp", {
      description: "Por favor revise la configuración e intente nuevamente.",
    });
    return false;
  }
};

// Función para usar la API de WhatsApp (solo si está configurada)
const useWhatsAppApi = async (
  whatsAppSettings: WhatsAppSettings, 
  phone: string, 
  message: string
): Promise<boolean> => {
  const apiEndpoint = "/api/send-whatsapp";
  
  const payload = {
    to: phone,
    from: whatsAppSettings.whatsappNumber,
    message: message,
    provider: whatsAppSettings.provider,
    credentials: {
      apiKey: whatsAppSettings.provider === "direct" ? whatsAppSettings.apiKey : undefined,
      twilioSid: whatsAppSettings.provider === "twilio" ? whatsAppSettings.twilioAccountSid : undefined,
      twilioToken: whatsAppSettings.provider === "twilio" ? whatsAppSettings.twilioAuthToken : undefined
    }
  };
  
  const response = await fetch(apiEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    throw new Error("Error en la API de WhatsApp");
  }
  
  const data = await response.json();
  return data.success;
};

// Método alternativo: enlaces directos a WhatsApp (siempre funciona)
const sendFallbackWhatsAppLink = async (phone: string, message: string): Promise<boolean> => {
  try {
    // Limpia el número de teléfono y asegura que no tenga espacios o caracteres especiales
    const cleanPhone = phone.replace(/[\s+\-()]/g, '');
    
    // Usa la API URL de WhatsApp
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    console.log("Abriendo enlace de WhatsApp:", whatsappUrl);
    
    // Abre en nueva pestaña
    window.open(whatsappUrl, "_blank");
    return true;
  } catch (error) {
    console.error("Error al abrir enlace de WhatsApp:", error);
    return false;
  }
};

// Funciones auxiliares para envío de mensajes (no implementadas en este ejemplo)
const sendViaWhatsAppAPI = async (phone: string, message: string, apiKey: string): Promise<boolean> => {
  try {
    console.log(`Enviando mensaje a ${phone} usando la API de WhatsApp Business`);
    console.log("Esta función debe implementarse en el servidor backend");
    return true;
  } catch (error) {
    console.error("Error al enviar mensaje por WhatsApp API:", error);
    return false;
  }
};

const sendViaTwilio = async (
  toPhone: string, 
  message: string, 
  fromPhone: string,
  accountSid: string,
  authToken: string
): Promise<boolean> => {
  try {
    console.log(`Enviando mensaje a ${toPhone} usando Twilio`);
    console.log("Esta función debe implementarse en el servidor backend");
    return true;
  } catch (error) {
    console.error("Error al enviar mensaje por Twilio:", error);
    return false;
  }
};

export const addOrder = (
  clients: Client[], 
  setClients: React.Dispatch<React.SetStateAction<Client[]>>, 
  orderData: { clientId: string; productDescription: string; store: string; trackingNumber?: string }
) => {
  const client = getClientById(clients, orderData.clientId);
  
  if (!client) {
    toast.error("Cliente no encontrado");
    return;
  }
  
  const newOrder: Order = {
    id: `order-${Date.now()}`,
    clientId: orderData.clientId,
    productDescription: orderData.productDescription,
    store: orderData.store || "Sin tienda",
    trackingNumber: orderData.trackingNumber || undefined,
    status: "purchased",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    statusHistory: [
      {
        status: "purchased" as ShippingStatus,
        timestamp: new Date().toISOString(),
        notificationSent: false
      }
    ]
  };
  
  const updatedClients = clients.map(c => {
    if (c.id === client.id) {
      const newStatus = c.status === "pending" ? "active" : c.status;
      
      return {
        ...c,
        orders: [...c.orders, newOrder],
        status: newStatus
      };
    }
    return c;
  });
  
  setClients(updatedClients);
  
  toast.success(`Pedido creado para ${client.name}`, {
    description: `${orderData.productDescription} - ${orderData.store}`,
  });
};

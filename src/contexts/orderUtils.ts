import { Client, Order, ShippingStatus } from "@/lib/types";
import { toast } from "sonner";
import { getClientById } from "./clientUtils";
import { shippingStatusMap } from "@/lib/data";
import { WhatsAppSettings } from "./types";

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
  
  const message = `Hola ${client.name}, tu pedido "${order.productDescription}" ha sido actualizado al estado: ${shippingStatusMap[order.status]}`;
  console.log("Mensaje a enviar:", message);
  
  try {
    let success = false;
    
    if (whatsAppSettings.useWhatsAppAPI) {
      if (whatsAppSettings.provider === "twilio" && whatsAppSettings.twilioAccountSid && whatsAppSettings.twilioAuthToken) {
        // Usar Twilio para enviar el mensaje
        success = await sendViaTwilio(
          client.phone, 
          message, 
          whatsAppSettings.whatsappNumber,
          whatsAppSettings.twilioAccountSid, 
          whatsAppSettings.twilioAuthToken
        );
      } else if (whatsAppSettings.provider === "direct" && whatsAppSettings.apiKey) {
        // Usar la API oficial de WhatsApp Business
        success = await sendViaWhatsAppAPI(client.phone, message, whatsAppSettings.apiKey);
      } else {
        throw new Error("Configuración de API incompleta");
      }
    } else {
      // Usar el método de enlace wa.me (demostración)
      const whatsappUrl = `https://wa.me/${client.phone.replace(/\+/g, '')}?text=${encodeURIComponent(message)}`;
      console.log("URL de WhatsApp (demostración):", whatsappUrl);
      success = true; // Asumimos éxito en modo demostración
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

// Función para enviar mensaje usando la API oficial de WhatsApp Business
const sendViaWhatsAppAPI = async (phone: string, message: string, apiKey: string): Promise<boolean> => {
  try {
    console.log(`Enviando mensaje a ${phone} usando la API de WhatsApp Business`);
    
    // Normalizamos el número de teléfono (eliminar + y cualquier espacio)
    const normalizedPhone = phone.replace(/\+|\s/g, '');
    
    // Esta es una simulación de la llamada a la API de WhatsApp Business
    // En una implementación real, aquí se haría una solicitud fetch o axios
    // a los endpoints oficiales de WhatsApp Business API
    
    /*
    // Ejemplo de cómo sería la llamada real a la API de Meta/WhatsApp Business
    const response = await fetch('https://graph.facebook.com/v17.0/YOUR_PHONE_NUMBER_ID/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalizedPhone,
        type: "text",
        text: {
          body: message
        }
      })
    });
    
    const data = await response.json();
    return data.messages && data.messages[0].id;
    */
    
    // Para esta demostración, simplemente simulamos una respuesta exitosa
    console.log("Simulando envío por API de WhatsApp Business:", {
      to: normalizedPhone,
      message: message,
      apiKey: `${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)}`
    });
    
    // En este ejemplo de demostración, siempre devolvemos éxito
    return true;
  } catch (error) {
    console.error("Error al enviar mensaje por WhatsApp API:", error);
    return false;
  }
};

// Nueva función para enviar mensaje usando Twilio
const sendViaTwilio = async (
  toPhone: string, 
  message: string, 
  fromPhone: string,
  accountSid: string,
  authToken: string
): Promise<boolean> => {
  try {
    console.log(`Enviando mensaje a ${toPhone} usando Twilio`);
    
    // Normalizamos los números de teléfono (eliminar + y cualquier espacio)
    const normalizedToPhone = toPhone.replace(/\+|\s/g, '');
    const normalizedFromPhone = fromPhone.replace(/\+|\s/g, '');
    
    // Esta es una simulación de la llamada a la API de Twilio
    // En una implementación real, aquí se haría una solicitud fetch o axios
    // a los endpoints oficiales de Twilio
    
    /*
    // Ejemplo de cómo sería la llamada real a la API de Twilio
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: `whatsapp:+${normalizedFromPhone}`,
        To: `whatsapp:+${normalizedToPhone}`,
        Body: message
      })
    };
    
    const response = await fetch(url, options);
    const data = await response.json();
    return !!data.sid;
    */
    
    // Para esta demostración, simplemente simulamos una respuesta exitosa
    console.log("Simulando envío por Twilio:", {
      from: `whatsapp:+${normalizedFromPhone}`,
      to: `whatsapp:+${normalizedToPhone}`,
      message: message,
      credentials: `${accountSid.substring(0, 4)}...${authToken.substring(0, 4)}...`,
    });
    
    // En este ejemplo de demostración, siempre devolvemos éxito
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
    store: orderData.store,
    trackingNumber: orderData.trackingNumber || undefined,
    status: "purchased",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    statusHistory: [
      {
        status: "purchased",
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

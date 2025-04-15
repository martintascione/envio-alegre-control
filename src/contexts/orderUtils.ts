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

  let message = template
    .replace(/\[cliente\]/g, client.name || "Cliente")
    .replace(/\[comercio\]/g, order.store || "Tienda")
    .replace(/\[pedido\]/g, order.productDescription || "Producto")
    .replace(/\[fecha\]/g, formattedEstimatedDate)
    .replace(/\[tracking\]/g, order.trackingNumber || "Sin número de tracking");
    
  if (!message.includes(shippingStatusMap[order.status])) {
    message += `\n\nEstado actual: ${shippingStatusMap[order.status]}`;
  }
    
  return message;
};

export const updateOrderStatus = (
  clients: Client[], 
  setClients: React.Dispatch<React.SetStateAction<Client[]>>,
  orderId: string, 
  newStatus: ShippingStatus
) => {
  console.log(`Actualizando estado del pedido ${orderId} a ${newStatus}`);
  
  if (!clients || !Array.isArray(clients) || clients.length === 0) {
    console.error("Lista de clientes inválida al actualizar estado");
    return clients;
  }
  
  if (!orderId || !newStatus) {
    console.error("ID de pedido o estado inválido");
    return clients;
  }
  
  const updatedClients = clients.map(client => {
    if (!client || !Array.isArray(client.orders)) {
      return client;
    }
    
    const updatedOrders = client.orders.map(order => {
      if (order.id === orderId) {
        const statusHistory = Array.isArray(order.statusHistory) ? 
          [...order.statusHistory] : [];
          
        const statusExists = statusHistory.some(
          history => history.status === newStatus
        );
        
        if (!statusExists) {
          statusHistory.push({
            status: newStatus,
            timestamp: new Date().toISOString(),
            notificationSent: false
          });
        }
        
        return {
          ...order,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          statusHistory: statusHistory
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

  console.log(`Enviando notificación a ${client.name} (${client.phone}) para el pedido ${order.id}`);
  console.log(`Estado actual del pedido: ${shippingStatusMap[order.status]}`);
  
  try {
    let messageTemplate = whatsAppSettings.messageTemplates?.find(
      template => template.status === order.status && template.enabled
    );
    
    let message;
    if (messageTemplate) {
      message = applyTemplateVariables(messageTemplate.template, client, order);
    } else {
      message = `Hola ${client.name}! soy *importBot* 🤖\n📦 Pedido ${order.store}.\n▪️ ${order.productDescription}\n✅ Estado actual: ${shippingStatusMap[order.status]}\n\n_Servicio de notificación automática._`;
    }
    
    console.log("Mensaje a enviar:", message);
    
    const success = await sendFallbackWhatsAppLink(client.phone, message);
    
    if (success) {
      toast.success(`Notificación enviada a ${client.name}`, {
        description: `Estado: ${shippingStatusMap[order.status]}`,
      });
      
      const updatedClients = clients.map(c => {
        if (c.id === client.id) {
          const updatedOrders = c.orders.map(o => {
            if (o.id === order.id) {
              const updatedHistory = Array.isArray(o.statusHistory) ? 
                o.statusHistory.map((h, index) => {
                  if (h.status === order.status) {
                    return { ...h, notificationSent: true };
                  }
                  return h;
                }) : [];
              
              return { ...o, statusHistory: updatedHistory };
            }
            return o;
          });
          
          return { ...c, orders: updatedOrders };
        }
        return c;
      });
      
      setClients(updatedClients);
      
      const localData = localStorage.getItem('demo_clients');
      if (localData) {
        localStorage.setItem('demo_clients', JSON.stringify(updatedClients));
      }
      
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

const sendFallbackWhatsAppLink = async (phone: string, message: string): Promise<boolean> => {
  try {
    const cleanPhone = phone.replace(/[\s+\-()]/g, '');
    
    if (!cleanPhone || cleanPhone.length < 5) {
      console.error("Número de teléfono inválido:", phone);
      return false;
    }
    
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    console.log("Abriendo enlace de WhatsApp:", whatsappUrl);
    
    window.open(whatsappUrl, "_blank");
    return true;
  } catch (error) {
    console.error("Error al abrir enlace de WhatsApp:", error);
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

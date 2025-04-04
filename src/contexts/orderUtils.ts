
import { Client, Order, ShippingStatus } from "@/lib/types";
import { toast } from "sonner";
import { getClientById } from "./clientUtils";
import { shippingStatusMap } from "@/lib/data";

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
  whatsAppSettings: { whatsappNumber: string; notificationsEnabled: boolean; autoNotify: boolean },
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
  
  const sendWhatsAppAPI = async () => {
    const whatsappUrl = `https://wa.me/${client.phone.replace(/\+/g, '')}?text=${encodeURIComponent(message)}`;
    console.log("URL de WhatsApp (demostración):", whatsappUrl);
    
    toast.success(`Notificación enviada a ${client.name}`, {
      description: `Estado: ${shippingStatusMap[order.status]}`,
      duration: 3000,
    });
    
    return true;
  };
  
  try {
    await sendWhatsAppAPI();
    
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
  } catch (error) {
    console.error("Error al enviar notificación de WhatsApp:", error);
    toast.error("Error al enviar notificación de WhatsApp", {
      description: "Por favor revise la configuración e intente nuevamente.",
    });
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

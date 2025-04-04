
import React, { createContext, useContext, useState, useEffect } from "react";
import { Client, DashboardStats, Order, ShippingStatus } from "@/lib/types";
import { calculateDashboardStats, mockClients, shippingStatusMap } from "@/lib/data";
import { toast } from "sonner";

interface WhatsAppSettings {
  whatsappNumber: string;
  notificationsEnabled: boolean;
  autoNotify: boolean;
}

interface AppContextType {
  clients: Client[];
  dashboardStats: DashboardStats;
  updateOrderStatus: (orderId: string, newStatus: ShippingStatus) => void;
  sendWhatsAppNotification: (order: Order, client: Client) => Promise<boolean>;
  getClientById: (clientId: string) => Client | undefined;
  getOrderById: (orderId: string) => {order: Order, client: Client} | undefined;
  filterClients: (status?: string, searchTerm?: string) => Client[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>(
    calculateDashboardStats(mockClients)
  );
  const [whatsAppSettings, setWhatsAppSettings] = useState<WhatsAppSettings>({
    whatsappNumber: "+5491112345678",
    notificationsEnabled: true,
    autoNotify: true
  });

  useEffect(() => {
    // Load WhatsApp settings from localStorage
    const savedSettings = localStorage.getItem('whatsappSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings) as WhatsAppSettings;
        setWhatsAppSettings(settings);
      } catch (error) {
        console.error("Error parsing saved WhatsApp settings:", error);
      }
    }
  }, []);

  useEffect(() => {
    // Recalcular estadísticas cuando cambian los clientes
    setDashboardStats(calculateDashboardStats(clients));
  }, [clients]);

  const getClientById = (clientId: string): Client | undefined => {
    return clients.find(client => client.id === clientId);
  };

  const getOrderById = (orderId: string): {order: Order, client: Client} | undefined => {
    for (const client of clients) {
      const order = client.orders.find(order => order.id === orderId);
      if (order) {
        return { order, client };
      }
    }
    return undefined;
  };

  const updateOrderStatus = (orderId: string, newStatus: ShippingStatus) => {
    const updatedClients = clients.map(client => {
      const updatedOrders = client.orders.map(order => {
        if (order.id === orderId) {
          // Agregar el nuevo estado al historial
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

      // Actualizar el estado del cliente basado en sus pedidos
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
    
    // Buscar el cliente y orden actualizada para notificación
    const result = getOrderById(orderId);
    if (result) {
      const updatedOrder = updatedClients
        .find(c => c.id === result.client.id)?.orders
        .find(o => o.id === orderId);
        
      if (updatedOrder && whatsAppSettings.notificationsEnabled && whatsAppSettings.autoNotify) {
        const updatedClient = updatedClients.find(c => c.id === result.client.id);
        if (updatedClient) {
          sendWhatsAppNotification(updatedOrder, updatedClient);
        }
      }
    }
  };

  const sendWhatsAppNotification = async (order: Order, client: Client): Promise<boolean> => {
    // Verificar si las notificaciones están habilitadas
    if (!whatsAppSettings.notificationsEnabled) {
      console.log("Notificaciones por WhatsApp deshabilitadas");
      return false;
    }

    console.log(`Enviando notificación desde ${whatsAppSettings.whatsappNumber} a ${client.name} (${client.phone}) para el pedido ${order.id}`);
    console.log(`Estado actualizado a: ${shippingStatusMap[order.status]}`);
    
    // Simular envío a la API de WhatsApp
    const message = `Hola ${client.name}, tu pedido "${order.productDescription}" ha sido actualizado al estado: ${shippingStatusMap[order.status]}`;
    console.log("Mensaje a enviar:", message);
    
    // En una implementación real, aquí se llamaría a una API para enviar WhatsApp
    // Por ejemplo, WhatsApp Business API, Twilio, o servicios similares
    
    // Simulación de envío de WhatsApp
    const sendWhatsAppAPI = async () => {
      // Esta es una simulación. En una implementación real, 
      // se conectaría con alguna API de WhatsApp o Twilio
      
      // Ejemplo de URL para abrir WhatsApp web (solo para demostración)
      const whatsappUrl = `https://wa.me/${client.phone.replace(/\+/g, '')}?text=${encodeURIComponent(message)}`;
      console.log("URL de WhatsApp (demostración):", whatsappUrl);
      
      // Se podría abrir en una nueva ventana si el usuario quiere enviarlo manualmente
      // window.open(whatsappUrl, '_blank');
      
      // Mostrar toast de notificación enviada
      toast.success(`Notificación enviada a ${client.name}`, {
        description: `Estado: ${shippingStatusMap[order.status]}`,
        duration: 3000,
      });
      
      return true;
    };
    
    try {
      await sendWhatsAppAPI();
      
      // Actualizar el historial de estados para marcar la notificación como enviada
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

  const filterClients = (status?: string, searchTerm?: string): Client[] => {
    let filteredClients = [...clients];
    
    // Filtrar por estado si se especifica
    if (status && status !== 'all') {
      filteredClients = filteredClients.filter(client => client.status === status);
    }
    
    // Filtrar por término de búsqueda si se especifica
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredClients = filteredClients.filter(client => 
        client.name.toLowerCase().includes(term) || 
        client.email.toLowerCase().includes(term) ||
        client.phone.includes(term)
      );
    }
    
    return filteredClients;
  };

  return (
    <AppContext.Provider
      value={{
        clients,
        dashboardStats,
        updateOrderStatus,
        sendWhatsAppNotification,
        getClientById,
        getOrderById,
        filterClients
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

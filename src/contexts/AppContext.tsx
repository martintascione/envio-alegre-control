
import React, { createContext, useContext, useState, useEffect } from "react";
import { Client, DashboardStats, Order, ShippingStatus } from "@/lib/types";
import { calculateDashboardStats, mockClients, shippingStatusMap } from "@/lib/data";
import { toast } from "@/components/ui/sonner";

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
        
      if (updatedOrder) {
        const updatedClient = updatedClients.find(c => c.id === result.client.id);
        if (updatedClient) {
          sendWhatsAppNotification(updatedOrder, updatedClient);
        }
      }
    }
  };

  const sendWhatsAppNotification = async (order: Order, client: Client): Promise<boolean> => {
    // Simulamos el envío de notificaciones por WhatsApp
    console.log(`Enviando notificación a ${client.name} (${client.phone}) para el pedido ${order.id}`);
    console.log(`Estado actualizado a: ${shippingStatusMap[order.status]}`);
    
    // Mostrar toast de notificación enviada
    toast.success(`Notificación enviada a ${client.name}`, {
      description: `Estado: ${shippingStatusMap[order.status]}`,
      duration: 3000,
    });
    
    // Aquí se implementaría la integración real con la API de WhatsApp
    // Por ahora simulamos un éxito
    return new Promise(resolve => {
      setTimeout(() => {
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
        resolve(true);
      }, 1000);
    });
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


import React, { createContext, useContext, useState, useEffect } from "react";
import { Client, DashboardStats, Order, ShippingStatus } from "@/lib/types";
import { calculateDashboardStats } from "@/lib/data";
import { AppContextType } from "./types";
import { getClientById, getOrderById, filterClients } from "./clientUtils";
import { updateOrderStatus, sendWhatsAppNotification, addOrder } from "./orderUtils";
import { useWhatsAppSettings } from "./useWhatsAppSettings";
import { toast } from "sonner";
import { apiService } from "@/services/api";

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalClients: 0,
    activeClients: 0,
    pendingClients: 0,
    finishedClients: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });
  const { whatsAppSettings, setWhatsAppSettings } = useWhatsAppSettings();

  // Cargar clientes desde la API
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const data = await apiService.clients.getAll();
        setClients(data);
        setDashboardStats(calculateDashboardStats(data));
      } catch (error) {
        console.error("Error al cargar clientes:", error);
        toast.error("Error al cargar datos de clientes");
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Actualizar estadísticas cuando cambien los clientes
  useEffect(() => {
    setDashboardStats(calculateDashboardStats(clients));
  }, [clients]);

  const handleGetClientById = (clientId: string): Client | undefined => {
    return getClientById(clients, clientId);
  };

  const handleGetOrderById = (orderId: string): {order: Order, client: Client} | undefined => {
    return getOrderById(clients, orderId);
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: ShippingStatus) => {
    try {
      // Primero actualizar en el backend
      const result = getOrderById(clients, orderId);
      if (!result) return;
      
      await apiService.orders.updateStatus(orderId, newStatus);
      
      // Luego actualizar el estado local
      const updatedClients = updateOrderStatus(clients, setClients, orderId, newStatus);
      
      if (result) {
        const updatedOrder = updatedClients
          .find(c => c.id === result.client.id)?.orders
          .find(o => o.id === orderId);
          
        if (updatedOrder && whatsAppSettings.notificationsEnabled && whatsAppSettings.autoNotify) {
          const updatedClient = updatedClients.find(c => c.id === result.client.id);
          if (updatedClient) {
            sendWhatsAppNotification(updatedClients, setClients, whatsAppSettings, updatedOrder, updatedClient);
          }
        }
      }
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      toast.error("Error al actualizar el estado del pedido");
    }
  };

  const handleSendWhatsAppNotification = async (order: Order, client: Client): Promise<boolean> => {
    return sendWhatsAppNotification(clients, setClients, whatsAppSettings, order, client);
  };

  const handleFilterClients = (status?: string, searchTerm?: string): Client[] => {
    return filterClients(clients, status, searchTerm);
  };

  const handleAddClient = async (clientData: { name: string; email: string; phone: string }) => {
    try {
      // Primero guardar en el backend
      const newClient = await apiService.clients.create(clientData);
      
      // Luego actualizar el estado local
      setClients(prevClients => [...prevClients, newClient]);
      
      toast.success(`Cliente ${clientData.name} creado`, {
        description: "El cliente ha sido agregado correctamente",
      });
    } catch (error) {
      console.error("Error al crear cliente:", error);
      toast.error("Error al crear el cliente");
    }
  };

  const handleAddOrder = async (orderData: { clientId: string; productDescription: string; store: string; trackingNumber?: string }) => {
    try {
      // Primero guardar en el backend
      const newOrder = await apiService.orders.create(orderData);
      
      // Luego actualizar el estado local
      const client = getClientById(clients, orderData.clientId);
      if (!client) return;
      
      setClients(prevClients => prevClients.map(c => {
        if (c.id === orderData.clientId) {
          const newStatus = c.status === "pending" ? "active" : c.status;
          return {
            ...c,
            orders: [...c.orders, newOrder],
            status: newStatus
          };
        }
        return c;
      }));
      
      toast.success(`Pedido creado para ${client.name}`, {
        description: `${orderData.productDescription} - ${orderData.store}`,
      });
    } catch (error) {
      console.error("Error al crear pedido:", error);
      toast.error("Error al crear el pedido");
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    const client = getClientById(clients, clientId);
    if (!client) return;

    try {
      // Primero eliminar en el backend
      await apiService.clients.delete(clientId);
      
      // Luego actualizar el estado local
      setClients(prevClients => prevClients.filter(c => c.id !== clientId));
      
      toast.success(`Cliente ${client.name} eliminado`, {
        description: "El cliente ha sido eliminado correctamente",
      });
    } catch (error) {
      console.error("Error al eliminar cliente:", error);
      toast.error("Error al eliminar el cliente");
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    const orderData = getOrderById(clients, orderId);
    if (!orderData) return;

    const { order, client } = orderData;

    try {
      // Primero eliminar en el backend
      await apiService.orders.delete(orderId);
      
      // Luego actualizar el estado local
      const updatedClients = clients.map(c => {
        if (c.id === client.id) {
          const updatedOrders = c.orders.filter(o => o.id !== orderId);
          
          // Actualizar estado del cliente si es necesario
          let newStatus = c.status;
          if (updatedOrders.length === 0) {
            newStatus = "pending";
          } else if (updatedOrders.every(o => o.status === "arrived_in_argentina")) {
            newStatus = "finished";
          } else if (updatedOrders.some(o => o.status !== "purchased")) {
            newStatus = "active";
          } else {
            newStatus = "pending";
          }
          
          return { ...c, orders: updatedOrders, status: newStatus };
        }
        return c;
      });

      setClients(updatedClients);
      
      toast.success(`Pedido eliminado`, {
        description: `Se ha eliminado el pedido "${order.productDescription}" del cliente ${client.name}`,
      });
    } catch (error) {
      console.error("Error al eliminar pedido:", error);
      toast.error("Error al eliminar el pedido");
    }
  };

  return (
    <AppContext.Provider
      value={{
        clients,
        loading,
        dashboardStats,
        updateOrderStatus: handleUpdateOrderStatus,
        sendWhatsAppNotification: handleSendWhatsAppNotification,
        getClientById: handleGetClientById,
        getOrderById: handleGetOrderById,
        filterClients: handleFilterClients,
        addClient: handleAddClient,
        addOrder: handleAddOrder,
        deleteClient: handleDeleteClient,
        deleteOrder: handleDeleteOrder
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

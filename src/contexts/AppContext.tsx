import React, { createContext, useContext, useState, useEffect } from "react";
import { Client, DashboardStats, Order, ShippingStatus } from "@/lib/types";
import { calculateDashboardStats } from "@/lib/data";
import { AppContextType } from "./types";
import { getClientById, getOrderById, filterClients } from "./clientUtils";
import { updateOrderStatus, sendWhatsAppNotification, addOrder } from "./orderUtils";
import { useWhatsAppSettings } from "./useWhatsAppSettings";
import { toast } from "sonner";
import { apiService } from "@/services/api";

let isInitialLoad = true;

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [locallyAddedClients, setLocallyAddedClients] = useState<string[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalClients: 0,
    activeClients: 0,
    pendingClients: 0,
    finishedClients: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });
  const { whatsAppSettings } = useWhatsAppSettings();

  const fetchClients = async () => {
    if (loading && !isInitialLoad) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log("Obteniendo datos de clientes de la API...");
      
      const data = await apiService.clients.getAll();
      
      if (Array.isArray(data)) {
        const validData = data
          .filter(client => client && client.name && client.name !== "Cliente sin nombre")
          .map(client => ({
            ...client,
            orders: Array.isArray(client.orders) ? client.orders : []
          }));
          
        console.log(`Recibidos ${validData.length} clientes de la API`);
        
        setClients(prevClients => {
          const localClients = prevClients.filter(
            client => locallyAddedClients.includes(client.id)
          );
          
          const serverClientIds = validData.map(c => c.id);
          const nonDuplicateLocalClients = localClients.filter(
            client => !serverClientIds.includes(client.id)
          );
          
          return [...validData, ...nonDuplicateLocalClients];
        });
        
        setDashboardStats(calculateDashboardStats([...validData]));
      } else {
        console.error("Datos de API no válidos:", data);
        throw new Error("El formato de los datos recibidos no es válido");
      }
      
      setLastFetchTime(Date.now());
    } catch (error) {
      console.error("Error al cargar clientes:", error);
      setError("Error al cargar datos de clientes");
      toast.error("Error al cargar datos de clientes", {
        description: "Verifica tu conexión e inténtalo nuevamente"
      });
      
      const defaultClients = [
        {
          id: "default-client-1",
          name: "Cliente Predeterminado",
          email: "cliente@ejemplo.com",
          phone: "000000000",
          status: "pending" as const,
          orders: []
        }
      ];
      
      setClients(defaultClients);
      setDashboardStats(calculateDashboardStats(defaultClients));
    } finally {
      setLoading(false);
      isInitialLoad = false;
    }
  };

  useEffect(() => {
    fetchClients();
    
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !isInitialLoad) {
        fetchClients();
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isInitialLoad) {
        if (Date.now() - lastFetchTime > 30000) {
          fetchClients();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [lastFetchTime]);

  useEffect(() => {
    if (Array.isArray(clients)) {
      setDashboardStats(calculateDashboardStats(clients));
    } else {
      console.error("clients no es un array en useEffect:", clients);
      setDashboardStats(calculateDashboardStats([]));
    }
  }, [clients]);

  const handleGetClientById = (clientId: string): Client | undefined => {
    return getClientById(clients, clientId);
  };

  const handleGetOrderById = (orderId: string): {order: Order, client: Client} | undefined => {
    return getOrderById(clients, orderId);
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: ShippingStatus) => {
    try {
      const result = getOrderById(clients, orderId);
      if (!result) return;
      
      await apiService.orders.updateStatus(orderId, newStatus);
      console.log(`Estado actualizado en el servidor para orden ${orderId}: ${newStatus}`);
      
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
    const validClients = Array.isArray(clients) ? clients.filter(client => 
      client && client.id && client.name && client.name !== "Cliente sin nombre"
    ) : [];
    
    return filterClients(validClients, status, searchTerm);
  };

  const handleAddClient = async (clientData: { name: string; email: string; phone: string }) => {
    try {
      console.log("Creando nuevo cliente:", clientData);
      
      if (!clientData.name || !clientData.email || !clientData.phone) {
        toast.error("Los datos del cliente son incompletos");
        return;
      }
      
      const clientId = `client-${Date.now()}`;
      const newClientFull: Client = {
        id: clientId,
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        status: "pending",
        orders: []
      };
      
      let newClient;
      try {
        newClient = await apiService.clients.create(clientData);
        console.log("Cliente creado en el servidor:", newClient);
      } catch (apiError) {
        console.warn("Error al crear cliente en API, usando cliente local:", apiError);
        newClient = newClientFull;
      }
      
      const completeNewClient: Client = {
        ...newClientFull,
        ...newClient,
        id: newClient.id || newClientFull.id,
        status: newClient.status || "pending",
        orders: Array.isArray(newClient.orders) ? newClient.orders : []
      };
      
      setClients(prevClients => {
        const filteredClients = prevClients.filter(c => 
          c && c.id && c.name && c.name !== "Cliente sin nombre" && 
          c.id !== completeNewClient.id && c.email !== completeNewClient.email
        );
        
        const updated = [...filteredClients, completeNewClient];
        console.log("Estado local actualizado con el nuevo cliente");
        return updated;
      });
      
      setLocallyAddedClients(prev => [...prev, completeNewClient.id]);
      
      toast.success(`Cliente ${clientData.name} creado`, {
        description: "El cliente ha sido agregado correctamente",
      });
      
      return completeNewClient;
    } catch (error) {
      console.error("Error al crear cliente:", error);
      toast.error("Error al crear el cliente");
      throw error;
    }
  };

  const handleAddOrder = async (orderData: { clientId: string; productDescription: string; store: string; trackingNumber?: string }) => {
    try {
      console.log("Creando nuevo pedido:", orderData);
      
      if (!orderData.clientId || !orderData.productDescription) {
        toast.error("Datos de pedido incompletos");
        return;
      }
      
      const orderId = `order-${Date.now()}`;
      const timestamp = new Date().toISOString();
      
      const newOrderFull: Order = {
        id: orderId,
        clientId: orderData.clientId,
        productDescription: orderData.productDescription,
        store: orderData.store || "Sin tienda",
        trackingNumber: orderData.trackingNumber || "",
        status: "purchased" as ShippingStatus,
        createdAt: timestamp,
        updatedAt: timestamp,
        statusHistory: [
          {
            status: "purchased" as ShippingStatus,
            timestamp: timestamp,
            notificationSent: false
          }
        ]
      };
      
      let savedOrder;
      try {
        savedOrder = await apiService.orders.create(orderData);
        console.log("Pedido creado en el servidor:", savedOrder);
      } catch (apiError) {
        console.warn("Error al crear pedido en API, usando pedido local:", apiError);
        savedOrder = newOrderFull;
      }
      
      const completeOrder: Order = {
        ...newOrderFull,
        ...savedOrder,
        id: savedOrder.id || newOrderFull.id,
        clientId: orderData.clientId,
        status: savedOrder.status || "purchased",
        createdAt: savedOrder.createdAt || timestamp,
        updatedAt: savedOrder.updatedAt || timestamp,
        statusHistory: Array.isArray(savedOrder.statusHistory) ? savedOrder.statusHistory : newOrderFull.statusHistory
      };
      
      setClients(prevClients => prevClients.map(c => {
        if (c.id === orderData.clientId) {
          const currentOrders = Array.isArray(c.orders) ? c.orders : [];
          
          const newStatus = c.status === "pending" ? "active" : c.status;
          
          return {
            ...c,
            status: newStatus,
            orders: [...currentOrders, completeOrder]
          };
        }
        return c;
      }));
      
      const client = getClientById(clients, orderData.clientId);
      
      toast.success(`Pedido creado${client ? ` para ${client.name}` : ''}`, {
        description: `${orderData.productDescription} - ${orderData.store || 'Sin tienda'}`,
      });
      
      setTimeout(() => refreshData(), 1000);
      
      return completeOrder;
    } catch (error) {
      console.error("Error al crear pedido:", error);
      toast.error("Error al crear el pedido");
      return null;
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    const client = getClientById(clients, clientId);
    if (!client) return;

    try {
      console.log(`Eliminando cliente ${clientId}...`);
      
      await apiService.clients.delete(clientId);
      console.log(`Cliente ${clientId} eliminado en el servidor`);
      
      setClients(prevClients => prevClients.filter(c => c.id !== clientId));
      
      toast.success(`Cliente ${client.name} eliminado`, {
        description: "El cliente ha sido eliminado correctamente",
      });
      
      setTimeout(() => fetchClients(), 1000);
      
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
      console.log(`Eliminando pedido ${orderId}...`);
      
      await apiService.orders.delete(orderId);
      console.log(`Pedido ${orderId} eliminado en el servidor`);
      
      const updatedClients = clients.map(c => {
        if (c.id === client.id) {
          const updatedOrders = c.orders.filter(o => o.id !== orderId);
          
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
      
      setTimeout(() => fetchClients(), 1000);
      
    } catch (error) {
      console.error("Error al eliminar pedido:", error);
      toast.error("Error al eliminar el pedido");
    }
  };

  const refreshData = () => {
    fetchClients();
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
        deleteOrder: handleDeleteOrder,
        refreshData
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

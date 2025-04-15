
import React, { createContext, useContext, useState, useEffect } from "react";
import { Client, DashboardStats, Order, ShippingStatus } from "@/lib/types";
import { calculateDashboardStats } from "@/lib/data";
import { AppContextType } from "./types";
import { getClientById, getOrderById, filterClients } from "./clientUtils";
import { updateOrderStatus, sendWhatsAppNotification, addOrder } from "./orderUtils";
import { useWhatsAppSettings } from "./useWhatsAppSettings";
import { toast } from "sonner";
import { apiService } from "@/services/api";

// Constante para evitar múltiples fetchs durante la inicialización
let isInitialLoad = true;

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
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

  // Cargar clientes desde la API
  const fetchClients = async () => {
    // Evitar múltiples llamadas simultáneas
    if (loading && !isInitialLoad) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log("Obteniendo datos de clientes de la API...");
      
      const data = await apiService.clients.getAll();
      
      // Verificar que los datos son un array y que cada cliente tiene un array de órdenes
      if (Array.isArray(data)) {
        // Verificar y reparar datos si es necesario
        // Filtramos clientes sin nombre o con datos básicos vacíos
        const validData = data
          .filter(client => client && client.name && client.name !== "Cliente sin nombre")
          .map(client => ({
            ...client,
            // Asegurarse de que orders sea siempre un array
            orders: Array.isArray(client.orders) ? client.orders : []
          }));
          
        console.log(`Recibidos ${validData.length} clientes de la API`);
        setClients(validData);
        setDashboardStats(calculateDashboardStats(validData));
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
      
      // Usar datos de respaldo predeterminados en caso de error
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

  // Cargar clientes al montar el componente
  useEffect(() => {
    fetchClients();
    
    // Actualizar datos cada 60 segundos si la ventana está activa
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchClients();
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Escuchar eventos de visibilidad para recargar datos cuando el usuario regresa a la página
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Solo recargar si han pasado al menos 30 segundos desde la última carga
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

  // Actualizar estadísticas cuando cambien los clientes
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
      // Primero actualizar en el backend
      const result = getOrderById(clients, orderId);
      if (!result) return;
      
      await apiService.orders.updateStatus(orderId, newStatus);
      console.log(`Estado actualizado en el servidor para orden ${orderId}: ${newStatus}`);
      
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
    // Asegurarnos de que hay clientes válidos antes de filtrarlos
    const validClients = Array.isArray(clients) ? clients.filter(client => 
      client && client.id && client.name && client.name !== "Cliente sin nombre"
    ) : [];
    
    return filterClients(validClients, status, searchTerm);
  };

  const handleAddClient = async (clientData: { name: string; email: string; phone: string }) => {
    try {
      console.log("Creando nuevo cliente:", clientData);
      
      // Verificar que no están vacíos los datos
      if (!clientData.name || !clientData.email || !clientData.phone) {
        toast.error("Los datos del cliente son incompletos");
        return;
      }
      
      // Crear un cliente completo con todos los campos necesarios
      const newClientFull: Client = {
        id: `client-${Date.now()}`,
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        status: "pending",
        orders: []
      };
      
      // Intentar guardar en el backend
      let newClient;
      try {
        newClient = await apiService.clients.create(clientData);
        console.log("Cliente creado en el servidor:", newClient);
      } catch (apiError) {
        console.warn("Error al crear cliente en API, usando cliente local:", apiError);
        // Si falla la API, usamos nuestro cliente local
        newClient = newClientFull;
      }
      
      // Asegurarnos de que el cliente tenga todos los campos requeridos
      const completeNewClient: Client = {
        ...newClientFull,
        ...newClient,
        // Asegurarnos de que siempre tiene estos campos
        id: newClient.id || newClientFull.id,
        status: newClient.status || "pending",
        orders: Array.isArray(newClient.orders) ? newClient.orders : []
      };
      
      // Actualizar el estado local
      setClients(prevClients => {
        // Filtrar cualquier cliente duplicado o sin nombre antes de agregar el nuevo
        const filteredClients = prevClients.filter(c => 
          c && c.id && c.name && c.name !== "Cliente sin nombre" && 
          c.id !== completeNewClient.id && c.email !== completeNewClient.email
        );
        
        const updated = [...filteredClients, completeNewClient];
        console.log("Estado local actualizado con el nuevo cliente");
        return updated;
      });
      
      toast.success(`Cliente ${clientData.name} creado`, {
        description: "El cliente ha sido agregado correctamente",
      });
      
      // Recargar datos para asegurar sincronización
      setTimeout(() => fetchClients(), 1000);
      
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
      
      // Guardar en el backend
      const newOrder = await apiService.orders.create(orderData);
      console.log("Pedido creado en el servidor:", newOrder);
      
      // Actualizar el estado local
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
      
      // Recargar datos para asegurar sincronización
      setTimeout(() => fetchClients(), 1000);
      
    } catch (error) {
      console.error("Error al crear pedido:", error);
      toast.error("Error al crear el pedido");
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    const client = getClientById(clients, clientId);
    if (!client) return;

    try {
      console.log(`Eliminando cliente ${clientId}...`);
      
      // Eliminar en el backend
      await apiService.clients.delete(clientId);
      console.log(`Cliente ${clientId} eliminado en el servidor`);
      
      // Actualizar el estado local
      setClients(prevClients => prevClients.filter(c => c.id !== clientId));
      
      toast.success(`Cliente ${client.name} eliminado`, {
        description: "El cliente ha sido eliminado correctamente",
      });
      
      // Recargar datos para asegurar sincronización
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
      
      // Eliminar en el backend
      await apiService.orders.delete(orderId);
      console.log(`Pedido ${orderId} eliminado en el servidor`);
      
      // Actualizar el estado local
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
      
      // Recargar datos para asegurar sincronización
      setTimeout(() => fetchClients(), 1000);
      
    } catch (error) {
      console.error("Error al eliminar pedido:", error);
      toast.error("Error al eliminar el pedido");
    }
  };

  // Función para forzar una recarga de datos
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

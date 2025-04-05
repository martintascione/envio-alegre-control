import React, { createContext, useContext, useState, useEffect } from "react";
import { Client, DashboardStats, Order, ShippingStatus } from "@/lib/types";
import { calculateDashboardStats, mockClients } from "@/lib/data";
import { AppContextType } from "./types";
import { getClientById, getOrderById, filterClients, addClient } from "./clientUtils";
import { updateOrderStatus, sendWhatsAppNotification, addOrder } from "./orderUtils";
import { useWhatsAppSettings } from "./useWhatsAppSettings";
import { toast } from "sonner";

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>(
    calculateDashboardStats(mockClients)
  );
  const { whatsAppSettings, setWhatsAppSettings } = useWhatsAppSettings();

  useEffect(() => {
    setDashboardStats(calculateDashboardStats(clients));
  }, [clients]);

  const handleGetClientById = (clientId: string): Client | undefined => {
    return getClientById(clients, clientId);
  };

  const handleGetOrderById = (orderId: string): {order: Order, client: Client} | undefined => {
    return getOrderById(clients, orderId);
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: ShippingStatus) => {
    const updatedClients = updateOrderStatus(clients, setClients, orderId, newStatus);
    
    const result = getOrderById(clients, orderId);
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
  };

  const handleSendWhatsAppNotification = async (order: Order, client: Client): Promise<boolean> => {
    return sendWhatsAppNotification(clients, setClients, whatsAppSettings, order, client);
  };

  const handleFilterClients = (status?: string, searchTerm?: string): Client[] => {
    return filterClients(clients, status, searchTerm);
  };

  const handleAddClient = (clientData: { name: string; email: string; phone: string }) => {
    addClient(clients, setClients, clientData);
  };

  const handleAddOrder = (orderData: { clientId: string; productDescription: string; store: string; trackingNumber?: string }) => {
    addOrder(clients, setClients, orderData);
  };

  const handleDeleteClient = (clientId: string) => {
    const client = getClientById(clients, clientId);
    if (!client) return;

    setClients(prevClients => prevClients.filter(c => c.id !== clientId));
    
    toast.success(`Cliente ${client.name} eliminado`, {
      description: "El cliente ha sido eliminado correctamente",
    });
  };

  const handleDeleteOrder = (orderId: string) => {
    const orderData = getOrderById(clients, orderId);
    if (!orderData) return;

    const { order, client } = orderData;

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
  };

  return (
    <AppContext.Provider
      value={{
        clients,
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

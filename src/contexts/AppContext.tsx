
import React, { createContext, useContext, useState, useEffect } from "react";
import { Client, DashboardStats, Order, ShippingStatus } from "@/lib/types";
import { calculateDashboardStats, mockClients } from "@/lib/data";
import { AppContextType } from "./types";
import { getClientById, getOrderById, filterClients, addClient } from "./clientUtils";
import { updateOrderStatus, sendWhatsAppNotification, addOrder } from "./orderUtils";
import { useWhatsAppSettings } from "./useWhatsAppSettings";

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>(
    calculateDashboardStats(mockClients)
  );
  const { whatsAppSettings } = useWhatsAppSettings();

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
        addOrder: handleAddOrder
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

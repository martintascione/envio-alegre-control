
import { Client, DashboardStats, Order, ShippingStatus } from "@/lib/types";

export interface WhatsAppSettings {
  whatsappNumber: string;
  notificationsEnabled: boolean;
  autoNotify: boolean;
  apiKey: string;
  useWhatsAppAPI: boolean;
}

export interface AppContextType {
  clients: Client[];
  dashboardStats: DashboardStats;
  updateOrderStatus: (orderId: string, newStatus: ShippingStatus) => void;
  sendWhatsAppNotification: (order: Order, client: Client) => Promise<boolean>;
  getClientById: (clientId: string) => Client | undefined;
  getOrderById: (orderId: string) => {order: Order, client: Client} | undefined;
  filterClients: (status?: string, searchTerm?: string) => Client[];
  addClient: (clientData: { name: string; email: string; phone: string }) => void;
  addOrder: (orderData: { clientId: string; productDescription: string; store: string; trackingNumber?: string }) => void;
}

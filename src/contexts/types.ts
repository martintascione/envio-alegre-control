
import { Client, DashboardStats, Order, ShippingStatus } from "@/lib/types";

export interface MessageTemplate {
  status: ShippingStatus;
  template: string;
  enabled: boolean;
}

export interface WhatsAppSettings {
  whatsappNumber: string;
  notificationsEnabled: boolean;
  autoNotify: boolean;
  apiKey: string;
  useWhatsAppAPI: boolean;
  provider: "direct" | "twilio";
  twilioAccountSid: string;
  twilioAuthToken: string;
  messageTemplates: MessageTemplate[];
}

export interface AppContextType {
  clients: Client[];
  loading: boolean;
  dashboardStats: DashboardStats;
  updateOrderStatus: (orderId: string, newStatus: ShippingStatus) => void;
  sendWhatsAppNotification: (order: Order, client: Client) => Promise<boolean>;
  getClientById: (clientId: string) => Client | undefined;
  getOrderById: (orderId: string) => {order: Order, client: Client} | undefined;
  filterClients: (status?: string, searchTerm?: string) => Client[];
  addClient: (clientData: { name: string; email: string; phone: string }) => void;
  addOrder: (orderData: { clientId: string; productDescription: string; store: string; trackingNumber?: string }) => void;
  deleteClient: (clientId: string) => void;
  deleteOrder: (orderId: string) => void;
}

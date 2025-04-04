
export type ShippingStatus = 
  | "purchased" 
  | "shipped_to_warehouse" 
  | "received_at_warehouse" 
  | "in_transit_to_argentina" 
  | "arrived_in_argentina";

export type OrderStatus = "active" | "pending" | "finished";

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  orders: Order[];
  status: OrderStatus;
}

export interface Order {
  id: string;
  clientId: string;
  productDescription: string;
  store: string;
  trackingNumber?: string;
  status: ShippingStatus;
  createdAt: string;
  updatedAt: string;
  statusHistory: StatusChange[];
}

export interface StatusChange {
  status: ShippingStatus;
  timestamp: string;
  notificationSent: boolean;
}

export interface DashboardStats {
  totalClients: number;
  activeClients: number;
  pendingClients: number;
  finishedClients: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
}

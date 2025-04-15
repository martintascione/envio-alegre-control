
import { Client, DashboardStats, Order, ShippingStatus } from "./types";

// Mapeo de estados de envío a sus descripciones en español
export const shippingStatusMap: Record<ShippingStatus, string> = {
  purchased: "Compra realizada en la web del comercio",
  shipped_to_warehouse: "Comercio realizó el envío a nuestro depósito en Miami",
  received_at_warehouse: "Recibimos la compra en nuestro depósito",
  in_transit_to_argentina: "Tu pedido está en viaje a Argentina",
  arrived_in_argentina: "Tu pedido llegó a Argentina"
};

// Función para generar un UUID simple
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

// Generar datos de clientes vacíos
export const generateMockClients = (): Client[] => {
  return [];
};

// Datos de clientes mock (vacío)
export const mockClients: Client[] = [];

// Calcular estadísticas del dashboard
export const calculateDashboardStats = (clients: Client[]): DashboardStats => {
  // Verificar que clients es un array válido
  if (!Array.isArray(clients)) {
    console.warn("calculateDashboardStats recibió clients inválidos:", clients);
    return {
      totalClients: 0,
      activeClients: 0,
      pendingClients: 0,
      finishedClients: 0,
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0
    };
  }
  
  const activeClients = clients.filter(client => client.status === "active").length;
  const pendingClients = clients.filter(client => client.status === "pending").length;
  const finishedClients = clients.filter(client => client.status === "finished").length;
  
  let pendingOrders = 0;
  let completedOrders = 0;
  let totalOrders = 0;
  
  clients.forEach(client => {
    // Verificar que client.orders es un array válido antes de iterarlo
    const orders = Array.isArray(client.orders) ? client.orders : [];
    
    orders.forEach(order => {
      totalOrders++;
      if (order.status === "arrived_in_argentina") {
        completedOrders++;
      } else {
        pendingOrders++;
      }
    });
  });
  
  return {
    totalClients: clients.length,
    activeClients,
    pendingClients,
    finishedClients,
    totalOrders,
    pendingOrders,
    completedOrders
  };
};

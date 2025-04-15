
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

// Generar datos de clientes de ejemplo
export const generateMockClients = (): Client[] => {
  const clients: Client[] = [];
  
  const names = [
    "Carlos Rodríguez", "María González", "Juan Pérez", "Laura Mendoza", 
    "Diego Sánchez", "Ana Martínez", "Fernando López", "Sofía García"
  ];
  
  const stores = [
    "Amazon", "eBay", "Walmart", "Best Buy", "Target", "Macy's", "Nike", "Apple"
  ];
  
  const products = [
    "iPhone 15", "MacBook Pro", "AirPods Pro", "PlayStation 5", 
    "Xbox Series X", "Samsung TV 4K", "Zapatillas Nike Air", 
    "Perfume Chanel", "Lentes Ray Ban", "Reloj Casio"
  ];
  
  names.forEach((name, index) => {
    const id = generateId();
    const orders: Order[] = [];
    
    // Cada cliente tiene entre 1 y 3 pedidos
    const numOrders = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numOrders; i++) {
      const statusValues: ShippingStatus[] = [
        "purchased",
        "shipped_to_warehouse",
        "received_at_warehouse",
        "in_transit_to_argentina",
        "arrived_in_argentina"
      ];
      
      const randomStatusIndex = Math.floor(Math.random() * statusValues.length);
      const status = statusValues[randomStatusIndex];
      
      const createdDate = new Date();
      createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 30));
      
      const updatedDate = new Date(createdDate);
      updatedDate.setDate(updatedDate.getDate() + Math.floor(Math.random() * 10));
      
      const statusHistory = [];
      for (let j = 0; j <= randomStatusIndex; j++) {
        const historyDate = new Date(createdDate);
        historyDate.setDate(historyDate.getDate() + j * 2);
        
        statusHistory.push({
          status: statusValues[j],
          timestamp: historyDate.toISOString(),
          notificationSent: true
        });
      }
      
      const randomStoreIndex = Math.floor(Math.random() * stores.length);
      const randomProductIndex = Math.floor(Math.random() * products.length);
      
      orders.push({
        id: generateId(),
        clientId: id,
        productDescription: products[randomProductIndex],
        store: stores[randomStoreIndex],
        trackingNumber: `TRK${Math.floor(Math.random() * 1000000)}`,
        status: status,
        createdAt: createdDate.toISOString(),
        updatedAt: updatedDate.toISOString(),
        statusHistory: statusHistory
      });
    }
    
    let clientStatus: "active" | "pending" | "finished" = "active";
    
    // Determinar el estado del cliente basado en sus pedidos
    const allFinished = orders.every(order => order.status === "arrived_in_argentina");
    const someActive = orders.some(order => 
      order.status !== "arrived_in_argentina" && 
      order.status !== "purchased"
    );
    
    if (allFinished) {
      clientStatus = "finished";
    } else if (someActive) {
      clientStatus = "active";
    } else {
      clientStatus = "pending";
    }
    
    clients.push({
      id,
      name,
      email: `${name.toLowerCase().replace(' ', '.')}@ejemplo.com`,
      phone: `+54911${Math.floor(Math.random() * 90000000) + 10000000}`,
      orders,
      status: clientStatus
    });
  });
  
  return clients;
};

// Datos de clientes mock
export const mockClients = generateMockClients();

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

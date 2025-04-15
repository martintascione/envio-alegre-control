
import { Client, Order } from "@/lib/types";
import { toast } from "sonner";

export const getClientById = (clients: Client[], clientId: string): Client | undefined => {
  // Verificar que clientes es un array válido y clientId no está vacío
  if (!Array.isArray(clients) || !clientId) return undefined;
  
  return clients.find(client => client && client.id === clientId);
};

export const getOrderById = (clients: Client[], orderId: string): {order: Order, client: Client} | undefined => {
  // Verificar que clientes es un array válido y orderId no está vacío
  if (!Array.isArray(clients) || !orderId) return undefined;
  
  for (const client of clients) {
    if (!client || !Array.isArray(client.orders)) continue;
    
    const order = client.orders.find(order => order && order.id === orderId);
    if (order) {
      return { order, client };
    }
  }
  return undefined;
};

export const filterClients = (clients: Client[], status?: string, searchTerm?: string): Client[] => {
  // Asegurar que estamos trabajando con un array válido
  if (!Array.isArray(clients)) return [];
  
  // Filtrar clientes inválidos o sin datos
  let filteredClients = clients.filter(client => 
    client && client.id && client.name && client.name !== "Cliente sin nombre"
  );
  
  if (status && status !== 'all') {
    filteredClients = filteredClients.filter(client => client.status === status);
  }
  
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filteredClients = filteredClients.filter(client => 
      client.name.toLowerCase().includes(term) || 
      client.email.toLowerCase().includes(term) ||
      client.phone.includes(term)
    );
  }
  
  return filteredClients;
};

export const addClient = (
  clients: Client[], 
  setClients: React.Dispatch<React.SetStateAction<Client[]>>, 
  clientData: { name: string; email: string; phone: string }
) => {
  // Verificar que los datos no están vacíos
  if (!clientData.name || !clientData.email || !clientData.phone) {
    toast.error("Los datos del cliente son incompletos");
    return;
  }

  const newClient: Client = {
    id: `client-${Date.now()}`,
    name: clientData.name,
    email: clientData.email,
    phone: clientData.phone,
    orders: [],
    status: "pending"
  };

  setClients(prevClients => {
    // Filtrar clientes inválidos antes de agregar el nuevo
    const validClients = Array.isArray(prevClients) ? 
      prevClients.filter(c => c && c.id && c.name && c.name !== "Cliente sin nombre") 
      : [];
      
    return [...validClients, newClient];
  });
  
  toast.success(`Cliente ${clientData.name} creado`, {
    description: "El cliente ha sido agregado correctamente",
  });
};

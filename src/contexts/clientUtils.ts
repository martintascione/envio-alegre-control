
import { Client, Order } from "@/lib/types";
import { toast } from "sonner";

export const getClientById = (clients: Client[], clientId: string): Client | undefined => {
  return clients.find(client => client.id === clientId);
};

export const getOrderById = (clients: Client[], orderId: string): {order: Order, client: Client} | undefined => {
  for (const client of clients) {
    const order = client.orders.find(order => order.id === orderId);
    if (order) {
      return { order, client };
    }
  }
  return undefined;
};

export const filterClients = (clients: Client[], status?: string, searchTerm?: string): Client[] => {
  let filteredClients = [...clients];
  
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
  const newClient: Client = {
    id: `client-${Date.now()}`,
    name: clientData.name,
    email: clientData.email,
    phone: clientData.phone,
    orders: [],
    status: "pending"
  };

  setClients([...clients, newClient]);
  
  toast.success(`Cliente ${clientData.name} creado`, {
    description: "El cliente ha sido agregado correctamente",
  });
};

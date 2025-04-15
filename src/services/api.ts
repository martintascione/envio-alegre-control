import config from "../config.js";
import { toast } from "sonner";

/**
 * Servicio para realizar peticiones a la API
 * Este archivo se utilizará para conectar tu aplicación con el backend en Hostinger
 */

// Token de autenticación
let authToken: string | null = localStorage.getItem("auth_token");

// Función para establecer el token de autenticación
export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem("auth_token", token);
  } else {
    localStorage.removeItem("auth_token");
  }
};

// Función para crear datos vacíos iniciales
function createEmptyData() {
  return [];
}

// Función para limpiar datos de clientes en caché
function cleanCachedClients(clients) {
  if (!Array.isArray(clients)) return [];
  
  return clients.filter(client => 
    client && 
    client.id && 
    client.name && 
    client.name !== "Cliente sin nombre" && 
    client.email && 
    client.email !== "Sin email" && 
    client.phone && 
    client.phone !== "Sin teléfono"
  );
}

// Función para hacer peticiones a la API con manejo de errores
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${config.apiUrl}${endpoint}`;
  
  // Añadir token de autenticación si está disponible
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  
  try {
    console.log(`Realizando petición a: ${url}`);
    
    // Solo usamos datos locales si explícitamente estamos en modo desarrollo
    if (config.isDevelopmentMode && endpoint === config.endpoints.clients) {
      console.log("Utilizando datos locales en modo desarrollo");
      const cachedData = localStorage.getItem('demo_clients');
      if (cachedData) {
        return JSON.parse(cachedData) as T;
      }
      
      // Si no hay datos en caché, creamos un array vacío
      const emptyData = createEmptyData();
      localStorage.setItem('demo_clients', JSON.stringify(emptyData));
      return emptyData as unknown as T;
    }
    
    // Verificar si estamos en Lovable (entorno de desarrollo)
    if (window.location.hostname.includes('lovableproject.com')) {
      console.log("Entorno de desarrollo Lovable detectado, usando datos locales");
      const cachedData = localStorage.getItem('demo_clients');
      if (cachedData) {
        return JSON.parse(cachedData) as T;
      }
      
      // Si no hay datos en caché, creamos un array vacío
      const emptyData = createEmptyData();
      localStorage.setItem('demo_clients', JSON.stringify(emptyData));
      return emptyData as unknown as T;
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
      // Asegurarnos de que no use caché
      cache: 'no-store',
    });

    // Si el token es inválido o ha expirado
    if (response.status === 401) {
      setAuthToken(null);
      throw new Error("Sesión expirada. Por favor inicie sesión nuevamente.");
    }

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      let errorMessage = `Error ${response.status}`;
      
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } else {
        // Si la respuesta no es JSON, usar el texto directamente
        const errorText = await response.text();
        console.error("Respuesta no JSON del servidor:", errorText);
        errorMessage = "Error en el servidor. La respuesta no es un JSON válido.";
      }
      
      throw new Error(errorMessage);
    }

    // Verificar que la respuesta es JSON antes de procesarla
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("La respuesta del servidor no es JSON:", await response.text());
      throw new Error("La respuesta del servidor no es un JSON válido");
    }

    const data = await response.json();
    console.log(`Respuesta recibida de ${endpoint}:`, data);
    return data;
  } catch (error) {
    console.error("API Error:", error);
    
    // Usar datos locales como fallback si la conexión falla
    if (endpoint === config.endpoints.clients) {
      console.warn("Usando datos locales debido a error de conexión");
      
      // Cargar datos de caché desde localStorage si existen
      const cachedData = localStorage.getItem('demo_clients');
      if (cachedData) {
        return JSON.parse(cachedData) as T;
      }
      
      // Si no hay datos en caché, creamos un array vacío
      const emptyData = createEmptyData();
      localStorage.setItem('demo_clients', JSON.stringify(emptyData));
      return emptyData as unknown as T;
    }
    
    // En producción, mostramos el error
    if (error instanceof Error) {
      toast.error(`Error de conexión: ${error.message}`, {
        description: "Verifica la conexión con el servidor"
      });
    }
    
    throw error;
  }
}

// Servicios para cada entidad de la API
export const apiService = {
  // Clientes
  clients: {
    getAll: async () => {
      try {
        const data = await fetchApi<any[]>(`${config.endpoints.clients}`);
        
        // Limpiar datos para eliminar clientes inválidos
        const cleanedData = cleanCachedClients(data);
        
        // Guardar datos en localStorage como respaldo
        localStorage.setItem('demo_clients', JSON.stringify(cleanedData));
        return cleanedData;
      } catch (error) {
        // Si ya tenemos datos en caché, los usamos como fallback
        const cachedData = localStorage.getItem('demo_clients');
        if (cachedData) {
          console.warn("Usando datos en caché debido a error de conexión");
          const parsedData = JSON.parse(cachedData);
          // Limpiar datos de caché antes de devolverlos
          return cleanCachedClients(parsedData);
        }
        throw error;
      }
    },
    getById: (id: string) => fetchApi<any>(`${config.endpoints.clients}/${id}`),
    create: async (data: any) => {
      // Verificar que los datos son válidos antes de crear el cliente
      if (!data.name || !data.email || !data.phone) {
        throw new Error("Datos de cliente incompletos");
      }
      
      try {
        const newClient = await fetchApi<any>(`${config.endpoints.clients}`, {
          method: "POST",
          body: JSON.stringify(data),
        });
        
        // Verificar que el cliente creado es válido
        if (!newClient || !newClient.id) {
          throw new Error("El servidor devolvió un cliente inválido");
        }
        
        // Actualizar caché local
        const cachedData = localStorage.getItem('demo_clients');
        if (cachedData) {
          const clients = JSON.parse(cachedData);
          // Limpiar caché antes de agregar el nuevo cliente
          const cleanedClients = cleanCachedClients(clients);
          cleanedClients.push(newClient);
          localStorage.setItem('demo_clients', JSON.stringify(cleanedClients));
        }
        
        return newClient;
      } catch (error) {
        // Crear un cliente temporal con ID único si estamos en modo fallback
        if (error instanceof Error && error.message.includes("Failed to fetch")) {
          const newClient = {
            id: `client-${Date.now()}`,
            name: data.name,
            email: data.email,
            phone: data.phone,
            status: "pending",
            orders: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // Actualizar caché local
          const cachedData = localStorage.getItem('demo_clients');
          if (cachedData) {
            const clients = JSON.parse(cachedData);
            // Limpiar caché antes de agregar el nuevo cliente
            const cleanedClients = cleanCachedClients(clients);
            cleanedClients.push(newClient);
            localStorage.setItem('demo_clients', JSON.stringify(cleanedClients));
          } else {
            localStorage.setItem('demo_clients', JSON.stringify([newClient]));
          }
          
          toast.warning("Modo sin conexión: Cliente guardado localmente", {
            description: "Los datos se sincronizarán cuando la conexión se restablezca"
          });
          
          return newClient;
        }
        throw error;
      }
    },
    update: (id: string, data: any) => fetchApi<any>(`${config.endpoints.clients}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi<void>(`${config.endpoints.clients}/${id}`, {
      method: "DELETE",
    }),
  },
  
  // Órdenes/Pedidos
  orders: {
    getAll: () => fetchApi<any[]>(`${config.endpoints.orders}`),
    getById: (id: string) => fetchApi<any>(`${config.endpoints.orders}/${id}`),
    create: (data: any) => fetchApi<any>(`${config.endpoints.orders}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi<any>(`${config.endpoints.orders}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
    updateStatus: (id: string, status: string) => fetchApi<any>(`${config.endpoints.orders}/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
    delete: (id: string) => fetchApi<void>(`${config.endpoints.orders}/${id}`, {
      method: "DELETE",
    }),
  },
  
  // Configuraciones
  settings: {
    get: () => fetchApi<any>(`${config.endpoints.settings}`),
    update: (data: any) => fetchApi<any>(`${config.endpoints.settings}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  },
  
  // WhatsApp
  whatsapp: {
    sendNotification: (data: any) => fetchApi<any>(`${config.endpoints.whatsapp}/send`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  },
  
  // Autenticación
  auth: {
    login: (credentials: { username: string, password: string }) => fetchApi<any>(`${config.endpoints.auth}/login`, {
      method: "POST",
      body: JSON.stringify(credentials),
    }),
    logout: () => fetchApi<void>(`${config.endpoints.auth}/logout`, {
      method: "POST",
    }),
    getCurrentUser: () => fetchApi<any>(`${config.endpoints.auth}/me`),
  },
};

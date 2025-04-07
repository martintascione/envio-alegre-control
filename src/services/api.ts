
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

// Verificar si estamos en modo desarrollo/demo
const isDevelopmentMode = !config.apiUrl.includes('esimportar.com');

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
      const errorData = await response.json().catch(() => ({
        message: "Error en el servidor",
      }));
      throw new Error(errorData.message || `Error ${response.status}`);
    }

    const data = await response.json();
    console.log(`Respuesta recibida de ${endpoint}:`, data);
    return data;
  } catch (error) {
    console.error("API Error:", error);
    
    // En modo desarrollo o si la API no está disponible, podemos usar datos de demostración
    if (isDevelopmentMode || (error instanceof Error && error.message.includes("Failed to fetch"))) {
      console.warn("Utilizando datos de demostración debido a error de conexión con el API");
      
      if (endpoint === config.endpoints.clients) {
        // Cargar datos de demostración desde localStorage si existen
        const cachedData = localStorage.getItem('demo_clients');
        if (cachedData) {
          return JSON.parse(cachedData) as T;
        }
      }
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
        // Guardar datos en localStorage como respaldo
        localStorage.setItem('demo_clients', JSON.stringify(data));
        return data;
      } catch (error) {
        // Si ya tenemos datos en caché, los usamos como fallback
        const cachedData = localStorage.getItem('demo_clients');
        if (cachedData) {
          console.warn("Usando datos en caché debido a error de conexión");
          return JSON.parse(cachedData);
        }
        throw error;
      }
    },
    getById: (id: string) => fetchApi<any>(`${config.endpoints.clients}/${id}`),
    create: async (data: any) => {
      try {
        const newClient = await fetchApi<any>(`${config.endpoints.clients}`, {
          method: "POST",
          body: JSON.stringify(data),
        });
        
        // Actualizar caché local
        const cachedData = localStorage.getItem('demo_clients');
        if (cachedData) {
          const clients = JSON.parse(cachedData);
          clients.push(newClient);
          localStorage.setItem('demo_clients', JSON.stringify(clients));
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
            clients.push(newClient);
            localStorage.setItem('demo_clients', JSON.stringify(clients));
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

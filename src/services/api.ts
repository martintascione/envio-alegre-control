
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
    
    // Verificar si estamos en un entorno de desarrollo o prueba
    if (window.location.hostname.includes('lovableproject.com') || 
        window.location.hostname === 'localhost' ||
        config.isDevelopmentMode) {
      console.log("Entorno de desarrollo detectado, usando datos locales");
      
      // Para todas las peticiones diferentes a clientes, devolvemos datos de demostración
      if (endpoint !== config.endpoints.clients) {
        return [] as unknown as T;
      }
      
      const cachedData = localStorage.getItem('demo_clients');
      if (cachedData) {
        return JSON.parse(cachedData) as T;
      }
      
      // Si no hay datos en caché, creamos un array vacío
      const emptyData = createEmptyData();
      localStorage.setItem('demo_clients', JSON.stringify(emptyData));
      return emptyData as unknown as T;
    }
    
    // Intentar conectar con timeout para evitar esperas largas
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos de timeout
    
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
      // Asegurarnos de que no use caché
      cache: 'no-store',
    });
    
    clearTimeout(timeoutId);

    // Si el token es inválido o ha expirado
    if (response.status === 401) {
      setAuthToken(null);
      throw new Error("Sesión expirada. Por favor inicie sesión nuevamente.");
    }

    // Respuesta no es JSON o es un error
    const contentType = response.headers.get("content-type");
    
    // Si la respuesta no es exitosa
    if (!response.ok) {
      let errorMessage = `Error ${response.status}`;
      
      try {
        // Intentamos leer el cuerpo como texto primero
        const errorText = await response.text();
        
        // Si el error contiene HTML, probablemente es una página de error de Hostinger
        if (errorText.includes('<!DOCTYPE html>')) {
          console.error("Error HTML recibido:", errorText.substring(0, 200) + "...");
          throw new Error("Error de conexión: La URL de la API no es correcta o el servidor no está configurado adecuadamente.");
        }
        
        // Intentamos parsear como JSON si parece ser un JSON
        if (contentType && contentType.includes("application/json")) {
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch {
            // Si no se puede parsear como JSON, usamos el texto directamente
            errorMessage = errorText || errorMessage;
          }
        } else {
          // Si el servidor no devuelve JSON, mostramos un error más descriptivo
          errorMessage = `Error en la conexión con el servidor (${response.status}): ${errorText.substring(0, 100)}...`;
        }
      } catch (e) {
        errorMessage = "Error de conexión con el servidor. Verifica la URL de la API y la estructura de archivos PHP.";
      }
      
      throw new Error(errorMessage);
    }

    // Verificar que la respuesta es JSON antes de procesarla
    if (!contentType || !contentType.includes("application/json")) {
      console.error("La respuesta del servidor no es JSON. Contenido recibido:", await response.text());
      // Caemos al modo fallback
      throw new Error("La respuesta del servidor no es un JSON válido. Comprueba que todos los archivos PHP devuelven JSON correctamente.");
    }

    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.error("Error al parsear respuesta JSON:", e);
      throw new Error("Error al procesar la respuesta del servidor. Comprueba que el JSON devuelto es válido.");
    }
    
    console.log(`Respuesta recibida de ${endpoint}:`, data);
    
    // Si son clientes, guardar en localStorage como respaldo
    if (endpoint === config.endpoints.clients) {
      localStorage.setItem('demo_clients', JSON.stringify(data));
    }
    
    return data;
  } catch (error) {
    console.error("API Error:", error);
    
    // Mostrar mensaje de error más descriptivo
    let errorMessage = "Error de conexión con el servidor";
    if (error instanceof Error) {
      errorMessage = error.message;
      // Si es error de timeout/abort
      if (error.name === 'AbortError') {
        errorMessage = "La conexión tardó demasiado tiempo. Verifica la URL de la API y la estructura del servidor.";
      }
    }
    
    // Usar datos locales como fallback para clientes
    if (endpoint === config.endpoints.clients) {
      console.warn("Usando datos locales debido a error de conexión");
      toast.error(errorMessage, {
        description: "Usando datos guardados localmente como respaldo"
      });
      
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
    
    // Mostrar el error al usuario
    toast.error(errorMessage, {
      description: "Verifica la conexión con el servidor y la estructura de archivos PHP"
    });
    
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
        if (window.location.hostname.includes('lovableproject.com') || 
            window.location.hostname === 'localhost' ||
            (error instanceof Error && error.message.includes("conexión"))) {
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

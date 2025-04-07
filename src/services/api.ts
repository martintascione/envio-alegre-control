
import config from "../config.js";

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
    const response = await fetch(url, {
      ...options,
      headers,
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

    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

// Servicios para cada entidad de la API
export const apiService = {
  // Clientes
  clients: {
    getAll: () => fetchApi<any[]>(`${config.endpoints.clients}`),
    getById: (id: string) => fetchApi<any>(`${config.endpoints.clients}/${id}`),
    create: (data: any) => fetchApi<any>(`${config.endpoints.clients}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
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

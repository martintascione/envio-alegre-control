
/**
 * Configuración de la aplicación
 * Ajusta estos valores para conectar con tu API backend en Hostinger
 */

const config = {
  // URL de la API en tu dominio de Hostinger
  apiUrl: import.meta.env.VITE_API_URL || "https://tu-dominio.com/api", // Reemplaza con tu dominio real
  
  // Endpoints de la API
  endpoints: {
    clients: "/clients",
    orders: "/orders",
    settings: "/settings",
    whatsapp: "/whatsapp",
    auth: "/auth"
  },
  
  // Otros ajustes
  defaultLanguage: "es",
  notificationsEnabled: true,
  
  // Versión de la aplicación
  version: "1.0.0"
};

export default config;

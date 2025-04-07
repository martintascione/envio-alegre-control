
/**
 * Configuración de la aplicación
 * Ajusta estos valores para conectar con tu API backend en Hostinger
 */

const config = {
  // URL de la API en tu dominio de Hostinger
  apiUrl: window.location.hostname === 'localhost' 
    ? "http://localhost/api" // Desarrollo local
    : window.location.hostname.includes('lovableproject.com')
      ? "/api-mock" // Entorno de desarrollo Lovable (usando datos mock)
      : "https://grey-lion-594825.hostingersite.com/api", // Producción con el dominio específico de Hostinger
  
  // Endpoints de la API
  endpoints: {
    clients: "/clients",
    orders: "/orders",
    settings: "/settings",
    whatsapp: "/whatsapp",
    auth: "/auth"
  },
  
  // Configuración para modo sin conexión o desarrollo
  isDevelopmentMode: window.location.hostname.includes('lovableproject.com') || window.location.hostname === 'localhost',
  
  // Otros ajustes
  defaultLanguage: "es",
  notificationsEnabled: true,
  
  // Versión de la aplicación
  version: "1.0.0"
};

export default config;


/**
 * Configuración de la aplicación
 * Ajusta estos valores para conectar con tu API backend en Hostinger
 */

const config = {
  // URL de la API en tu dominio de Hostinger
  apiUrl: window.location.hostname === 'localhost' 
    ? "http://localhost/api" // Desarrollo local
    : `https://${window.location.hostname}/api`, // Producción con el dominio real del sitio
  
  // Detección mejorada del modo de desarrollo
  isDevelopmentMode: window.location.hostname === 'localhost' || 
                    window.location.hostname.includes('lovableproject.com'),
  
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

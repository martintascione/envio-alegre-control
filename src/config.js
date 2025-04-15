
/**
 * Configuración de la aplicación
 * Ajusta estos valores para conectar con tu API backend en Hostinger
 */

const config = {
  // URL de la API en tu dominio de Hostinger
  apiUrl: window.location.hostname === 'localhost' 
    ? "http://localhost:8080/api" // Desarrollo local
    : "https://esimportar.com/api", // URL corregida para Hostinger
  
  // Modo de desarrollo (solo activar para pruebas locales)
  isDevelopmentMode: false,
  
  // Endpoints de la API
  endpoints: {
    clients: "/clients",
    orders: "/orders",
    settings: "/settings",
    whatsapp: "/whatsapp",
    auth: "/auth"
  },
  
  // Configuración WhatsApp
  whatsapp: {
    fallbackMode: true, // Siempre usar el método de URL wa.me (método directo)
    directLinkTimeout: 1000 // Tiempo de espera reducido para una experiencia más rápida
  },
  
  // Otros ajustes
  defaultLanguage: "es",
  notificationsEnabled: true,
  
  // Versión de la aplicación
  version: "1.0.5"
};

export default config;

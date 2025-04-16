
/**
 * Configuración de la aplicación
 * Ajusta estos valores para conectar con tu API backend en Hostinger
 */

const config = {
  // URL de la API en tu dominio de Hostinger
  apiUrl: window.location.hostname === 'localhost' 
    ? "http://localhost:8080/api" // Desarrollo local
    : "https://grey-lion-594825.hostingersite.com/api", // URL para Hostinger
  
  // Modo de desarrollo desactivado completamente para forzar conexión al servidor
  isDevelopmentMode: false,
  
  // Endpoints de la API
  endpoints: {
    clients: "/clients",
    orders: "/orders",
    settings: "/settings",
    whatsapp: "/whatsapp",
    auth: "/auth",
    test: "/test.php" // Añadido endpoint de prueba para verificar conexión
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
  version: "1.0.7" // Incrementada versión para reflejar cambios
};

export default config;

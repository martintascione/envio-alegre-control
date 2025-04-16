
/**
 * Configuración de la aplicación
 * Ajusta estos valores para conectar con tu API backend en Hostinger
 */

const config = {
  // URL de la API en tu dominio de Hostinger
  apiUrl: window.location.hostname === 'localhost' 
    ? "http://localhost:8080/api" // Desarrollo local
    : "https://grey-lion-594825.hostingersite.com/api", // URL para Hostinger
  
  // Modo de fallback para usar datos locales cuando la API no responde
  fallbackMode: true,
  
  // Endpoints de la API
  endpoints: {
    clients: "/clients",
    orders: "/orders",
    settings: "/settings",
    whatsapp: "/whatsapp",
    auth: "/auth",
    test: "/test.php" // Endpoint de prueba para verificar conexión
  },
  
  // Configuración WhatsApp
  whatsapp: {
    fallbackMode: true, // Usar método de URL wa.me (método directo)
    directLinkTimeout: 1000 // Tiempo de espera
  },
  
  // Otros ajustes
  defaultLanguage: "es",
  notificationsEnabled: true,
  
  // Configuraciones de red
  requestTimeout: 15000, // Aumentado a 15 segundos
  retryAttempts: 2, // Número de reintentos antes de usar modo fallback
  
  // Cache control
  disableCache: true, // Para evitar problemas con cachés del navegador
  
  // Debug mode para mostrar más información en consola
  debugMode: true, 
  
  // Versión de la aplicación
  version: "1.0.9" // Incrementada versión para reflejar cambios
};

export default config;

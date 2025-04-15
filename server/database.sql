
-- Esquema de la base de datos para ESIMPORTAR
-- Ejecuta este script en tu panel de phpMyAdmin en Hostinger para crear las tablas necesarias

-- Tabla de usuarios (administradores del sistema)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de clientes
CREATE TABLE clients (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  status ENUM('pending', 'active', 'finished') DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de órdenes/pedidos
CREATE TABLE orders (
  id VARCHAR(36) PRIMARY KEY,
  client_id VARCHAR(36) NOT NULL,
  product_description TEXT NOT NULL,
  store VARCHAR(100) NOT NULL,
  tracking_number VARCHAR(100),
  status ENUM('purchased', 'shipped_to_warehouse', 'received_at_warehouse', 'in_transit_to_argentina', 'arrived_in_argentina') DEFAULT 'purchased',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Tabla de historial de estados de órdenes
CREATE TABLE order_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL,
  status ENUM('purchased', 'shipped_to_warehouse', 'received_at_warehouse', 'in_transit_to_argentina', 'arrived_in_argentina') NOT NULL,
  notification_sent BOOLEAN DEFAULT FALSE,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Tabla de configuraciones
CREATE TABLE settings (
  id INT PRIMARY KEY DEFAULT 1,
  whatsapp_number VARCHAR(20) NOT NULL DEFAULT '+5491112345678',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  auto_notify BOOLEAN DEFAULT TRUE,
  api_key VARCHAR(255) DEFAULT '',
  use_whatsapp_api BOOLEAN DEFAULT FALSE,
  provider ENUM('direct', 'twilio') DEFAULT 'direct',
  twilio_account_sid VARCHAR(255) DEFAULT '',
  twilio_auth_token VARCHAR(255) DEFAULT '',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de plantillas de mensajes
CREATE TABLE message_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  status ENUM('purchased', 'shipped_to_warehouse', 'received_at_warehouse', 'in_transit_to_argentina', 'arrived_in_argentina') NOT NULL,
  template TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  UNIQUE KEY (status)
);

-- Insertar configuraciones iniciales
INSERT INTO settings (
  whatsapp_number, 
  notifications_enabled, 
  auto_notify, 
  api_key, 
  use_whatsapp_api, 
  provider
) VALUES (
  '+5491112345678', 
  TRUE, 
  TRUE, 
  '', 
  FALSE, 
  'direct'
);

-- Insertar plantillas de mensajes predeterminadas
INSERT INTO message_templates (status, template, enabled) VALUES
('purchased', 'Hola [cliente]! soy *importBot* 🤖\n📦 Pedido [comercio].\n▪️ [pedido]\n✅ Tu pedido ha sido comprado.\n\n_Servicio de notificación automática._', TRUE),
('shipped_to_warehouse', 'Hola [cliente]! soy *importBot* 🤖\n📦 Pedido [comercio].\n▪️ [pedido]\n✅ Tu pedido fue enviado por el Comercio.\n\n🚚 Fecha estimada de entrega en Miami: [fecha].\n\n_Servicio de notificación automática._', TRUE),
('received_at_warehouse', 'Hola [cliente]! soy *importBot* 🤖\n📦 Pedido [comercio].\n▪️ [pedido]\n✅ Tu pedido ha sido recibido en nuestro almacén en Miami.\n\n📆 Próximamente será enviado a Argentina.\n\n_Servicio de notificación automática._', TRUE),
('in_transit_to_argentina', 'Hola [cliente]! soy *importBot* 🤖\n📦 Pedido [comercio].\n▪️ [pedido]\n✅ Tu pedido está en tránsito hacia Argentina.\n\n🚢 Fecha estimada de llegada: [fecha].\n\n_Servicio de notificación automática._', TRUE),
('arrived_in_argentina', 'Hola [cliente]! soy *importBot* 🤖\n📦 Pedido [comercio].\n▪️ [pedido]\n✅ ¡Tu pedido ha llegado a Argentina!\n\n📞 Nos contactaremos para coordinar la entrega.\n\n_Servicio de notificación automática._', TRUE);

-- Agregar un usuario administrador con credenciales predeterminadas
-- La contraseña por defecto es 'admin123' (está encriptada con password_hash en PHP)
INSERT INTO users (username, password, name, email, role) VALUES 
('admin', '$2y$10$6jvQ0bDgh3z4bN0LbTxcw.ZfAIu9ocVQx6SCO9LjOfAZQZ8AopiYW', 'Administrador', 'admin@esimportar.com', 'admin');


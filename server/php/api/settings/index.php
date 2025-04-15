
<?php
require_once '../../config.php';

// Verificar autenticación
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  $user = requireAuth();
}

// Manejar diferentes métodos HTTP
switch ($_SERVER['REQUEST_METHOD']) {
  case 'GET':
    getSettings();
    break;
  case 'PUT':
    updateSettings();
    break;
  default:
    response(['error' => 'Método no permitido'], 405);
}

// Función para obtener configuraciones
function getSettings() {
  global $conn;
  
  try {
    // Obtener configuraciones generales
    $stmt = $conn->prepare("SELECT * FROM settings WHERE id = 1");
    $stmt->execute();
    $settings = $stmt->fetch();
    
    if (!$settings) {
      // Si no hay configuraciones, crear valores predeterminados
      $stmt = $conn->prepare("
        INSERT INTO settings (id, whatsapp_number, notifications_enabled, auto_notify)
        VALUES (1, '+5491112345678', TRUE, TRUE)
      ");
      $stmt->execute();
      
      $settings = [
        'whatsappNumber' => '+5491112345678',
        'notificationsEnabled' => true,
        'autoNotify' => true,
        'apiKey' => '',
        'useWhatsAppAPI' => false,
        'provider' => 'direct',
        'twilioAccountSid' => '',
        'twilioAuthToken' => ''
      ];
    } else {
      // Convertir a camelCase para frontend
      $settings = [
        'whatsappNumber' => $settings['whatsapp_number'],
        'notificationsEnabled' => (bool)$settings['notifications_enabled'],
        'autoNotify' => (bool)$settings['auto_notify'],
        'apiKey' => $settings['api_key'] ?? '',
        'useWhatsAppAPI' => (bool)($settings['use_whatsapp_api'] ?? false),
        'provider' => $settings['provider'] ?? 'direct',
        'twilioAccountSid' => $settings['twilio_account_sid'] ?? '',
        'twilioAuthToken' => $settings['twilio_auth_token'] ?? ''
      ];
    }
    
    // Obtener plantillas de mensajes
    $stmt = $conn->prepare("SELECT * FROM message_templates");
    $stmt->execute();
    $templates = $stmt->fetchAll();
    
    $messageTemplates = [];
    $validStatuses = ['purchased', 'shipped_to_warehouse', 'received_at_warehouse', 'in_transit_to_argentina', 'arrived_in_argentina'];
    
    // Crear plantillas predeterminadas si no existen
    if (empty($templates)) {
      $defaultTemplates = [
        [
          'status' => "purchased",
          'template' => "Hola [cliente]! soy *importBot* 🤖\n📦 Pedido [comercio].\n▪️ [pedido]\n✅ Tu pedido ha sido comprado.\n\n_Servicio de notificación automática._",
          'enabled' => true
        ],
        [
          'status' => "shipped_to_warehouse",
          'template' => "Hola [cliente]! soy *importBot* 🤖\n📦 Pedido [comercio].\n▪️ [pedido]\n✅ Tu pedido fue enviado por el Comercio.\n\n🚚 Fecha estimada de entrega en Miami: [fecha].\n\n_Servicio de notificación automática._",
          'enabled' => true
        ],
        [
          'status' => "received_at_warehouse",
          'template' => "Hola [cliente]! soy *importBot* 🤖\n📦 Pedido [comercio].\n▪️ [pedido]\n✅ Tu pedido ha sido recibido en nuestro almacén en Miami.\n\n📆 Próximamente será enviado a Argentina.\n\n_Servicio de notificación automática._",
          'enabled' => true
        ],
        [
          'status' => "in_transit_to_argentina",
          'template' => "Hola [cliente]! soy *importBot* 🤖\n📦 Pedido [comercio].\n▪️ [pedido]\n✅ Tu pedido está en tránsito hacia Argentina.\n\n🚢 Fecha estimada de llegada: [fecha].\n\n_Servicio de notificación automática._",
          'enabled' => true
        ],
        [
          'status' => "arrived_in_argentina",
          'template' => "Hola [cliente]! soy *importBot* 🤖\n📦 Pedido [comercio].\n▪️ [pedido]\n✅ ¡Tu pedido ha llegado a Argentina!\n\n📞 Nos contactaremos para coordinar la entrega.\n\n_Servicio de notificación automática._",
          'enabled' => true
        ]
      ];
      
      foreach ($defaultTemplates as $template) {
        $stmt = $conn->prepare("
          INSERT INTO message_templates (status, template, enabled)
          VALUES (?, ?, ?)
        ");
        $stmt->execute([$template['status'], $template['template'], $template['enabled'] ? 1 : 0]);
        $messageTemplates[] = $template;
      }
    } else {
      // Convertir las plantillas existentes
      foreach ($templates as $template) {
        $messageTemplates[] = [
          'status' => $template['status'],
          'template' => $template['template'],
          'enabled' => (bool)$template['enabled']
        ];
      }
    }
    
    // Asegurarse de que todas las plantillas para cada estado existan
    $existingStatuses = array_column($messageTemplates, 'status');
    foreach ($validStatuses as $status) {
      if (!in_array($status, $existingStatuses)) {
        // Crear plantilla predeterminada para este estado
        $defaultTemplate = "Hola [cliente]! soy *importBot* 🤖\n📦 Pedido [comercio].\n▪️ [pedido]\n✅ Actualización: tu pedido está en estado $status.\n\n_Servicio de notificación automática._";
        
        $stmt = $conn->prepare("
          INSERT INTO message_templates (status, template, enabled)
          VALUES (?, ?, 1)
        ");
        $stmt->execute([$status, $defaultTemplate]);
        
        $messageTemplates[] = [
          'status' => $status,
          'template' => $defaultTemplate,
          'enabled' => true
        ];
      }
    }
    
    $settings['messageTemplates'] = $messageTemplates;
    
    response($settings);
  } catch(PDOException $e) {
    response(['error' => 'Error al obtener configuraciones: ' . $e->getMessage()], 500);
  }
}

// Función para actualizar configuraciones
function updateSettings() {
  global $conn;
  
  // Obtener datos del cuerpo de la petición
  $data = json_decode(file_get_contents('php://input'), true);
  
  try {
    $conn->beginTransaction();
    
    // Actualizar configuraciones generales
    $stmt = $conn->prepare("
      UPDATE settings
      SET whatsapp_number = ?,
          notifications_enabled = ?,
          auto_notify = ?,
          api_key = ?,
          use_whatsapp_api = ?,
          provider = ?,
          twilio_account_sid = ?,
          twilio_auth_token = ?
      WHERE id = 1
    ");
    
    $stmt->execute([
      $data['whatsappNumber'] ?? '+5491112345678',
      $data['notificationsEnabled'] ?? true,
      $data['autoNotify'] ?? true,
      $data['apiKey'] ?? '',
      $data['useWhatsAppAPI'] ?? false,
      $data['provider'] ?? 'direct',
      $data['twilioAccountSid'] ?? '',
      $data['twilioAuthToken'] ?? ''
    ]);
    
    // Si no hay filas afectadas, insertar nuevo registro
    if ($stmt->rowCount() == 0) {
      $stmt = $conn->prepare("
        INSERT INTO settings (id, whatsapp_number, notifications_enabled, auto_notify, 
                             api_key, use_whatsapp_api, provider, twilio_account_sid, twilio_auth_token)
        VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
      ");
      
      $stmt->execute([
        $data['whatsappNumber'] ?? '+5491112345678',
        $data['notificationsEnabled'] ?? true,
        $data['autoNotify'] ?? true,
        $data['apiKey'] ?? '',
        $data['useWhatsAppAPI'] ?? false,
        $data['provider'] ?? 'direct',
        $data['twilioAccountSid'] ?? '',
        $data['twilioAuthToken'] ?? ''
      ]);
    }
    
    // Actualizar plantillas de mensajes si están presentes
    if (isset($data['messageTemplates']) && is_array($data['messageTemplates'])) {
      foreach ($data['messageTemplates'] as $template) {
        if (!isset($template['status']) || !isset($template['template'])) {
          continue;
        }
        
        // Intentar actualizar plantilla existente
        $stmt = $conn->prepare("
          UPDATE message_templates
          SET template = ?, enabled = ?
          WHERE status = ?
        ");
        
        $stmt->execute([
          $template['template'], 
          isset($template['enabled']) ? $template['enabled'] : true,
          $template['status']
        ]);
        
        // Si no existe, crear nueva
        if ($stmt->rowCount() == 0) {
          $stmt = $conn->prepare("
            INSERT INTO message_templates (status, template, enabled)
            VALUES (?, ?, ?)
          ");
          
          $stmt->execute([
            $template['status'],
            $template['template'],
            isset($template['enabled']) ? $template['enabled'] : true
          ]);
        }
      }
    }
    
    $conn->commit();
    
    // Devolver configuraciones actualizadas
    getSettings();
  } catch(PDOException $e) {
    $conn->rollBack();
    response(['error' => 'Error al actualizar configuraciones: ' . $e->getMessage()], 500);
  }
}
?>

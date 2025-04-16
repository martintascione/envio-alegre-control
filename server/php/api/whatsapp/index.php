
<?php
require_once '../../config.php';  // Ruta relativa correcta

// Verificar autenticación
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  $user = requireAuth();
}

// Manejar diferentes métodos HTTP
switch ($_SERVER['REQUEST_METHOD']) {
  case 'POST':
    if (isset($_GET['send'])) {
      sendWhatsAppMessage();
    } else {
      response(['error' => 'Endpoint no válido'], 404);
    }
    break;
  default:
    response(['error' => 'Método no permitido'], 405);
}

// Función para enviar mensaje de WhatsApp
function sendWhatsAppMessage() {
  // Obtener datos del cuerpo de la petición
  $data = json_decode(file_get_contents('php://input'), true);
  
  // Validar datos requeridos
  if (!isset($data['phone']) || !isset($data['message'])) {
    response(['error' => 'Datos incompletos. Se requiere teléfono y mensaje'], 400);
  }
  
  // Formatear número de teléfono (eliminar símbolos)
  $phone = preg_replace('/[^0-9]/', '', $data['phone']);
  
  // Verificar que el número tiene un formato válido
  if (strlen($phone) < 10) {
    response(['error' => 'Número de teléfono inválido'], 400);
  }
  
  // Construir la URL para whatsapp directo
  $message = urlencode($data['message']);
  $url = "https://api.whatsapp.com/send?phone=$phone&text=$message";
  
  // Registrar intento de envío en el historial de estados si se proporciona ID de orden
  if (isset($data['orderId']) && isset($data['status'])) {
    try {
      global $conn;
      
      // Verificar que la orden existe
      $stmt = $conn->prepare("SELECT COUNT(*) FROM orders WHERE id = ?");
      $stmt->execute([$data['orderId']]);
      if ($stmt->fetchColumn() > 0) {
        // Actualizar el historial para marcar la notificación como enviada
        $stmt = $conn->prepare("
          UPDATE order_status_history 
          SET notification_sent = 1 
          WHERE order_id = ? AND status = ? 
          ORDER BY timestamp DESC 
          LIMIT 1
        ");
        $stmt->execute([$data['orderId'], $data['status']]);
      }
    } catch(PDOException $e) {
      // Si hay un error, lo registramos pero continuamos con el envío
      logActivity("Error al actualizar historial de notificaciones: " . $e->getMessage());
    }
  }
  
  // Responder con la URL para abrir WhatsApp
  response([
    'success' => true,
    'url' => $url,
    'message' => 'URL para envío de mensaje generada correctamente'
  ]);
}
?>

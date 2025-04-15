
<?php
require_once '../../config.php';

// Verificar autenticación para todas las rutas excepto GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  $user = requireAuth();
}

// Ruta específica por ID
if (isset($_GET['id'])) {
  $orderId = $_GET['id'];
  
  switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
      getOrderById($orderId);
      break;
    case 'PUT':
      updateOrder($orderId);
      break;
    case 'DELETE':
      deleteOrder($orderId);
      break;
    default:
      response(['error' => 'Método no permitido'], 405);
  }
} else {
  // Rutas generales
  switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
      getOrders();
      break;
    case 'POST':
      createOrder();
      break;
    default:
      response(['error' => 'Método no permitido'], 405);
  }
}

// Función para obtener todas las órdenes
function getOrders() {
  global $conn;
  
  try {
    // Obtener parámetros de filtro
    $status = $_GET['status'] ?? null;
    $clientId = $_GET['client_id'] ?? null;
    
    $query = "SELECT * FROM orders WHERE 1=1";
    $params = [];
    
    if ($status) {
      $query .= " AND status = ?";
      $params[] = $status;
    }
    
    if ($clientId) {
      $query .= " AND client_id = ?";
      $params[] = $clientId;
    }
    
    $query .= " ORDER BY created_at DESC";
    
    $stmt = $conn->prepare($query);
    $stmt->execute($params);
    $orders = $stmt->fetchAll();
    
    // Para cada orden, obtener su historial de estados
    foreach ($orders as &$order) {
      $stmt = $conn->prepare("SELECT * FROM order_status_history WHERE order_id = ? ORDER BY timestamp ASC");
      $stmt->execute([$order['id']]);
      $statusHistory = $stmt->fetchAll();
      
      // Si no hay historial, crear uno con el estado actual
      if (empty($statusHistory)) {
        $statusHistory = [
          [
            'status' => $order['status'],
            'timestamp' => $order['created_at'],
            'notification_sent' => 0
          ]
        ];
      }
      
      // Convertir a camelCase para frontend
      $order['clientId'] = $order['client_id'];
      $order['productDescription'] = $order['product_description'];
      $order['trackingNumber'] = $order['tracking_number'];
      $order['statusHistory'] = $statusHistory;
      $order['createdAt'] = $order['created_at'];
      $order['updatedAt'] = $order['updated_at'];
      
      // Formatear historial
      foreach ($order['statusHistory'] as &$history) {
        $history['notificationSent'] = (bool)$history['notification_sent'];
        unset($history['notification_sent']);
      }
      
      // Eliminar campos redundantes
      unset($order['client_id'], $order['product_description'], $order['tracking_number'], $order['created_at'], $order['updated_at']);
    }
    
    response($orders);
  } catch(PDOException $e) {
    response(['error' => 'Error al obtener órdenes: ' . $e->getMessage()], 500);
  }
}

// Función para obtener una orden por ID
function getOrderById($id) {
  global $conn;
  
  try {
    $stmt = $conn->prepare("SELECT * FROM orders WHERE id = ?");
    $stmt->execute([$id]);
    $order = $stmt->fetch();
    
    if (!$order) {
      response(['error' => 'Orden no encontrada'], 404);
    }
    
    // Obtener historial de estados
    $stmt = $conn->prepare("SELECT * FROM order_status_history WHERE order_id = ? ORDER BY timestamp ASC");
    $stmt->execute([$id]);
    $statusHistory = $stmt->fetchAll();
    
    // Si no hay historial, crear uno con el estado actual
    if (empty($statusHistory)) {
      $statusHistory = [
        [
          'status' => $order['status'],
          'timestamp' => $order['created_at'],
          'notification_sent' => 0
        ]
      ];
    }
    
    // Convertir a camelCase para frontend
    $order['clientId'] = $order['client_id'];
    $order['productDescription'] = $order['product_description'];
    $order['trackingNumber'] = $order['tracking_number'];
    $order['statusHistory'] = $statusHistory;
    $order['createdAt'] = $order['created_at'];
    $order['updatedAt'] = $order['updated_at'];
    
    // Formatear historial
    foreach ($order['statusHistory'] as &$history) {
      $history['notificationSent'] = (bool)$history['notification_sent'];
      unset($history['notification_sent']);
    }
    
    // Eliminar campos redundantes
    unset($order['client_id'], $order['product_description'], $order['tracking_number'], $order['created_at'], $order['updated_at']);
    
    response($order);
  } catch(PDOException $e) {
    response(['error' => 'Error al obtener orden: ' . $e->getMessage()], 500);
  }
}

// Función para crear una nueva orden
function createOrder() {
  global $conn;
  
  // Obtener datos del cuerpo de la petición
  $data = json_decode(file_get_contents('php://input'), true);
  
  // Validar datos requeridos
  if (!isset($data['clientId']) || !isset($data['productDescription']) || !isset($data['store'])) {
    response(['error' => 'Datos incompletos. Se requiere ID de cliente, descripción del producto y tienda'], 400);
  }
  
  try {
    // Verificar que el cliente existe
    $stmt = $conn->prepare("SELECT COUNT(*) FROM clients WHERE id = ?");
    $stmt->execute([$data['clientId']]);
    if ($stmt->fetchColumn() == 0) {
      response(['error' => 'El cliente especificado no existe'], 400);
    }
    
    // Generar ID único
    $orderId = 'order-' . uniqid();
    
    // Insertar orden
    $stmt = $conn->prepare("
      INSERT INTO orders (id, client_id, product_description, store, tracking_number, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'purchased', NOW(), NOW())
    ");
    
    $stmt->execute([
      $orderId,
      $data['clientId'],
      $data['productDescription'],
      $data['store'],
      $data['trackingNumber'] ?? null
    ]);
    
    // Insertar historial de estado inicial
    $stmt = $conn->prepare("
      INSERT INTO order_status_history (order_id, status, notification_sent, timestamp)
      VALUES (?, 'purchased', 0, NOW())
    ");
    $stmt->execute([$orderId]);
    
    // Obtener orden creada
    $stmt = $conn->prepare("SELECT * FROM orders WHERE id = ?");
    $stmt->execute([$orderId]);
    $order = $stmt->fetch();
    
    // Obtener historial de estados
    $stmt = $conn->prepare("SELECT * FROM order_status_history WHERE order_id = ? ORDER BY timestamp ASC");
    $stmt->execute([$orderId]);
    $statusHistory = $stmt->fetchAll();
    
    // Convertir a camelCase para frontend
    $order['clientId'] = $order['client_id'];
    $order['productDescription'] = $order['product_description'];
    $order['trackingNumber'] = $order['tracking_number'] ?? null;
    $order['statusHistory'] = $statusHistory;
    $order['createdAt'] = $order['created_at'];
    $order['updatedAt'] = $order['updated_at'];
    
    // Formatear historial
    foreach ($order['statusHistory'] as &$history) {
      $history['notificationSent'] = (bool)$history['notification_sent'];
      unset($history['notification_sent']);
    }
    
    // Eliminar campos redundantes
    unset($order['client_id'], $order['product_description'], $order['tracking_number'], $order['created_at'], $order['updated_at']);
    
    response($order, 201);
  } catch(PDOException $e) {
    response(['error' => 'Error al crear orden: ' . $e->getMessage()], 500);
  }
}

// Función para actualizar una orden
function updateOrder($id) {
  global $conn;
  
  // Obtener datos del cuerpo de la petición
  $data = json_decode(file_get_contents('php://input'), true);
  
  // Si se está actualizando el estado, usar la función específica
  if (isset($data['status']) && count($data) === 1) {
    updateOrderStatus($id, $data['status']);
    return;
  }
  
  try {
    // Verificar que la orden existe
    $stmt = $conn->prepare("SELECT COUNT(*) FROM orders WHERE id = ?");
    $stmt->execute([$id]);
    if ($stmt->fetchColumn() == 0) {
      response(['error' => 'Orden no encontrada'], 404);
    }
    
    // Construir la consulta de actualización dinámicamente
    $updates = [];
    $params = [];
    
    if (isset($data['productDescription'])) {
      $updates[] = "product_description = ?";
      $params[] = $data['productDescription'];
    }
    
    if (isset($data['store'])) {
      $updates[] = "store = ?";
      $params[] = $data['store'];
    }
    
    if (isset($data['trackingNumber'])) {
      $updates[] = "tracking_number = ?";
      $params[] = $data['trackingNumber'];
    }
    
    if (empty($updates)) {
      response(['error' => 'No se proporcionaron datos para actualizar'], 400);
    }
    
    $updates[] = "updated_at = NOW()";
    $query = "UPDATE orders SET " . implode(", ", $updates) . " WHERE id = ?";
    $params[] = $id;
    
    $stmt = $conn->prepare($query);
    $stmt->execute($params);
    
    // Obtener la orden actualizada
    $stmt = $conn->prepare("SELECT * FROM orders WHERE id = ?");
    $stmt->execute([$id]);
    $order = $stmt->fetch();
    
    // Obtener historial de estados
    $stmt = $conn->prepare("SELECT * FROM order_status_history WHERE order_id = ? ORDER BY timestamp ASC");
    $stmt->execute([$id]);
    $statusHistory = $stmt->fetchAll();
    
    // Convertir a camelCase para frontend
    $order['clientId'] = $order['client_id'];
    $order['productDescription'] = $order['product_description'];
    $order['trackingNumber'] = $order['tracking_number'] ?? null;
    $order['statusHistory'] = $statusHistory;
    $order['createdAt'] = $order['created_at'];
    $order['updatedAt'] = $order['updated_at'];
    
    // Formatear historial
    foreach ($order['statusHistory'] as &$history) {
      $history['notificationSent'] = (bool)$history['notification_sent'];
      unset($history['notification_sent']);
    }
    
    // Eliminar campos redundantes
    unset($order['client_id'], $order['product_description'], $order['tracking_number'], $order['created_at'], $order['updated_at']);
    
    response($order);
  } catch(PDOException $e) {
    response(['error' => 'Error al actualizar orden: ' . $e->getMessage()], 500);
  }
}

// Función para actualizar el estado de una orden
function updateOrderStatus($id, $newStatus) {
  global $conn;
  
  // Validar el nuevo estado
  $validStatuses = ['purchased', 'shipped_to_warehouse', 'received_at_warehouse', 'in_transit_to_argentina', 'arrived_in_argentina'];
  
  if (!in_array($newStatus, $validStatuses)) {
    response(['error' => 'Estado no válido'], 400);
  }
  
  try {
    // Iniciar transacción
    $conn->beginTransaction();
    
    // Verificar que la orden existe
    $stmt = $conn->prepare("SELECT COUNT(*) FROM orders WHERE id = ?");
    $stmt->execute([$id]);
    if ($stmt->fetchColumn() == 0) {
      $conn->rollBack();
      response(['error' => 'Orden no encontrada'], 404);
    }
    
    // Actualizar el estado de la orden
    $stmt = $conn->prepare("UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?");
    $stmt->execute([$newStatus, $id]);
    
    // Registrar en el historial de estados
    $stmt = $conn->prepare("
      INSERT INTO order_status_history (order_id, status, notification_sent, timestamp)
      VALUES (?, ?, 0, NOW())
    ");
    $stmt->execute([$id, $newStatus]);
    
    // Confirmar transacción
    $conn->commit();
    
    // Obtener la orden actualizada
    $stmt = $conn->prepare("SELECT * FROM orders WHERE id = ?");
    $stmt->execute([$id]);
    $order = $stmt->fetch();
    
    // Obtener historial de estados
    $stmt = $conn->prepare("SELECT * FROM order_status_history WHERE order_id = ? ORDER BY timestamp ASC");
    $stmt->execute([$id]);
    $statusHistory = $stmt->fetchAll();
    
    // Convertir a camelCase para frontend
    $order['clientId'] = $order['client_id'];
    $order['productDescription'] = $order['product_description'];
    $order['trackingNumber'] = $order['tracking_number'] ?? null;
    $order['statusHistory'] = $statusHistory;
    $order['createdAt'] = $order['created_at'];
    $order['updatedAt'] = $order['updated_at'];
    
    // Formatear historial
    foreach ($order['statusHistory'] as &$history) {
      $history['notificationSent'] = (bool)$history['notification_sent'];
      unset($history['notification_sent']);
    }
    
    // Eliminar campos redundantes
    unset($order['client_id'], $order['product_description'], $order['tracking_number'], $order['created_at'], $order['updated_at']);
    
    response($order);
  } catch(PDOException $e) {
    $conn->rollBack();
    response(['error' => 'Error al actualizar estado de orden: ' . $e->getMessage()], 500);
  }
}

// Función para eliminar una orden
function deleteOrder($id) {
  global $conn;
  
  try {
    // Verificar que la orden existe
    $stmt = $conn->prepare("SELECT COUNT(*) FROM orders WHERE id = ?");
    $stmt->execute([$id]);
    if ($stmt->fetchColumn() == 0) {
      response(['error' => 'Orden no encontrada'], 404);
    }
    
    // Eliminar historial de estados (las claves foráneas deberían manejar esto automáticamente,
    // pero lo hacemos explícito para mayor claridad)
    $stmt = $conn->prepare("DELETE FROM order_status_history WHERE order_id = ?");
    $stmt->execute([$id]);
    
    // Eliminar la orden
    $stmt = $conn->prepare("DELETE FROM orders WHERE id = ?");
    $stmt->execute([$id]);
    
    response(['success' => true, 'message' => 'Orden eliminada correctamente']);
  } catch(PDOException $e) {
    response(['error' => 'Error al eliminar orden: ' . $e->getMessage()], 500);
  }
}
?>

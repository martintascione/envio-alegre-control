
<?php
require_once '../../config.php';

// Verificar autenticación para todas las rutas excepto GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  $user = requireAuth();
}

// Manejar diferentes métodos HTTP
switch ($_SERVER['REQUEST_METHOD']) {
  case 'GET':
    getClients();
    break;
  case 'POST':
    createClient();
    break;
  default:
    response(['error' => 'Método no permitido'], 405);
}

// Función para obtener todos los clientes
function getClients() {
  global $conn;
  
  try {
    // Obtener parámetros de filtro
    $status = $_GET['status'] ?? null;
    $search = $_GET['search'] ?? null;
    
    $query = "SELECT * FROM clients WHERE 1=1";
    $params = [];
    
    if ($status && $status !== 'all') {
      $query .= " AND status = ?";
      $params[] = $status;
    }
    
    if ($search) {
      $query .= " AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)";
      $searchParam = "%$search%";
      $params[] = $searchParam;
      $params[] = $searchParam;
      $params[] = $searchParam;
    }
    
    $query .= " ORDER BY created_at DESC";
    
    $stmt = $conn->prepare($query);
    $stmt->execute($params);
    $clients = $stmt->fetchAll();
    
    // Para cada cliente, obtener sus pedidos
    foreach ($clients as &$client) {
      $stmt = $conn->prepare("SELECT * FROM orders WHERE client_id = ? ORDER BY created_at DESC");
      $stmt->execute([$client['id']]);
      $client['orders'] = $stmt->fetchAll();
      
      // Para cada pedido, obtener su historial de estados
      foreach ($client['orders'] as &$order) {
        $stmt = $conn->prepare("SELECT * FROM order_status_history WHERE order_id = ? ORDER BY timestamp ASC");
        $stmt->execute([$order['id']]);
        $order['status_history'] = $stmt->fetchAll();
        
        // Convertir nombres de columnas de snake_case a camelCase para mantener formato del frontend
        $order['clientId'] = $order['client_id'];
        $order['productDescription'] = $order['product_description'];
        $order['trackingNumber'] = $order['tracking_number'];
        $order['createdAt'] = $order['created_at'];
        $order['updatedAt'] = $order['updated_at'];
        
        // Eliminar campos redundantes
        unset($order['client_id'], $order['product_description'], $order['tracking_number'], $order['created_at'], $order['updated_at']);
        
        foreach ($order['status_history'] as &$history) {
          $history['notificationSent'] = (bool)$history['notification_sent'];
          unset($history['notification_sent']);
        }
      }
    }
    
    response($clients);
  } catch(PDOException $e) {
    response(['error' => 'Error al obtener clientes: ' . $e->getMessage()], 500);
  }
}

// Función para crear un nuevo cliente
function createClient() {
  global $conn;
  
  // Obtener datos del cuerpo de la petición
  $data = json_decode(file_get_contents('php://input'), true);
  
  // Validar datos requeridos
  if (!isset($data['name']) || !isset($data['email']) || !isset($data['phone'])) {
    response(['error' => 'Datos incompletos. Se requiere nombre, email y teléfono'], 400);
  }
  
  try {
    // Validar que el email no esté duplicado
    $stmt = $conn->prepare("SELECT COUNT(*) FROM clients WHERE email = ?");
    $stmt->execute([$data['email']]);
    if ($stmt->fetchColumn() > 0) {
      response(['error' => 'Ya existe un cliente con ese email'], 400);
    }
    
    // Generar ID único
    $clientId = 'client-' . uniqid();
    
    // Insertar cliente
    $stmt = $conn->prepare("
      INSERT INTO clients (id, name, email, phone, status)
      VALUES (?, ?, ?, ?, 'pending')
    ");
    
    $stmt->execute([
      $clientId,
      $data['name'],
      $data['email'],
      $data['phone']
    ]);
    
    // Obtener cliente creado
    $stmt = $conn->prepare("SELECT * FROM clients WHERE id = ?");
    $stmt->execute([$clientId]);
    $client = $stmt->fetch();
    $client['orders'] = [];
    
    response($client, 201);
  } catch(PDOException $e) {
    response(['error' => 'Error al crear cliente: ' . $e->getMessage()], 500);
  }
}
?>

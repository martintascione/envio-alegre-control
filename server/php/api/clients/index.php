
<?php
require_once '../../config.php'; // Asegurarnos que la ruta es correcta (dos niveles arriba)

// Registrar inicio de la solicitud para depuración
logActivity('Solicitud recibida en clients/index.php', [
  'method' => $_SERVER['REQUEST_METHOD'],
  'params' => $_GET,
]);

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
    logActivity('Obteniendo clientes');
    
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
    
    logActivity('Clientes encontrados', ['count' => count($clients)]);
    
    // Si no hay clientes, devolver un array vacío para evitar errores
    if (empty($clients)) {
      response([]);
      return;
    }
    
    // Para cada cliente, obtener sus pedidos
    foreach ($clients as &$client) {
      $stmt = $conn->prepare("SELECT * FROM orders WHERE client_id = ? ORDER BY created_at DESC");
      $stmt->execute([$client['id']]);
      $client['orders'] = $stmt->fetchAll();
      
      // Asegurarse de que 'orders' siempre sea un array
      if ($client['orders'] === false) {
        $client['orders'] = [];
      }
      
      // Para cada pedido, obtener su historial de estados
      foreach ($client['orders'] as &$order) {
        $stmt = $conn->prepare("SELECT * FROM order_status_history WHERE order_id = ? ORDER BY timestamp ASC");
        $stmt->execute([$order['id']]);
        $order['status_history'] = $stmt->fetchAll();
        
        // Si no hay historial de estados, crear uno con el estado actual
        if (empty($order['status_history'])) {
          $order['status_history'] = [
            [
              'status' => $order['status'],
              'timestamp' => $order['created_at'],
              'notification_sent' => 0
            ]
          ];
        }
        
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
    logActivity('Error al obtener clientes', ['error' => $e->getMessage()]);
    response(['error' => 'Error al obtener clientes: ' . $e->getMessage()], 500);
  }
}

// Función para crear un nuevo cliente
function createClient() {
  global $conn;
  
  // Obtener datos del cuerpo de la petición
  $rawData = file_get_contents('php://input');
  $data = json_decode($rawData, true);
  
  logActivity('Creando nuevo cliente', ['data' => $data, 'raw' => $rawData]);
  
  // Validar datos requeridos
  if (!isset($data['name']) || !isset($data['email']) || !isset($data['phone'])) {
    logActivity('Datos incompletos al crear cliente');
    response(['error' => 'Datos incompletos. Se requiere nombre, email y teléfono'], 400);
  }
  
  try {
    // Validar que el email no esté duplicado
    $stmt = $conn->prepare("SELECT COUNT(*) FROM clients WHERE email = ?");
    $stmt->execute([$data['email']]);
    if ($stmt->fetchColumn() > 0) {
      logActivity('Email duplicado al crear cliente', ['email' => $data['email']]);
      response(['error' => 'Ya existe un cliente con ese email'], 400);
    }
    
    // Generar ID único
    $clientId = 'client-' . uniqid();
    
    // Insertar cliente
    $stmt = $conn->prepare("
      INSERT INTO clients (id, name, email, phone, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'pending', NOW(), NOW())
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
    
    logActivity('Cliente creado exitosamente', ['client' => $client]);
    response($client, 201);
  } catch(PDOException $e) {
    logActivity('Error al crear cliente', ['error' => $e->getMessage()]);
    response(['error' => 'Error al crear cliente: ' . $e->getMessage()], 500);
  }
}
?>

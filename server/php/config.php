
<?php
// Configuración de la base de datos - MODIFICAR con tus credenciales de Hostinger
$db_host = 'localhost'; // Normalmente es localhost en Hostinger
$db_name = 'u970205121_esimportar_dbe'; // Tu base de datos
$db_user = 'u970205121_martintascione'; // Tu usuario de base de datos
$db_pass = '.Martin2024.'; // Tu contraseña de base de datos

// Configuración general
$jwt_secret = 'W6MMqnx8nCe7HULf5Gez2Sp3d75PXbKvT9RjA4JYyFw'; // Clave segura generada aleatoriamente
$jwt_expiration = 86400; // Tiempo de expiración del token (24 horas)

// Configuración CORS (Cross-Origin Resource Sharing)
header("Access-Control-Allow-Origin: *"); // En producción, cambiar * por tu dominio específico
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Si es una solicitud OPTIONS (preflight), terminar aquí
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  exit(0);
}

// Manejador de errores personalizado para asegurar respuestas JSON válidas
set_error_handler(function($severity, $message, $file, $line) {
  if (error_reporting() & $severity) {
    http_response_code(500);
    echo json_encode(['error' => $message, 'file' => $file, 'line' => $line]);
    exit;
  }
  return true;
});

// Conectar a la base de datos
try {
  $conn = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
  $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
  http_response_code(500);
  echo json_encode(['error' => 'Error de conexión a la base de datos: ' . $e->getMessage()]);
  exit;
}

// Función para responder con JSON
function response($data, $status = 200) {
  http_response_code($status);
  echo json_encode($data);
  exit;
}

// Función para obtener el token JWT del encabezado Authorization
function getAuthToken() {
  $headers = getallheaders(); // Usar getallheaders() es más confiable en algunos servidores
  if (!isset($headers['Authorization']) && isset($headers['authorization'])) {
    $headers['Authorization'] = $headers['authorization']; // Normalizar encabezados
  }
  
  if (!isset($headers['Authorization'])) {
    return null;
  }
  $matches = [];
  preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches);
  return $matches[1] ?? null;
}

// Función para verificar el token JWT
function verifyToken($token, $secret) {
  // Esta es una implementación básica. En un entorno de producción,
  // se recomienda usar una biblioteca para JWT como firebase/php-jwt
  try {
    // Decodificar token (implementación simplificada)
    $tokenParts = explode('.', $token);
    if (count($tokenParts) != 3) {
      return false;
    }
    
    $payload = json_decode(base64_decode($tokenParts[1]), true);
    
    // Verificar expiración
    if ($payload['exp'] < time()) {
      return false;
    }
    
    return $payload;
  } catch(Exception $e) {
    return false;
  }
}

// Función para verificar autenticación
function requireAuth() {
  global $jwt_secret;
  
  $token = getAuthToken();
  if (!$token) {
    response(['error' => 'Acceso no autorizado. Token no proporcionado'], 401);
  }
  
  $payload = verifyToken($token, $jwt_secret);
  if (!$payload) {
    response(['error' => 'Acceso no autorizado. Token inválido o expirado'], 401);
  }
  
  return $payload;
}
?>

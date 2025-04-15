
<?php
require_once '../../config.php';

// Manejar diferentes métodos HTTP y rutas
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['login'])) {
  login();
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['logout'])) {
  logout();
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['me'])) {
  getCurrentUser();
} else {
  response(['error' => 'Endpoint no válido'], 404);
}

// Función para iniciar sesión
function login() {
  global $conn, $jwt_secret, $jwt_expiration;
  
  // Obtener datos del cuerpo de la petición
  $data = json_decode(file_get_contents('php://input'), true);
  
  // Validar datos requeridos
  if (!isset($data['username']) || !isset($data['password'])) {
    response(['error' => 'Datos incompletos. Se requiere nombre de usuario y contraseña'], 400);
  }
  
  try {
    // Buscar usuario en la base de datos
    $stmt = $conn->prepare("SELECT * FROM users WHERE username = ?");
    $stmt->execute([$data['username']]);
    $user = $stmt->fetch();
    
    // Verificar si el usuario existe y la contraseña es correcta
    if (!$user || !password_verify($data['password'], $user['password'])) {
      response(['error' => 'Nombre de usuario o contraseña incorrectos'], 401);
    }
    
    // Generar token JWT (implementación simplificada)
    $issuedAt = time();
    $expirationTime = $issuedAt + $jwt_expiration;
    
    $payload = [
      'sub' => $user['id'],
      'name' => $user['name'],
      'role' => $user['role'],
      'iat' => $issuedAt,
      'exp' => $expirationTime
    ];
    
    // Crear token JWT (implementación básica)
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $headerBase64 = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    
    $payloadBase64 = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(json_encode($payload)));
    
    $signature = hash_hmac('sha256', "$headerBase64.$payloadBase64", $jwt_secret, true);
    $signatureBase64 = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    
    $jwt = "$headerBase64.$payloadBase64.$signatureBase64";
    
    // Responder con el token y la información del usuario
    $userData = [
      'id' => $user['id'],
      'username' => $user['username'],
      'name' => $user['name'],
      'role' => $user['role']
    ];
    
    response([
      'token' => $jwt,
      'user' => $userData,
      'expiresAt' => $expirationTime
    ]);
  } catch(PDOException $e) {
    response(['error' => 'Error al iniciar sesión: ' . $e->getMessage()], 500);
  }
}

// Función para cerrar sesión (JWT es stateless, pero podemos registrar el cierre de sesión)
function logout() {
  // En una implementación con JWT puro, no hay necesidad de hacer nada en el servidor
  // El cliente simplemente elimina el token almacenado
  
  // Si quisiéramos implementar una lista negra de tokens, lo haríamos aquí
  
  response(['success' => true, 'message' => 'Sesión cerrada correctamente']);
}

// Función para obtener el usuario actual
function getCurrentUser() {
  global $jwt_secret;
  
  // Verificar autenticación
  $userData = requireAuth();
  
  // Obtener datos del usuario desde la base de datos
  try {
    global $conn;
    
    $stmt = $conn->prepare("SELECT id, username, name, role FROM users WHERE id = ?");
    $stmt->execute([$userData['sub']]);
    $user = $stmt->fetch();
    
    if (!$user) {
      response(['error' => 'Usuario no encontrado'], 404);
    }
    
    response($user);
  } catch(PDOException $e) {
    response(['error' => 'Error al obtener datos del usuario: ' . $e->getMessage()], 500);
  }
}
?>

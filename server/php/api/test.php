
<?php
// Desactivar caché para ver siempre respuestas actualizadas
header('Cache-Control: no-cache, must-revalidate');
header('Expires: Sat, 26 Jul 1997 05:00:00 GMT');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejo de errores explícito para depuración
error_reporting(E_ALL);
ini_set('display_errors', 1); // Mostrar errores durante depuración

// Información del servidor para depuración
$server_info = [
    'php_version' => phpversion(),
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'No disponible',
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'No disponible',
    'script_filename' => $_SERVER['SCRIPT_FILENAME'] ?? 'No disponible',
    'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'No disponible',
    'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'No disponible',
    'http_origin' => $_SERVER['HTTP_ORIGIN'] ?? 'No disponible',
    'timestamp' => date('Y-m-d H:i:s')
];

// Una respuesta simple para verificar si el script funciona
$response = [
    'status' => 'success',
    'message' => 'API test endpoint funcionando correctamente',
    'server_info' => $server_info
];

// Intentar cargar la configuración para probar si existe
// Ajustamos la ruta para buscar en el directorio principal de la API
$config_file = __DIR__ . '/../config.php';  // Cambiado de '../config.php' a usar __DIR__
$db_test = [
    'config_exists' => file_exists($config_file) ? 'Sí' : 'No',
    'config_path' => realpath($config_file) ?: 'No encontrado',
    'current_dir' => __DIR__,
    'parent_dir' => dirname(__DIR__)
];

// Intentamos incluir la configuración si existe
if (file_exists($config_file)) {
    try {
        require_once $config_file;
        
        // Verificamos si las variables de configuración están definidas
        $db_test['variables_defined'] = [
            'db_host' => isset($db_host) ? 'Sí' : 'No',
            'db_name' => isset($db_name) ? 'Sí' : 'No',
            'db_user' => isset($db_user) ? 'Sí' : 'No',
            'db_pass' => isset($db_pass) ? 'Sí (valor oculto)' : 'No'
        ];
        
        // Intentamos la conexión solo si las variables están definidas
        if (isset($db_host) && isset($db_name) && isset($db_user) && isset($db_pass)) {
            try {
                $conn = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
                $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                
                $db_test['connection'] = 'Exitosa';
                
                // Verificar que existen las tablas
                $tables = [];
                $stmt = $conn->query("SHOW TABLES");
                while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
                    $tables[] = $row[0];
                }
                $db_test['tables'] = $tables;
            } catch (PDOException $e) {
                $db_test['connection'] = 'Fallida';
                $db_test['error'] = $e->getMessage();
            }
        } else {
            $db_test['connection'] = 'No intentada - faltan variables de configuración';
        }
    } catch (Exception $e) {
        $db_test['include_error'] = $e->getMessage();
    }
}

$response['database_info'] = $db_test;

// Asegurarnos de enviar una respuesta JSON válida
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

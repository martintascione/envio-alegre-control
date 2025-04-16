
<?php
// Desactivar caché para ver siempre respuestas actualizadas
header('Cache-Control: no-cache, must-revalidate');
header('Expires: Sat, 26 Jul 1997 05:00:00 GMT');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Incluir archivo de configuración de la base de datos
require_once '../config.php';

try {
    // Información detallada del servidor
    $server_info = [
        'php_version' => phpversion(),
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'No disponible',
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'No disponible',
        'script_filename' => $_SERVER['SCRIPT_FILENAME'] ?? 'No disponible',
        'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'No disponible',
        'request_time' => date('Y-m-d H:i:s', $_SERVER['REQUEST_TIME'] ?? time()),
        'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'No disponible',
        'http_origin' => $_SERVER['HTTP_ORIGIN'] ?? 'No disponible',
    ];

    // Probar conexión a la base de datos con más detalles
    $db_test = [
        'connection' => 'Fallida',
        'host' => $db_host,
        'database' => $db_name,
        'user' => $db_user,
        'error' => null
    ];

    try {
        // Intentar conexión explícitamente
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
        
        // Contar registros en las tablas principales
        $counts = [];
        foreach (['clients', 'orders', 'users', 'settings'] as $table) {
            if (in_array($table, $tables)) {
                $stmt = $conn->query("SELECT COUNT(*) FROM `$table`");
                $counts[$table] = $stmt->fetchColumn();
            } else {
                $counts[$table] = 'Tabla no encontrada';
            }
        }
        $db_test['record_counts'] = $counts;

    } catch (PDOException $e) {
        $db_test['error'] = $e->getMessage();
    }

    // Enviar respuesta
    echo json_encode([
        'status' => $db_test['connection'] === 'Exitosa' ? 'success' : 'error',
        'message' => $db_test['connection'] === 'Exitosa' 
            ? 'Conexión a la base de datos establecida correctamente' 
            : 'Error de conexión a la base de datos',
        'server_info' => $server_info,
        'database_info' => $db_test,
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (Exception $e) {
    // En caso de error general
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Error general del servidor',
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

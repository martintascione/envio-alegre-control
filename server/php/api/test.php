
<?php
// Archivo de prueba para verificar la conexión a la base de datos

// Desactivar caché para ver siempre respuestas actualizadas
header('Cache-Control: no-cache, must-revalidate');
header('Expires: Sat, 26 Jul 1997 05:00:00 GMT');
header('Content-Type: application/json; charset=UTF-8');

require_once '../config.php';

try {
    // Información del servidor
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

    // Probar conexión a la base de datos
    $db_test = [
        'connection' => 'Exitosa',
        'host' => $db_host,
        'database' => $db_name,
        'user' => $db_user,
        // No mostramos la contraseña por seguridad
    ];

    // Verificar que existen las tablas
    $tables = [];
    $stmt = $conn->query("SHOW TABLES");
    while ($row = $stmt->fetch()) {
        $tables[] = array_values($row)[0];
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

    // Enviar respuesta
    echo json_encode([
        'status' => 'success',
        'message' => 'Conexión a la base de datos establecida correctamente',
        'server_info' => $server_info,
        'database_info' => $db_test,
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (PDOException $e) {
    // En caso de error de base de datos
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Error de conexión a la base de datos',
        'error' => $e->getMessage(),
        'server_info' => $server_info ?? 'No disponible',
        'database_config' => [
            'host' => $db_host,
            'database' => $db_name,
            'user' => $db_user,
            // No mostramos la contraseña por seguridad
        ],
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}


<?php
// Script de diagnóstico para identificar problemas con la configuración
header('Content-Type: text/html; charset=UTF-8');
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Diagnóstico de Configuración API ESIMPORTAR</h1>";

// Verificar directorios y permisos
echo "<h2>Rutas y Directorios</h2>";
echo "<ul>";
echo "<li>Script Location: " . __FILE__ . "</li>";
echo "<li>Current Directory: " . __DIR__ . "</li>";
echo "<li>Parent Directory: " . dirname(__DIR__) . "</li>";
echo "<li>Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "</li>";
echo "</ul>";

// Verificar archivo de configuración
$config_path = __DIR__ . "/config.php";
echo "<h2>Verificación de config.php</h2>";
echo "<ul>";
echo "<li>Buscando en: " . $config_path . "</li>";
echo "<li>¿Existe?: " . (file_exists($config_path) ? "SÍ" : "NO") . "</li>";
if (file_exists($config_path)) {
    echo "<li>Permisos: " . substr(sprintf('%o', fileperms($config_path)), -4) . "</li>";
    echo "<li>Tamaño: " . filesize($config_path) . " bytes</li>";
}
echo "</ul>";

// Intentar cargar configuración
echo "<h2>Cargando configuración</h2>";
if (file_exists($config_path)) {
    try {
        require_once $config_path;
        echo "<p style='color:green'>✓ Archivo config.php cargado exitosamente.</p>";
        
        // Verificar variables de configuración
        echo "<h3>Variables definidas:</h3>";
        echo "<ul>";
        echo "<li>db_host: " . (isset($db_host) ? "Definido (" . $db_host . ")" : "NO definido") . "</li>";
        echo "<li>db_name: " . (isset($db_name) ? "Definido (" . $db_name . ")" : "NO definido") . "</li>";
        echo "<li>db_user: " . (isset($db_user) ? "Definido (" . $db_user . ")" : "NO definido") . "</li>";
        echo "<li>db_pass: " . (isset($db_pass) ? "Definido (valor oculto)" : "NO definido") . "</li>";
        echo "<li>jwt_secret: " . (isset($jwt_secret) ? "Definido (valor oculto)" : "NO definido") . "</li>";
        echo "</ul>";
        
        // Probar conexión a la base de datos
        if (isset($db_host) && isset($db_name) && isset($db_user) && isset($db_pass)) {
            try {
                echo "<h3>Probando conexión a la base de datos:</h3>";
                $conn = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
                $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                echo "<p style='color:green'>✓ Conexión exitosa a la base de datos.</p>";
                
                // Listar tablas
                $tables = [];
                $stmt = $conn->query("SHOW TABLES");
                echo "<h4>Tablas en la base de datos:</h4>";
                echo "<ul>";
                while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
                    echo "<li>" . $row[0] . "</li>";
                    $tables[] = $row[0];
                }
                echo "</ul>";
                
                // Verificar tablas requeridas
                $required_tables = ['clients', 'orders', 'order_status_history', 'users'];
                echo "<h4>Estado de tablas requeridas:</h4>";
                echo "<ul>";
                foreach ($required_tables as $table) {
                    echo "<li>" . $table . ": " . (in_array($table, $tables) ? 
                        "<span style='color:green'>✓ Presente</span>" : 
                        "<span style='color:red'>✗ NO encontrada</span>") . "</li>";
                }
                echo "</ul>";
                
            } catch (PDOException $e) {
                echo "<p style='color:red'>✗ Error de conexión: " . $e->getMessage() . "</p>";
                
                // Sugerir solución
                echo "<h4>Posibles soluciones:</h4>";
                echo "<ul>";
                echo "<li>Verificar credenciales de la base de datos</li>";
                echo "<li>Confirmar que la base de datos existe</li>";
                echo "<li>Verificar que el usuario tiene permisos de acceso</li>";
                echo "<li>Confirmar que el host es correcto (normalmente 'localhost')</li>";
                echo "</ul>";
            }
        } else {
            echo "<p style='color:red'>✗ Faltan variables de configuración de la base de datos.</p>";
        }
        
    } catch (Exception $e) {
        echo "<p style='color:red'>✗ Error al cargar configuración: " . $e->getMessage() . "</p>";
    }
} else {
    echo "<p style='color:red'>✗ No se encuentra el archivo config.php</p>";
    echo "<h3>Posibles soluciones:</h3>";
    echo "<ul>";
    echo "<li>Verificar que el archivo config.php existe en " . __DIR__ . "</li>";
    echo "<li>Asegurarse de que los permisos permiten leer el archivo</li>";
    echo "<li>Crear el archivo si no existe (revisar el ejemplo en la documentación)</li>";
    echo "</ul>";
}

// Sugerencias generales
echo "<h2>Sugerencias generales</h2>";
echo "<ol>";
echo "<li>Asegúrate de que el archivo config.php está en la carpeta api/ y no dentro de otro subdirectorio</li>";
echo "<li>Verifica que las rutas en los archivos PHP son correctas según la estructura de directorios</li>";
echo "<li>Comprueba que las variables de configuración están correctamente definidas</li>";
echo "<li>Revisa los logs de error de PHP en el panel de Hostinger</li>";
echo "</ol>";

echo "<h2>Estructura de directorios recomendada</h2>";
echo "<pre>";
echo "public_html/
├── api/
│   ├── config.php         # Aquí debe estar el archivo de configuración
│   ├── index.php
│   ├── test.php
│   ├── auth/
│   │   └── index.php
│   ├── clients/
│   │   └── index.php
│   ├── orders/
│   │   └── index.php
│   ├── settings/
│   │   └── index.php
│   └── whatsapp/
│       └── index.php
└── [archivos del frontend]";
echo "</pre>";
?>

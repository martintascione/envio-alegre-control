
<?php
require_once '../config.php';  // Ruta relativa correcta

// Configuración de encabezados CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Este archivo sirve como punto de entrada para la API
// Simplemente devuelve información sobre los endpoints disponibles
$apiInfo = [
  'name' => 'ESIMPORTAR API',
  'version' => '1.0.8',
  'endpoints' => [
    'clients' => '/api/clients',
    'orders' => '/api/orders',
    'settings' => '/api/settings',
    'whatsapp' => '/api/whatsapp',
    'auth' => '/api/auth',
    'test' => '/api/test.php'
  ],
  'status' => 'online',
  'timestamp' => date('Y-m-d H:i:s')
];

response($apiInfo);
?>


<?php
require_once '../../config.php';  // Cambiado de '../config.php' a '../../config.php'

// Este archivo sirve como punto de entrada para la API
// Simplemente devuelve información sobre los endpoints disponibles

$apiInfo = [
  'name' => 'ESIMPORTAR API',
  'version' => '1.0.6',
  'endpoints' => [
    'clients' => '/api/clients',
    'orders' => '/api/orders',
    'settings' => '/api/settings',
    'whatsapp' => '/api/whatsapp',
    'auth' => '/api/auth'
  ],
  'status' => 'online',
  'timestamp' => date('Y-m-d H:i:s')
];

response($apiInfo);
?>

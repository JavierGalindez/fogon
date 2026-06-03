<?php
header('Content-Type: application/json');
$path = $_SERVER['PATH_INFO'] ?? 'NO PATH_INFO';
$requestUri = $_SERVER['REQUEST_URI'] ?? 'NO URI';
echo json_encode([
    'path_info' => $path,
    'request_uri' => $requestUri,
    'db_host' => getenv('DB_HOST') ? 'OK' : 'FALTA',
    'db_user' => getenv('DB_USER') ? 'OK' : 'FALTA',
    'db_pass' => getenv('DB_PASSWORD') ? 'OK' : 'FALTA',
    'db_name' => getenv('DB_NAME') ? 'OK' : 'FALTA',
]);
?>
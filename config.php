<?php
// Configuración LOCAL para XAMPP (Proyecto_Final)
define('DB_HOST', 'localhost');
define('DB_USER', 'root');          // Usuario por defecto de XAMPP
define('DB_PASS', '');             // Contraseña vacía por defecto
define('DB_NAME', 'fogon_db');
define('DB_PORT', '3306');

// URL base para API (ajusta si tu proyecto no está en Proyecto_Final)
define('APP_URL', 'http://localhost/Proyecto_Final');

// Headers para CORS y JSON
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
?>
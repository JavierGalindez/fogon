<?php
// db_only.php — Solo conexión a BD, sin headers HTTP
// Los headers van en api.php para evitar output duplicado

define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASSWORD') ?: '');
define('DB_NAME', getenv('DB_NAME') ?: 'fogon_db');
define('DB_PORT', intval(getenv('DB_PORT') ?: '3306'));

class Database {
    private $connection;

    public function __construct() {
        $this->connection = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);
        if ($this->connection->connect_error) {
            // Error de conexión como JSON válido
            http_response_code(500);
            echo json_encode(['error' => 'Conexión fallida: ' . $this->connection->connect_error]);
            exit;
        }
        $this->connection->set_charset('utf8mb4');
    }

    public function query($sql, $params = [], $types = '') {
        $stmt = $this->connection->prepare($sql);
        if (!$stmt) {
            throw new Exception('Prepare failed: ' . $this->connection->error . ' | SQL: ' . $sql);
        }
        if (!empty($params)) {
            $types = $types ?: str_repeat('s', count($params));
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();
        return $stmt->get_result();
    }

    public function execute($sql, $params = [], $types = '') {
        $stmt = $this->connection->prepare($sql);
        if (!$stmt) {
            throw new Exception('Prepare failed: ' . $this->connection->error . ' | SQL: ' . $sql);
        }
        if (!empty($params)) {
            $types = $types ?: str_repeat('s', count($params));
            $stmt->bind_param($types, ...$params);
        }
        return $stmt->execute();
    }

    public function getLastInsertId() {
        return $this->connection->insert_id;
    }

    public function escape($string) {
        return $this->connection->real_escape_string($string);
    }
}

$db = new Database();
?>
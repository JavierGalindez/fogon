<?php
require_once 'config.php';

class Database {
    private $connection;

    public function __construct() {
        $this->connection = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);
        if ($this->connection->connect_error) {
            die(json_encode(['error' => 'Conexión fallida: ' . $this->connection->connect_error]));
        }
    }

    public function query($sql, $params = [], $types = '') {
        $stmt = $this->connection->prepare($sql);
        if (!empty($params)) {
            $types = $types ?: str_repeat('s', count($params));
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();
        return $stmt->get_result();
    }

    public function execute($sql, $params = [], $types = '') {
        $stmt = $this->connection->prepare($sql);
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
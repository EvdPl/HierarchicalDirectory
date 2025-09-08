<?php
class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    public $conn;

    public function __construct() {
        $this->host = getenv('DB_HOST') ?: 'mysql';
        $this->db_name = getenv('DB_NAME') ?: 'hierarchy_db';
        $this->username = getenv('DB_USER') ?: 'root';
        $this->password = getenv('DB_PASSWORD') ?: 'password';
    }

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4",
                $this->username,
                $this->password
            );
            $this->conn->exec("set names utf8mb4");
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $exception) {
            $this->log("ERROR", "Connection error: " . $exception->getMessage());
        }
        return $this->conn;
    }

    private function log($type, $message) {
        $logFile = '/var/www/logs/app.log';
        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[$timestamp] [$type] $message\n";
        file_put_contents($logFile, $logMessage, FILE_APPEND);
    }
}
?>
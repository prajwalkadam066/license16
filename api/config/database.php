<?php
// Enable error reporting for debugging (remove in production)
ini_set('display_errors', 1);
error_reporting(E_ALL);

class Database {
    // Automatically detect environment for flexible deployment
    private $host;
    private $port;
    private $db_name;
    private $username;
    private $password;
    public $conn;

    public function __construct() {
        // Use environment variables with fallback to default values
        $this->host = getenv('MYSQL_HOST') ?: "82.25.105.94";
        $this->port = getenv('MYSQL_PORT') ?: "3306";
        $this->db_name = getenv('MYSQL_DATABASE') ?: "cybaemtechnet_LMS_Project";
        $this->username = getenv('MYSQL_USER') ?: "cybaemtechnet_LMS_Project";
        $this->password = getenv('MYSQL_PASSWORD') ?: "PrajwalAK12";
    }

    public function getConnection() {
        $this->conn = null;
        try {
            $dsn = "mysql:host={$this->host};port={$this->port};charset=utf8mb4";
            
            // First check if we can connect to MySQL without specifying a database
            $tempConn = new PDO($dsn, $this->username, $this->password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ]);
            
            // Check if database exists
            $stmt = $tempConn->query("SHOW DATABASES LIKE '{$this->db_name}'");
            if ($stmt->rowCount() === 0) {
                // Create the database with proper charset
                $tempConn->exec("CREATE DATABASE IF NOT EXISTS {$this->db_name} 
                    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                error_log("Database {$this->db_name} created successfully");
            }
            
            // Connect to the specific database
            $this->conn = new PDO(
                $dsn . ";dbname={$this->db_name}",
                $this->username,
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
                ]
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Ensure UTF-8 charset is used for the connection
            $this->conn->exec("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
            $this->conn->exec("SET CHARACTER SET utf8mb4");
            
            // Check if tables exist, create them if not
            $stmt = $this->conn->query("SHOW TABLES LIKE 'users'");
            if ($stmt->rowCount() === 0) {
                $this->setupDatabase();
            }
            
            return $this->conn;
        } catch(PDOException $e) {
            header('Content-Type: application/json; charset=UTF-8');
            echo json_encode([
                "error" => "Database connection failed", 
                "details" => $e->getMessage(),
                "code" => $e->getCode()
            ]);
            exit;
        }
    }
    
    private function setupDatabase() {
        // Path to SQL setup file
        $sqlFile = __DIR__ . '/../cpanel_setup.sql';
        
        if (file_exists($sqlFile)) {
            try {
                $sql = file_get_contents($sqlFile);
                $statements = array_filter(array_map('trim', explode(';', $sql)));
                
                foreach ($statements as $statement) {
                    if (!empty($statement)) {
                        $this->conn->exec($statement);
                    }
                }
                error_log("Database tables created successfully");
            } catch (PDOException $e) {
                error_log("Error setting up database: " . $e->getMessage());
                throw $e; // Re-throw for the caller to handle
            }
        } else {
            error_log("SQL setup file not found: {$sqlFile}");
            throw new Exception("Database setup file not found");
        }
    }
}
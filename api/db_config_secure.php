<?php
/**
 * Secure Database Configuration
 * Uses environment variables instead of hardcoded credentials
 */

// Get database credentials from environment variables
$db_host = getenv('MYSQL_HOST') ?: 'localhost';
$db_name = getenv('MYSQL_DATABASE') ?: '';
$db_user = getenv('MYSQL_USER') ?: '';
$db_pass = getenv('MYSQL_PASSWORD') ?: '';

// Validate that required credentials are set
if (empty($db_name) || empty($db_user) || empty($db_pass)) {
    header('Content-Type: application/json');
    http_response_code(503);
    echo json_encode([
        'error' => 'Database configuration error',
        'message' => 'Database credentials not configured. Please set MYSQL_HOST, MYSQL_DATABASE, MYSQL_USER, and MYSQL_PASSWORD environment variables.'
    ]);
    exit;
}

try {
    $pdo = new PDO(
        "mysql:host=$db_host;dbname=$db_name;charset=utf8mb4",
        $db_user,
        $db_pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    header('Content-Type: application/json');
    http_response_code(503);
    echo json_encode([
        'error' => 'Database connection failed',
        'message' => 'Unable to connect to database. Please check your configuration.'
    ]);
    exit;
}

return $pdo;

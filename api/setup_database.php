<?php
// Set CORS headers before any output
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
header('Access-Control-Max-Age: 86400');
header('Access-Control-Allow-Credentials: false');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    // Database connection for cPanel
    $host = '82.25.105.94';
    $dbname = 'cybaemtechnet_LMS_Project';
    $username = 'cybaemtechnet_LMS_Project';
    $password = 'PrajwalAK12';

    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    $results = [];
    $results[] = "Database connection successful!";

    // Check existing tables
    $stmt = $pdo->query("SHOW TABLES");
    $existingTables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $results[] = "Existing tables: " . implode(', ', $existingTables);

    // Create users table if it doesn't exist
    if (!in_array('users', $existingTables)) {
        $pdo->exec("
            CREATE TABLE users (
                id VARCHAR(36) PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'accounts', 'user') NOT NULL DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_users_email (email),
                INDEX idx_users_role (role)
            )
        ");
        $results[] = "Created users table";

        // Insert default users
        $hashedPassword = password_hash('password', PASSWORD_BCRYPT);
        $userId1 = uniqid('user_', true);
        $userId2 = uniqid('user_', true);
        $stmt = $pdo->prepare("
            INSERT INTO users (id, email, password, role) VALUES 
            (?, 'rohan.bhosale@cybaemtech.com', ?, 'admin'),
            (?, 'accounts@cybaemtech.com', ?, 'accounts')
        ");
        $stmt->execute([$userId1, $hashedPassword, $userId2, $hashedPassword]);
        $results[] = "Inserted default users";
    } else {
        $results[] = "Users table already exists";
    }

    // Create clients table if it doesn't exist
    if (!in_array('clients', $existingTables)) {
        $pdo->exec("
            CREATE TABLE clients (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36),
                name VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                email VARCHAR(255),
                company_name VARCHAR(255),
                contact_person VARCHAR(255),
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_clients_user_id (user_id),
                INDEX idx_clients_name (name),
                INDEX idx_clients_status (status)
            )
        ");
        $results[] = "Created clients table";

        // Insert sample clients
        $client1 = uniqid('client_', true);
        $client2 = uniqid('client_', true);
        $client3 = uniqid('client_', true);
        $stmt = $pdo->prepare("
            INSERT INTO clients (id, name, phone, email, company_name, contact_person, status) VALUES 
            (?, 'ABC Corp', '9876543210', 'contact@abccorp.com', 'ABC Corporation', 'John Doe', 'active'),
            (?, 'XYZ Ltd', '9876543211', 'info@xyz.com', 'XYZ Limited', 'Jane Smith', 'active'),
            (?, 'Tech Solutions', '9876543212', 'hello@tech.com', 'Tech Solutions Inc', 'Mike Johnson', 'active')
        ");
        $stmt->execute([$client1, $client2, $client3]);
        $results[] = "Inserted sample clients";
    } else {
        $results[] = "Clients table already exists";
    }

    // Create license_purchases table if it doesn't exist
    if (!in_array('license_purchases', $existingTables)) {
        $pdo->exec("
            CREATE TABLE license_purchases (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36),
                client_id VARCHAR(36),
                tool_name VARCHAR(255) NOT NULL,
                make VARCHAR(255),
                model VARCHAR(255),
                version VARCHAR(100),
                vendor VARCHAR(255),
                cost_per_user DECIMAL(10,2) NOT NULL,
                quantity INT NOT NULL DEFAULT 1,
                total_cost DECIMAL(10,2) NOT NULL,
                total_cost_inr DECIMAL(10,2),
                purchase_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                expiration_date TIMESTAMP NOT NULL,
                invoice_no VARCHAR(100),
                serial_no VARCHAR(255),
                currency_code VARCHAR(10) DEFAULT 'INR',
                original_amount DECIMAL(10,2),
                status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_license_purchases_user_id (user_id),
                INDEX idx_license_purchases_client_id (client_id),
                INDEX idx_license_purchases_tool_name (tool_name),
                INDEX idx_license_purchases_vendor (vendor),
                INDEX idx_license_purchases_expiration (expiration_date),
                INDEX idx_license_purchases_status (status)
            )
        ");
        $results[] = "Created license_purchases table";

        // Insert sample license purchases
        $license1 = uniqid('lic_', true);
        $license2 = uniqid('lic_', true);
        $license3 = uniqid('lic_', true);
        $license4 = uniqid('lic_', true);
        $license5 = uniqid('lic_', true);
        
        $stmt = $pdo->prepare("
            INSERT INTO license_purchases (id, tool_name, vendor, cost_per_user, quantity, total_cost, purchase_date, expiration_date, status, serial_no) VALUES 
            (?, 'Microsoft Office 365', 'Microsoft', 500.00, 10, 5000.00, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 'active', 'MS-OFF-001'),
            (?, 'Adobe Creative Suite', 'Adobe', 2000.00, 5, 10000.00, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 'active', 'ADO-CS-001'),
            (?, 'AutoCAD', 'Autodesk', 1500.00, 3, 4500.00, DATE_SUB(NOW(), INTERVAL 1 MONTH), DATE_ADD(DATE_SUB(NOW(), INTERVAL 1 MONTH), INTERVAL 1 YEAR), 'active', 'AUTO-CAD-001'),
            (?, 'Slack Pro', 'Slack', 300.00, 20, 6000.00, DATE_SUB(NOW(), INTERVAL 2 MONTHS), DATE_ADD(DATE_SUB(NOW(), INTERVAL 2 MONTHS), INTERVAL 1 YEAR), 'active', 'SLACK-PRO-001'),
            (?, 'Zoom Pro', 'Zoom', 400.00, 15, 6000.00, DATE_SUB(NOW(), INTERVAL 3 MONTHS), DATE_ADD(DATE_SUB(NOW(), INTERVAL 3 MONTHS), INTERVAL 1 YEAR), 'active', 'ZOOM-PRO-001')
        ");
        $stmt->execute([$license1, $license2, $license3, $license4, $license5]);
        $results[] = "Inserted sample license purchases";
    } else {
        $results[] = "License_purchases table already exists";
    }

    // Get final table count
    $stmt = $pdo->query("SHOW TABLES");
    $finalTables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $results[] = "Final tables: " . implode(', ', $finalTables);

    // Get data counts
    foreach (['users', 'clients', 'license_purchases'] as $table) {
        if (in_array($table, $finalTables)) {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM $table");
            $count = $stmt->fetch()['count'];
            $results[] = "$table has $count records";
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Database setup completed successfully',
        'results' => $results,
        'timestamp' => date('Y-m-d H:i:s')
    ]);

} catch (PDOException $e) {
    error_log("Database Setup Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database setup failed',
        'message' => $e->getMessage(),
        'error_code' => $e->getCode(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
} catch (Exception $e) {
    error_log("Setup Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Setup failed',
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
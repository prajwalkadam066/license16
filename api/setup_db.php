<?php
/**
 * Database Setup Diagnostic Script for cPanel
 * This script will help you determine if your database is set up correctly
 * and fix common issues.
 * 
 * Instructions:
 * 1. Upload this file to your cPanel account
 * 2. Visit the file in your browser (e.g. https://yourdomain.com/setup_db.php)
 * 3. Follow the instructions on the page
 */

// Enable error reporting for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Start output buffering to catch any unexpected output
ob_start();

header('Content-Type: text/html; charset=UTF-8');

echo '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LicenseHub Database Setup Tool</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1, h2 {
            color: #1a73e8;
        }
        .success {
            color: #0f9d58;
            background-color: #e6f4ea;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
        }
        .error {
            color: #d93025;
            background-color: #fce8e6;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
        }
        .warning {
            color: #f29900;
            background-color: #fef7e0;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
        }
        .code {
            background-color: #f5f5f5;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            white-space: pre-wrap;
            margin: 10px 0;
        }
        table {
            border-collapse: collapse;
            width: 100%;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
        button {
            background-color: #1a73e8;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background-color: #1557b0;
        }
    </style>
</head>
<body>
    <h1>LicenseHub Database Setup Tool</h1>
    <p>This tool will help you diagnose and fix common issues with your database setup for the LicenseHub application.</p>
';

// Default database settings
$host = "82.25.105.94";
$port = "3306";
$db_name = "cybaemtechnet_LMS_Project";
$username = "cybaemtechnet_LMS_Project";
$password = "PrajwalAK12";

// Check for database configuration in environment
$config_file = __DIR__ . '/api/config/database.php';
if (file_exists($config_file)) {
    echo "<p>Found database configuration file at: {$config_file}</p>";
    // We won't parse the PHP file, but just notify the user
}

// Function to test database connection
function testConnection($host, $port, $username, $password, $db_name = null) {
    try {
        $dsn = "mysql:host={$host};port={$port}";
        if ($db_name) {
            $dsn .= ";dbname={$db_name}";
        }
        $conn = new PDO($dsn, $username, $password);
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return [true, $conn];
    } catch (PDOException $e) {
        return [false, $e->getMessage()];
    }
}

// Test connecting to MySQL without specifying database
echo "<h2>Step 1: Testing MySQL Connection</h2>";
list($success, $result) = testConnection($host, $port, $username, $password);
if ($success) {
    echo "<div class='success'>✓ Successfully connected to MySQL server at {$host}:{$port} with user {$username}</div>";
    $conn = $result;
    
    // Get MySQL version
    $stmt = $conn->query("SELECT VERSION() as version");
    $version = $stmt->fetch(PDO::FETCH_ASSOC)['version'];
    echo "<p>MySQL Version: {$version}</p>";
    
    // Get character set and collation
    $stmt = $conn->query("SHOW VARIABLES LIKE 'character_set_database'");
    $charset = $stmt->fetch(PDO::FETCH_ASSOC)['Value'];
    $stmt = $conn->query("SHOW VARIABLES LIKE 'collation_database'");
    $collation = $stmt->fetch(PDO::FETCH_ASSOC)['Value'];
    echo "<p>Default Character Set: {$charset}<br>Default Collation: {$collation}</p>";
    
    // List all databases
    $stmt = $conn->query("SHOW DATABASES");
    $databases = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "<h3>Available Databases:</h3>";
    echo "<ul>";
    foreach ($databases as $database) {
        echo "<li>" . htmlspecialchars($database) . ($database == $db_name ? " (target database)" : "") . "</li>";
    }
    echo "</ul>";
    
    // Check if our database exists
    if (in_array($db_name, $databases)) {
        echo "<div class='success'>✓ Database '{$db_name}' exists</div>";
        
        // Test connecting to the specific database
        echo "<h2>Step 2: Testing Database Connection</h2>";
        list($db_success, $db_result) = testConnection($host, $port, $username, $password, $db_name);
        
        if ($db_success) {
            echo "<div class='success'>✓ Successfully connected to database '{$db_name}'</div>";
            $db_conn = $db_result;
            
            // Check tables
            echo "<h2>Step 3: Checking Database Tables</h2>";
            $stmt = $db_conn->query("SHOW TABLES");
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            $expected_tables = [
                'users',
                'clients',
                'currencies',
                'tools',
                'license_purchases',
                'license_allocations',
                'email_notifications',
                'notification_settings',
                'license_usage_logs'
            ];
            
            $missing_tables = array_diff($expected_tables, $tables);
            
            if (empty($missing_tables)) {
                echo "<div class='success'>✓ All required tables exist in the database</div>";
                
                // Show table details
                echo "<h3>Database Tables:</h3>";
                echo "<table>";
                echo "<tr><th>Table Name</th><th>Row Count</th></tr>";
                
                foreach ($tables as $table) {
                    $stmt = $db_conn->query("SELECT COUNT(*) as count FROM `{$table}`");
                    $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
                    echo "<tr><td>" . htmlspecialchars($table) . "</td><td>{$count}</td></tr>";
                }
                
                echo "</table>";
                
                // Check users
                echo "<h2>Step 4: Checking User Accounts</h2>";
                $stmt = $db_conn->query("SELECT id, email, role FROM users");
                $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                if (count($users) > 0) {
                    echo "<div class='success'>✓ Found " . count($users) . " user(s) in the database</div>";
                    
                    echo "<h3>User Accounts:</h3>";
                    echo "<table>";
                    echo "<tr><th>ID</th><th>Email</th><th>Role</th></tr>";
                    
                    foreach ($users as $user) {
                        echo "<tr><td>" . htmlspecialchars($user['id']) . "</td><td>" . 
                             htmlspecialchars($user['email']) . "</td><td>" . 
                             htmlspecialchars($user['role']) . "</td></tr>";
                    }
                    
                    echo "</table>";
                    
                    // Try to login with the admin user
                    $admin_email = 'rohan.bhosale@cybaemtech.com';
                    $admin_password = 'password';
                    
                    echo "<h2>Step 5: Testing Authentication</h2>";
                    echo "<p>Testing login with admin account (rohan.bhosale@cybaemtech.com)...</p>";
                    
                    $stmt = $db_conn->prepare("SELECT * FROM users WHERE email = :email");
                    $stmt->bindParam(':email', $admin_email);
                    $stmt->execute();
                    $user = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    if ($user) {
                        if (password_verify($admin_password, $user['password'])) {
                            echo "<div class='success'>✓ Authentication successful for admin user</div>";
                            echo "<p>Your database appears to be set up correctly.</p>";
                        } else {
                            echo "<div class='error'>✗ Password verification failed for admin user</div>";
                            echo "<p>The password hash in the database doesn't match the expected password 'password'.</p>";
                            
                            // Offer to fix
                            echo "<form method='post'>";
                            echo "<input type='hidden' name='action' value='fix_password'>";
                            echo "<button type='submit'>Reset Admin Password to 'password'</button>";
                            echo "</form>";
                        }
                    } else {
                        echo "<div class='error'>✗ Admin user not found in the database</div>";
                        
                        // Offer to create admin user
                        echo "<form method='post'>";
                        echo "<input type='hidden' name='action' value='create_admin'>";
                        echo "<button type='submit'>Create Admin User</button>";
                        echo "</form>";
                    }
                } else {
                    echo "<div class='error'>✗ No users found in the database</div>";
                    
                    // Offer to create admin user
                    echo "<form method='post'>";
                    echo "<input type='hidden' name='action' value='create_admin'>";
                    echo "<button type='submit'>Create Admin User</button>";
                    echo "</form>";
                }
                
            } else {
                echo "<div class='error'>✗ Missing required tables: " . implode(', ', $missing_tables) . "</div>";
                
                // Offer to create tables
                echo "<form method='post'>";
                echo "<input type='hidden' name='action' value='create_tables'>";
                echo "<button type='submit'>Create Missing Tables</button>";
                echo "</form>";
            }
        } else {
            echo "<div class='error'>✗ Failed to connect to database '{$db_name}': " . htmlspecialchars($db_result) . "</div>";
        }
    } else {
        echo "<div class='error'>✗ Database '{$db_name}' does not exist</div>";
        
        // Offer to create database
        echo "<form method='post'>";
        echo "<input type='hidden' name='action' value='create_database'>";
        echo "<button type='submit'>Create Database</button>";
        echo "</form>";
    }
} else {
    echo "<div class='error'>✗ Failed to connect to MySQL server: " . htmlspecialchars($result) . "</div>";
    echo "<p>Please check your database credentials in the configuration file.</p>";
}

// Process form actions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    
    switch ($action) {
        case 'create_database':
            // Create database
            try {
                $conn = new PDO("mysql:host={$host};port={$port}", $username, $password);
                $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                $conn->exec("CREATE DATABASE IF NOT EXISTS `{$db_name}`");
                echo "<div class='success'>✓ Database '{$db_name}' created successfully</div>";
                echo "<script>setTimeout(function() { window.location.reload(); }, 2000);</script>";
            } catch (PDOException $e) {
                echo "<div class='error'>✗ Failed to create database: " . htmlspecialchars($e->getMessage()) . "</div>";
            }
            break;
            
        case 'create_tables':
            try {
                $conn = new PDO("mysql:host={$host};port={$port};dbname={$db_name}", $username, $password);
                $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                
                // Read SQL file
                $sql_file = __DIR__ . '/api/cpanel_setup.sql';
                if (file_exists($sql_file)) {
                    $sql = file_get_contents($sql_file);
                    
                    // Split SQL by semicolons
                    $statements = array_filter(array_map('trim', explode(';', $sql)));
                    
                    // Execute each statement
                    foreach ($statements as $statement) {
                        if (!empty($statement)) {
                            $conn->exec($statement);
                        }
                    }
                    
                    echo "<div class='success'>✓ Tables created successfully from SQL file</div>";
                    echo "<script>setTimeout(function() { window.location.reload(); }, 2000);</script>";
                } else {
                    echo "<div class='error'>✗ SQL file not found: {$sql_file}</div>";
                    
                    // Manually create tables
                    echo "<div class='warning'>Creating tables manually...</div>";
                    
                    // Create users table
                    $conn->exec("
                        CREATE TABLE users (
                            id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
                            email VARCHAR(255) NOT NULL UNIQUE,
                            password VARCHAR(255) NOT NULL,
                            role ENUM('admin', 'accounts', 'user') NOT NULL DEFAULT 'user',
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            INDEX idx_users_email (email),
                            INDEX idx_users_role (role)
                        )
                    ");
                    
                    // Insert admin user
                    $hashedPassword = password_hash('password', PASSWORD_BCRYPT);
                    $conn->exec("
                        INSERT INTO users (id, email, password, role) VALUES 
                        (UUID(), 'rohan.bhosale@cybaemtech.com', '{$hashedPassword}', 'admin'),
                        (UUID(), 'accounts@cybaemtech.com', '{$hashedPassword}', 'accounts')
                    ");
                    
                    echo "<div class='success'>✓ Users table created and populated</div>";
                    echo "<script>setTimeout(function() { window.location.reload(); }, 2000);</script>";
                }
            } catch (PDOException $e) {
                echo "<div class='error'>✗ Failed to create tables: " . htmlspecialchars($e->getMessage()) . "</div>";
            }
            break;
            
        case 'create_admin':
            try {
                $conn = new PDO("mysql:host={$host};port={$port};dbname={$db_name}", $username, $password);
                $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                
                // Insert admin user
                $hashedPassword = password_hash('password', PASSWORD_BCRYPT);
                $conn->exec("
                    INSERT INTO users (id, email, password, role) VALUES 
                    (UUID(), 'rohan.bhosale@cybaemtech.com', '{$hashedPassword}', 'admin'),
                    (UUID(), 'accounts@cybaemtech.com', '{$hashedPassword}', 'accounts')
                ");
                
                echo "<div class='success'>✓ Admin users created successfully</div>";
                echo "<script>setTimeout(function() { window.location.reload(); }, 2000);</script>";
            } catch (PDOException $e) {
                echo "<div class='error'>✗ Failed to create admin user: " . htmlspecialchars($e->getMessage()) . "</div>";
            }
            break;
            
        case 'fix_password':
            try {
                $conn = new PDO("mysql:host={$host};port={$port};dbname={$db_name}", $username, $password);
                $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                
                // Update admin password
                $hashedPassword = password_hash('password', PASSWORD_BCRYPT);
                $conn->exec("UPDATE users SET password = '{$hashedPassword}' WHERE email = 'rohan.bhosale@cybaemtech.com'");
                $conn->exec("UPDATE users SET password = '{$hashedPassword}' WHERE email = 'accounts@cybaemtech.com'");
                
                echo "<div class='success'>✓ User passwords reset successfully</div>";
                echo "<script>setTimeout(function() { window.location.reload(); }, 2000);</script>";
            } catch (PDOException $e) {
                echo "<div class='error'>✗ Failed to reset password: " . htmlspecialchars($e->getMessage()) . "</div>";
            }
            break;
    }
}

echo '
    <h2>Troubleshooting Tips</h2>
    <ol>
        <li>Make sure your cPanel database username and password are correct.</li>
        <li>In cPanel, ensure the database user has all privileges on the database.</li>
        <li>Verify that your connection settings in <code>api/config/database.php</code> are correct.</li>
        <li>For cPanel environments, the host should usually be "localhost" (not an IP address).</li>
        <li>Check that your JWT_SECRET environment variable is set (for production environments).</li>
    </ol>

    <h2>Next Steps</h2>
    <ol>
        <li>Verify your PHP API endpoints are accessible.</li>
        <li>Check your frontend API base URL configuration.</li>
        <li>Ensure CORS is properly configured.</li>
    </ol>
</body>
</html>';

// End output buffering
$output = ob_get_clean();
echo $output;
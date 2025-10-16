<?php
/**
 * Client Table Migration Script
 * Adds extended fields to match cPanel schema
 */

// Database connection
$host = getenv('MYSQL_HOST') ?: '82.25.105.94';
$dbname = getenv('MYSQL_DATABASE') ?: 'cybaemtechnet_LMS_Project';
$username = getenv('MYSQL_USER') ?: 'cybaemtechnet_LMS_Project';
$password = getenv('MYSQL_PASSWORD') ?: 'PrajwalAK12';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
    
    echo "✅ Connected to database successfully\n\n";
    
    // Check current columns
    echo "📋 Current clients table columns:\n";
    echo str_repeat("-", 60) . "\n";
    $stmt = $pdo->query("SHOW COLUMNS FROM clients");
    $existingColumns = [];
    while ($column = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $existingColumns[] = $column['Field'];
        echo sprintf("%-25s %-15s %-10s\n", 
            $column['Field'], 
            $column['Type'], 
            $column['Null'] == 'YES' ? 'NULL' : 'NOT NULL'
        );
    }
    echo str_repeat("-", 60) . "\n\n";
    
    // Define columns to add
    $columnsToAdd = [
        'contact_person' => "VARCHAR(255) NULL AFTER name",
        'company_name' => "VARCHAR(255) NULL AFTER email",
        'address' => "TEXT NULL AFTER company_name",
        'gst_treatment' => "VARCHAR(100) NULL AFTER address",
        'source_of_supply' => "VARCHAR(100) NULL AFTER gst_treatment",
        'pan' => "CHAR(10) NULL AFTER source_of_supply",
        'currency_id' => "CHAR(36) NULL AFTER pan",
        'mode_of_payment' => "VARCHAR(100) NULL AFTER currency_id",
        'amount' => "DECIMAL(15,2) NULL AFTER mode_of_payment",
        'quantity' => "INT NULL AFTER amount",
        'status' => "ENUM('active', 'inactive') DEFAULT 'active' AFTER quantity"
    ];
    
    echo "🔧 Adding missing columns...\n";
    echo str_repeat("-", 60) . "\n";
    
    foreach ($columnsToAdd as $columnName => $columnDefinition) {
        if (!in_array($columnName, $existingColumns)) {
            try {
                $sql = "ALTER TABLE clients ADD COLUMN $columnName $columnDefinition";
                $pdo->exec($sql);
                echo "✅ Added column: $columnName\n";
            } catch (PDOException $e) {
                echo "❌ Failed to add $columnName: " . $e->getMessage() . "\n";
            }
        } else {
            echo "⏭️  Column already exists: $columnName\n";
        }
    }
    
    echo str_repeat("-", 60) . "\n\n";
    
    // Show final schema
    echo "📋 Final clients table columns:\n";
    echo str_repeat("-", 60) . "\n";
    $stmt = $pdo->query("SHOW COLUMNS FROM clients");
    while ($column = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo sprintf("%-25s %-20s %-10s\n", 
            $column['Field'], 
            $column['Type'], 
            $column['Null'] == 'YES' ? 'NULL' : 'NOT NULL'
        );
    }
    echo str_repeat("-", 60) . "\n\n";
    
    echo "✅ Migration completed successfully!\n";
    echo "🎉 Your clients table now matches the cPanel schema.\n\n";
    echo "📝 Next steps:\n";
    echo "1. Create a new client with all fields\n";
    echo "2. Edit existing clients to add missing information\n";
    echo "3. The Edit button should now work properly\n";
    
} catch (PDOException $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

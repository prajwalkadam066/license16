<?php
/**
 * Insert sample client data for testing
 */

// Database connection for cPanel
$host = '82.25.105.94';
$dbname = 'cybaemtechnet_LMS_Project';
$username = 'cybaemtechnet_LMS_Project';
$password = 'PrajwalAK12';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    // Sample clients data
    $clients = [
        [
            'id' => 'client_' . uniqid(),
            'user_id' => 'user_' . uniqid(),
            'name' => 'John Doe',
            'phone' => '+1-555-0123',
            'email' => 'john.doe@example.com'
        ],
        [
            'id' => 'client_' . uniqid(),
            'user_id' => 'user_' . uniqid(),
            'name' => 'Jane Smith',
            'phone' => '+1-555-0456',
            'email' => 'jane.smith@example.com'
        ],
        [
            'id' => 'client_' . uniqid(),
            'user_id' => 'user_' . uniqid(),
            'name' => 'Bob Johnson',
            'phone' => '+1-555-0789',
            'email' => 'bob.johnson@example.com'
        ]
    ];

    // Insert each client
    $sql = "INSERT INTO clients (id, user_id, name, phone, email, created_at, updated_at) 
            VALUES (:id, :user_id, :name, :phone, :email, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP())
            ON DUPLICATE KEY UPDATE name = VALUES(name)";
    
    $stmt = $pdo->prepare($sql);
    
    foreach ($clients as $client) {
        $stmt->execute([
            ':id' => $client['id'],
            ':user_id' => $client['user_id'],
            ':name' => $client['name'],
            ':phone' => $client['phone'],
            ':email' => $client['email']
        ]);
        echo "Inserted client: {$client['name']}\n";
    }

    echo "Sample clients inserted successfully!\n";

} catch (PDOException $e) {
    echo "Database Error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
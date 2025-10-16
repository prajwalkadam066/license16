<?php
/**
 * Insert Sample License Data - Matches Database Structure Exactly
 */

// Set CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
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

    echo json_encode(['message' => 'Database connected successfully']);

    // Sample data that matches your exact table structure
    $sampleData = [
        [
            'id' => 'lic_' . uniqid(),
            'user_id' => 'user_' . uniqid(),
            'client_id' => null, // Nullable field
            'tool_name' => 'Microsoft Office 365',
            'make' => 'Microsoft',
            'model' => 'E3',
            'version' => '2024',
            'vendor' => 'Microsoft',
            'cost_per_user' => 250.00,
            'quantity' => 10,
            'total_cost' => 2500.00,
            'total_cost_inr' => 208250.00,
            'purchase_date' => '2024-01-15',
            'expiration_date' => '2025-01-15',
            'invoice_no' => 'INV-2024-001',
            'serial_no' => 'MSO365-2024-001',
            'currency_code' => 'USD',
            'original_amount' => 2500.00
        ],
        [
            'id' => 'lic_' . uniqid(),
            'user_id' => 'user_' . uniqid(),
            'client_id' => null,
            'tool_name' => 'Adobe Creative Suite',
            'make' => 'Adobe',
            'model' => 'Creative Cloud',
            'version' => '2024',
            'vendor' => 'Adobe',
            'cost_per_user' => 600.00,
            'quantity' => 5,
            'total_cost' => 3000.00,
            'total_cost_inr' => 249900.00,
            'purchase_date' => '2024-02-01',
            'expiration_date' => '2025-02-01',
            'invoice_no' => 'INV-2024-002',
            'serial_no' => 'ADOBE-CC-2024-001',
            'currency_code' => 'USD',
            'original_amount' => 3000.00
        ],
        [
            'id' => 'lic_' . uniqid(),
            'user_id' => 'user_' . uniqid(),
            'client_id' => null,
            'tool_name' => 'Slack Business',
            'make' => 'Slack',
            'model' => 'Business+',
            'version' => '2024',
            'vendor' => 'Salesforce',
            'cost_per_user' => 120.00,
            'quantity' => 15,
            'total_cost' => 1800.00,
            'total_cost_inr' => 149940.00,
            'purchase_date' => '2024-03-10',
            'expiration_date' => '2025-03-10',
            'invoice_no' => 'INV-2024-003',
            'serial_no' => 'SLACK-BUS-2024-001',
            'currency_code' => 'USD',
            'original_amount' => 1800.00
        ],
        [
            'id' => 'lic_' . uniqid(),
            'user_id' => 'user_' . uniqid(),
            'client_id' => null,
            'tool_name' => 'Zoom Pro',
            'make' => 'Zoom',
            'model' => 'Pro',
            'version' => '2024',
            'vendor' => 'Zoom Video Communications',
            'cost_per_user' => 149.90,
            'quantity' => 20,
            'total_cost' => 2998.00,
            'total_cost_inr' => 249583.40,
            'purchase_date' => '2024-04-05',
            'expiration_date' => '2025-04-05',
            'invoice_no' => 'INV-2024-004',
            'serial_no' => 'ZOOM-PRO-2024-001',
            'currency_code' => 'USD',
            'original_amount' => 2998.00
        ],
        [
            'id' => 'lic_' . uniqid(),
            'user_id' => 'user_' . uniqid(),
            'client_id' => null,
            'tool_name' => 'Atlassian Jira',
            'make' => 'Atlassian',
            'model' => 'Standard',
            'version' => '2024',
            'vendor' => 'Atlassian',
            'cost_per_user' => 70.00,
            'quantity' => 12,
            'total_cost' => 840.00,
            'total_cost_inr' => 69972.00,
            'purchase_date' => '2024-05-20',
            'expiration_date' => '2025-05-20',
            'invoice_no' => 'INV-2024-005',
            'serial_no' => 'JIRA-STD-2024-001',
            'currency_code' => 'USD',
            'original_amount' => 840.00
        ]
    ];

    // Check if data already exists
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM license_purchases");
    $result = $stmt->fetch();
    $existingCount = $result['count'];

    if ($existingCount > 0) {
        echo json_encode([
            'success' => true,
            'message' => "Database already has $existingCount license records",
            'action' => 'skipped_insert',
            'existing_count' => $existingCount
        ]);
        exit;
    }

    // Insert sample data
    $insertedCount = 0;
    
    foreach ($sampleData as $license) {
        try {
            $sql = "INSERT INTO license_purchases (
                id, user_id, client_id, tool_name, make, model, version, vendor,
                cost_per_user, quantity, total_cost, total_cost_inr,
                purchase_date, expiration_date, invoice_no, serial_no,
                currency_code, original_amount, created_at, updated_at
            ) VALUES (
                :id, :user_id, :client_id, :tool_name, :make, :model, :version, :vendor,
                :cost_per_user, :quantity, :total_cost, :total_cost_inr,
                :purchase_date, :expiration_date, :invoice_no, :serial_no,
                :currency_code, :original_amount, NOW(), NOW()
            )";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($license);
            $insertedCount++;
            
        } catch (PDOException $e) {
            echo json_encode([
                'success' => false,
                'error' => 'Insert failed for record: ' . $license['tool_name'],
                'details' => $e->getMessage(),
                'inserted_so_far' => $insertedCount
            ]);
            exit;
        }
    }

    // Verify the insert
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM license_purchases");
    $result = $stmt->fetch();
    $totalCount = $result['count'];

    // Get a sample of the inserted data
    $stmt = $pdo->query("SELECT tool_name, vendor, total_cost, purchase_date FROM license_purchases LIMIT 3");
    $sampleRecords = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'message' => "Successfully inserted $insertedCount sample license records",
        'total_records' => $totalCount,
        'sample_data' => $sampleRecords,
        'action' => 'inserted_sample_data'
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error',
        'message' => $e->getMessage(),
        'error_code' => $e->getCode()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error',
        'message' => $e->getMessage()
    ]);
}
?>
<?php
/**
 * Clients API Endpoint
 * Returns all clients with proper CORS headers
 */

// Enable error reporting for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Set CORS headers before any output
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
header('Access-Control-Max-Age: 86400');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    // Database connection using environment variables (secure approach)
    $host = getenv('MYSQL_HOST') ?: '82.25.105.94';
    $dbname = getenv('MYSQL_DATABASE') ?: 'cybaemtechnet_LMS_Project';
    $username = getenv('MYSQL_USER') ?: 'cybaemtechnet_LMS_Project';
    $password = getenv('MYSQL_PASSWORD') ?: 'PrajwalAK12';

    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Check if this is a request for a specific client (GET /api/clients/{id})
        $clientId = null;
        if (preg_match('#/clients/([^/]+)$#', $_SERVER['REQUEST_URI'], $matches)) {
            $clientId = $matches[1];
        }
        
        if ($clientId) {
            // Handle GET request for specific client with licenses and stats
            
            // Fetch client data
            $stmt = $pdo->prepare("SELECT * FROM clients WHERE id = ? LIMIT 1");
            $stmt->execute([$clientId]);
            $client = $stmt->fetch();
            
            if (!$client) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Client not found'
                ]);
                exit;
            }
            
            // Fetch client's licenses with currency info
            $stmt = $pdo->prepare("
                SELECT 
                    lp.*,
                    c.symbol as currency_symbol
                FROM license_purchases lp
                LEFT JOIN currencies c ON lp.currency_code = c.code
                WHERE lp.client_id = ?
                ORDER BY lp.created_at DESC
            ");
            $stmt->execute([$clientId]);
            $licensesRaw = $stmt->fetchAll();
            
            // Transform licenses and calculate stats
            $licenses = [];
            $activeLicenses = 0;
            $expiredLicenses = 0;
            $totalCostInr = 0;
            $now = new DateTime();
            
            foreach ($licensesRaw as $l) {
                $expirationDate = $l['expiration_date'] ? new DateTime($l['expiration_date']) : null;
                $isExpired = $expirationDate ? $expirationDate <= $now : false;
                
                // Calculate total cost in INR (simplified conversion)
                $originalTotal = floatval($l['total_cost'] ?? 0);
                $totalCostInrLicense = floatval($l['total_cost_inr'] ?? $originalTotal);
                
                $license = [
                    'id' => $l['id'],
                    'tool_name' => $l['tool_name'] ?? 'N/A',
                    'tool_description' => $l['model'] ?? $l['version'] ?? null,
                    'tool_vendor' => $l['vendor'] ?? 'N/A',
                    'purchase_date' => $l['purchase_date'],
                    'expiry_date' => $l['expiration_date'],
                    'number_of_users' => intval($l['quantity'] ?? 1),
                    'cost_per_user' => floatval($l['cost_per_user'] ?? 0),
                    'total_cost' => $originalTotal,
                    'total_cost_inr' => $totalCostInrLicense,
                    'currency_code' => $l['currency_code'] ?? 'INR',
                    'currency_symbol' => $l['currency_symbol'] ?? '₹',
                    'status' => $isExpired ? 'expired' : 'active'
                ];
                
                $licenses[] = $license;
                
                if ($isExpired) {
                    $expiredLicenses++;
                } else {
                    $activeLicenses++;
                }
                
                $totalCostInr += $totalCostInrLicense;
            }
            
            // Return client details with licenses and stats
            echo json_encode([
                'success' => true,
                'data' => [
                    'client' => $client,
                    'licenses' => $licenses,
                    'stats' => [
                        'total_licenses' => count($licenses),
                        'active_licenses' => $activeLicenses,
                        'expired_licenses' => $expiredLicenses,
                        'total_cost' => $totalCostInr
                    ]
                ]
            ]);
            exit;
        }
        
        // Handle GET request - fetch all clients
        
        // Check if clients table exists
        $stmt = $pdo->query("SHOW TABLES LIKE 'clients'");
        if ($stmt->rowCount() === 0) {
            throw new Exception('clients table does not exist');
        }

        // Get all available columns from clients table
        $stmt = $pdo->query("SHOW COLUMNS FROM clients");
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Build dynamic SELECT query based on available columns
        $selectFields = implode(', ', $columns);
        
        $sql = "SELECT $selectFields FROM clients ORDER BY created_at DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $clients = $stmt->fetchAll();

        // Format the data for frontend consumption
        $formattedClients = [];
        foreach ($clients as $client) {
            $formatted = [
                'id' => $client['id'] ?? '',
                'user_id' => $client['user_id'] ?? '',
                'name' => $client['name'] ?? '',
                'phone' => $client['phone'] ?? '',
                'email' => $client['email'] ?? '',
                'created_at' => $client['created_at'] ?? null,
                'updated_at' => $client['updated_at'] ?? null
            ];
            
            // Add optional fields (include even if NULL so frontend can display properly)
            if (array_key_exists('contact_person', $client)) $formatted['contact_person'] = $client['contact_person'];
            if (array_key_exists('address', $client)) $formatted['address'] = $client['address'];
            if (array_key_exists('company_name', $client)) $formatted['company_name'] = $client['company_name'];
            if (array_key_exists('gst_treatment', $client)) $formatted['gst_treatment'] = $client['gst_treatment'];
            if (array_key_exists('source_of_supply', $client)) $formatted['source_of_supply'] = $client['source_of_supply'];
            if (array_key_exists('gst', $client)) $formatted['gst'] = $client['gst'];
            if (array_key_exists('currency_id', $client)) $formatted['currency_id'] = $client['currency_id'];
            if (array_key_exists('mode_of_payment', $client)) $formatted['mode_of_payment'] = $client['mode_of_payment'];
            if (array_key_exists('amount', $client)) $formatted['amount'] = $client['amount'];
            if (array_key_exists('quantity', $client)) $formatted['quantity'] = $client['quantity'];
            if (array_key_exists('status', $client)) $formatted['status'] = $client['status'];
            
            $formattedClients[] = $formatted;
        }

        // Return successful response
        echo json_encode([
            'success' => true,
            'data' => $formattedClients,
            'total_count' => count($formattedClients),
            'timestamp' => date('Y-m-d H:i:s'),
            'message' => 'Clients retrieved successfully'
        ]);

    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Handle POST request - create new client
        
        error_log("POST request received for client creation");
        
        $rawInput = file_get_contents('php://input');
        error_log("Raw input: " . $rawInput);
        
        $input = json_decode($rawInput, true);
        
        if (!$input) {
            error_log("Failed to decode JSON input");
            http_response_code(400);
            echo json_encode([
                'success' => false, 
                'error' => 'Invalid JSON input',
                'raw_input' => $rawInput,
                'json_error' => json_last_error_msg()
            ]);
            exit;
        }

        error_log("Decoded input: " . print_r($input, true));

        // Validate required fields
        $name = trim($input['name'] ?? '');
        $phone = trim($input['phone'] ?? '');
        $email = trim($input['email'] ?? '');

        error_log("Validated fields - Name: $name, Phone: $phone, Email: $email");

        if (empty($name)) {
            error_log("Name validation failed");
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Name is required']);
            exit;
        }

        if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            error_log("Email validation failed: $email");
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid email format']);
            exit;
        }

        // Check for duplicate email if provided
        if (!empty($email)) {
            try {
                $stmt = $pdo->prepare("SELECT id FROM clients WHERE email = :email");
                $stmt->execute([':email' => $email]);
                if ($stmt->rowCount() > 0) {
                    error_log("Duplicate email found: $email");
                    http_response_code(400);
                    echo json_encode(['success' => false, 'error' => 'Email already exists']);
                    exit;
                }
            } catch (PDOException $e) {
                error_log("Email check failed: " . $e->getMessage());
                throw $e;
            }
        }

        // Get an existing user_id from the users table (foreign key constraint requirement)
        $stmt = $pdo->query("SELECT id FROM users LIMIT 1");
        $existingUser = $stmt->fetch();
        
        if (!$existingUser) {
            // If no users exist, we need to create one or use a default
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'No users found in database. Cannot create client without valid user_id.',
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            exit;
        }
        
        $userId = $existingUser['id'];
        error_log("Using existing User ID: $userId");

        // Get available columns from clients table
        $stmt = $pdo->query("SHOW COLUMNS FROM clients");
        $availableColumns = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Build dynamic insert based on available columns and provided data
        $insertFields = ['user_id', 'name', 'phone', 'email'];
        $insertValues = [
            ':user_id' => $userId,
            ':name' => $name,
            ':phone' => $phone,
            ':email' => $email
        ];
        
        // Add optional fields if they exist in both the table and the input
        $optionalFields = [
            'address', 'company_name', 'gst_treatment', 'source_of_supply', 
            'gst', 'currency_id', 'mode_of_payment', 'amount', 'quantity', 
            'status', 'contact_person'
        ];
        
        foreach ($optionalFields as $field) {
            if (in_array($field, $availableColumns) && isset($input[$field])) {
                $insertFields[] = $field;
                // Preserve non-empty values, convert only null/undefined to null
                $value = $input[$field];
                if ($value === null) {
                    $insertValues[":$field"] = null;
                } else {
                    // Trim string values, preserve empty strings as empty strings
                    $insertValues[":$field"] = is_string($value) ? trim($value) : $value;
                }
            }
        }
        
        // Build SQL
        $fieldsStr = implode(', ', $insertFields);
        $placeholders = ':' . implode(', :', $insertFields);
        $sql = "INSERT INTO clients ($fieldsStr, created_at, updated_at) 
                VALUES ($placeholders, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP())";
        
        error_log("Dynamic INSERT SQL: $sql");
        error_log("Insert values: " . print_r($insertValues, true));
        
        try {
            $stmt = $pdo->prepare($sql);
            $result = $stmt->execute($insertValues);

            error_log("Insert result: " . ($result ? 'success' : 'failed'));
            error_log("Affected rows: " . $stmt->rowCount());

            if (!$result) {
                throw new Exception("Insert operation failed");
            }

            // Get the last inserted ID (database generated UUID)
            $clientId = $pdo->lastInsertId();
            
            // If lastInsertId doesn't work with UUIDs, find the latest client by user_id
            if (!$clientId) {
                $stmt = $pdo->prepare("SELECT id FROM clients WHERE user_id = :user_id ORDER BY created_at DESC LIMIT 1");
                $stmt->execute([':user_id' => $userId]);
                $result = $stmt->fetch();
                $clientId = $result['id'] ?? null;
            }

            if (!$clientId) {
                throw new Exception("Could not retrieve generated client ID");
            }

            // Return the created client
            $stmt = $pdo->prepare("SELECT * FROM clients WHERE id = :id");
            $stmt->execute([':id' => $clientId]);
            $newClient = $stmt->fetch();

            error_log("Created client: " . print_r($newClient, true));

            echo json_encode([
                'success' => true,
                'data' => $newClient,
                'message' => 'Client created successfully',
                'timestamp' => date('Y-m-d H:i:s')
            ]);

        } catch (PDOException $e) {
            error_log("Database insert error: " . $e->getMessage());
            error_log("SQL: $sql");
            error_log("Parameters: " . print_r([
                ':user_id' => $userId,
                ':name' => $name,
                ':phone' => $phone,
                ':email' => $email
            ], true));
            throw $e;
        }

    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        // Handle PUT request - update client
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Get client ID from URL path or request body
        $clientId = null;
        if (preg_match('#/clients/([^/]+)$#', $_SERVER['REQUEST_URI'], $matches)) {
            $clientId = $matches[1];
        } elseif (isset($input['id'])) {
            $clientId = $input['id'];
        }
        
        if (!$clientId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Client ID is required']);
            exit;
        }
        $name = trim($input['name'] ?? '');
        $phone = trim($input['phone'] ?? '');
        $email = trim($input['email'] ?? '');

        if (empty($name)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Name is required']);
            exit;
        }

        if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid email format']);
            exit;
        }

        // Get available columns from clients table
        $stmt = $pdo->query("SHOW COLUMNS FROM clients");
        $availableColumns = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Build dynamic update based on available columns and provided data
        $updateFields = [];
        $updateValues = [':id' => $clientId];
        
        // Always update basic fields if provided
        if (!empty($name)) {
            $updateFields[] = 'name = :name';
            $updateValues[':name'] = $name;
        }
        if (isset($input['phone'])) {
            $updateFields[] = 'phone = :phone';
            $updateValues[':phone'] = $phone;
        }
        if (isset($input['email'])) {
            $updateFields[] = 'email = :email';
            $updateValues[':email'] = $email;
        }
        
        // Add optional fields if they exist in both the table and the input
        $optionalFields = [
            'address', 'company_name', 'gst_treatment', 'source_of_supply', 
            'gst', 'currency_id', 'mode_of_payment', 'amount', 'quantity', 
            'status', 'contact_person'
        ];
        
        foreach ($optionalFields as $field) {
            if (in_array($field, $availableColumns) && isset($input[$field])) {
                $updateFields[] = "$field = :$field";
                // Preserve non-empty values, convert only null/undefined to null
                $value = $input[$field];
                if ($value === null) {
                    $updateValues[":$field"] = null;
                } else {
                    // Trim string values, preserve empty strings as empty strings
                    $updateValues[":$field"] = is_string($value) ? trim($value) : $value;
                }
            }
        }
        
        if (empty($updateFields)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'No fields to update']);
            exit;
        }
        
        // Build SQL
        $updateFieldsStr = implode(', ', $updateFields);
        $sql = "UPDATE clients SET $updateFieldsStr, updated_at = CURRENT_TIMESTAMP() WHERE id = :id";
        
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute($updateValues);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Client not found']);
            exit;
        }

        // Return the updated client
        $stmt = $pdo->prepare("SELECT * FROM clients WHERE id = :id");
        $stmt->execute([':id' => $clientId]);
        $updatedClient = $stmt->fetch();

        echo json_encode([
            'success' => true,
            'data' => $updatedClient,
            'message' => 'Client updated successfully'
        ]);

    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        // Handle DELETE request - delete client
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Client ID is required']);
            exit;
        }

        $clientId = $input['id'];

        // Delete client
        $sql = "DELETE FROM clients WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute([':id' => $clientId]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Client not found']);
            exit;
        }

        echo json_encode([
            'success' => true,
            'message' => 'Client deleted successfully'
        ]);

    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }

} catch (PDOException $e) {
    error_log("Clients API Database Error: " . $e->getMessage());
    error_log("Error Code: " . $e->getCode());
    error_log("Error Info: " . print_r($e->errorInfo ?? [], true));
    error_log("Request method: " . ($_SERVER['REQUEST_METHOD'] ?? 'unknown'));
    error_log("Host: $host, Database: $dbname, Username: $username");
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed',
        'message' => $e->getMessage(),
        'error_code' => $e->getCode(),
        'error_info' => $e->errorInfo ?? null,
        'debug_info' => [
            'host' => $host,
            'database' => $dbname,
            'username' => $username,
            'php_version' => phpversion(),
            'method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
            'timestamp' => date('Y-m-d H:i:s'),
            'request_uri' => $_SERVER['REQUEST_URI'] ?? '',
            'content_type' => $_SERVER['CONTENT_TYPE'] ?? ''
        ],
        'timestamp' => date('Y-m-d H:i:s')
    ]);
} catch (Exception $e) {
    error_log("Clients API Error: " . $e->getMessage());
    error_log("Request method: " . ($_SERVER['REQUEST_METHOD'] ?? 'unknown'));
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error',
        'message' => $e->getMessage(),
        'debug_info' => [
            'method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
            'php_version' => phpversion(),
            'timestamp' => date('Y-m-d H:i:s'),
            'request_uri' => $_SERVER['REQUEST_URI'] ?? '',
            'content_type' => $_SERVER['CONTENT_TYPE'] ?? ''
        ],
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
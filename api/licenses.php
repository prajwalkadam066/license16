<?php
/**
 * Licenses API Endpoint - Full CRUD Operations
 * GET: Retrieve all license purchases
 * POST: Add new license purchase
 * PUT: Update existing license purchase
 * DELETE: Delete license purchase
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
        // Handle GET request - fetch all license purchases
        
        // Check if license_purchases table exists
        $stmt = $pdo->query("SHOW TABLES LIKE 'license_purchases'");
        if ($stmt->rowCount() === 0) {
            throw new Exception('license_purchases table does not exist');
        }

        // Get all license purchases with client information
        $sql = "
            SELECT 
                lp.id,
                lp.user_id,
                lp.client_id,
                lp.tool_name,
                lp.make,
                lp.model,
                lp.version,
                lp.vendor,
                lp.cost_per_user,
                lp.quantity,
                lp.total_cost,
                lp.total_cost_inr,
                lp.purchase_date,
                lp.expiration_date,
                lp.invoice_no,
                lp.serial_no,
                lp.currency_code,
                lp.original_amount,
                lp.created_at,
                lp.updated_at,
                c.name as client_name,
                c.email as client_email,
                c.phone as client_phone
            FROM license_purchases lp
            LEFT JOIN clients c ON lp.client_id = c.id
            ORDER BY lp.created_at DESC
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $licenses = $stmt->fetchAll();

        // Format the data for frontend consumption with currency conversion
        $formattedLicenses = [];
        foreach ($licenses as $license) {
            $formattedLicense = [
                'id' => $license['id'] ?? '',
                'user_id' => $license['user_id'] ?? '',
                'client_id' => $license['client_id'] ?? '',
                'tool_name' => $license['tool_name'] ?? '',
                'make' => $license['make'] ?? '',
                'model' => $license['model'] ?? '',
                'version' => $license['version'] ?? '',
                'vendor' => $license['vendor'] ?? '',
                'cost_per_user' => (float)($license['cost_per_user'] ?? 0),
                'quantity' => (int)($license['quantity'] ?? 1),
                'total_cost' => (float)($license['total_cost'] ?? 0),
                'total_cost_inr' => (float)($license['total_cost_inr'] ?? 0),
                'purchase_date' => $license['purchase_date'] ?? null,
                'expiration_date' => $license['expiration_date'] ?? null,
                'invoice_no' => $license['invoice_no'] ?? '',
                'serial_no' => $license['serial_no'] ?? '',
                'currency_code' => $license['currency_code'] ?? 'INR',
                'original_amount' => (float)($license['original_amount'] ?? 0),
                'created_at' => $license['created_at'] ?? null,
                'updated_at' => $license['updated_at'] ?? null
            ];

            // Add currency conversion and formatting
            $currency_code = $formattedLicense['currency_code'];
            
            if ($currency_code === 'INR') {
                // Cost is in INR, calculate USD equivalent
                $usd_cost_per_user = $formattedLicense['cost_per_user'] * 0.012; // 1 INR = 0.012 USD
                $formattedLicense['cost_per_user_usd'] = round($usd_cost_per_user, 2);
                $formattedLicense['cost_per_user_formatted'] = '₹' . number_format($formattedLicense['cost_per_user'], 0);
                $formattedLicense['cost_per_user_usd_formatted'] = '$' . number_format($usd_cost_per_user, 2);
                
                // Total cost formatting
                if ($formattedLicense['total_cost_inr'] > 0) {
                    $formattedLicense['total_cost_formatted'] = '₹' . number_format($formattedLicense['total_cost_inr'], 0);
                    $formattedLicense['total_cost_usd'] = round($formattedLicense['total_cost_inr'] * 0.012, 2);
                    $formattedLicense['total_cost_usd_formatted'] = '$' . number_format($formattedLicense['total_cost_usd'], 2);
                } else {
                    // Fallback if total_cost_inr is not set
                    $total_inr = $formattedLicense['cost_per_user'] * $formattedLicense['quantity'];
                    $formattedLicense['total_cost_formatted'] = '₹' . number_format($total_inr, 0);
                    $formattedLicense['total_cost_usd'] = round($total_inr * 0.012, 2);
                    $formattedLicense['total_cost_usd_formatted'] = '$' . number_format($formattedLicense['total_cost_usd'], 2);
                }
            } else {
                // Cost is in USD, calculate INR equivalent
                $inr_cost_per_user = $formattedLicense['cost_per_user'] * 83.0; // 1 USD = 83 INR
                $formattedLicense['cost_per_user_inr'] = round($inr_cost_per_user, 0);
                $formattedLicense['cost_per_user_formatted'] = '$' . number_format($formattedLicense['cost_per_user'], 2);
                $formattedLicense['cost_per_user_inr_formatted'] = '₹' . number_format($inr_cost_per_user, 0);
                
                // Total cost formatting
                if ($formattedLicense['total_cost'] > 0) {
                    $formattedLicense['total_cost_formatted'] = '$' . number_format($formattedLicense['total_cost'], 2);
                    $formattedLicense['total_cost_inr'] = round($formattedLicense['total_cost'] * 83.0, 0);
                    $formattedLicense['total_cost_inr_formatted'] = '₹' . number_format($formattedLicense['total_cost_inr'], 0);
                } else {
                    // Fallback if total_cost is not set
                    $total_usd = $formattedLicense['cost_per_user'] * $formattedLicense['quantity'];
                    $formattedLicense['total_cost_formatted'] = '$' . number_format($total_usd, 2);
                    $formattedLicense['total_cost_inr'] = round($total_usd * 83.0, 0);
                    $formattedLicense['total_cost_inr_formatted'] = '₹' . number_format($formattedLicense['total_cost_inr'], 0);
                }
            }

            // Add client information if available
            if ($license['client_name']) {
                $formattedLicense['client_name'] = $license['client_name'];
                $formattedLicense['client_email'] = $license['client_email'];
                $formattedLicense['client_phone'] = $license['client_phone'];
                $formattedLicense['client'] = [
                    'name' => $license['client_name'],
                    'email' => $license['client_email'],
                    'phone' => $license['client_phone']
                ];
            }

            $formattedLicenses[] = $formattedLicense;
        }

        // Return successful response
        echo json_encode([
            'success' => true,
            'data' => $formattedLicenses,
            'total_count' => count($formattedLicenses),
            'timestamp' => date('Y-m-d H:i:s'),
            'message' => 'Licenses retrieved successfully'
        ]);

    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Handle POST request - create new license purchase
        
        error_log("POST request received for license creation");
        
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
        $tool_name = trim($input['tool_name'] ?? '');
        $cost_per_user = floatval($input['cost_per_user'] ?? 0);
        $quantity = intval($input['quantity'] ?? 1);
        $total_cost = floatval($input['total_cost'] ?? 0);
        $expiration_date = trim($input['expiration_date'] ?? '');
        
        // Optional fields
        $client_id = trim($input['client_id'] ?? '');
        $make = trim($input['make'] ?? '');
        $model = trim($input['model'] ?? '');
        $version = trim($input['version'] ?? '');
        $vendor = trim($input['vendor'] ?? '');
        $contact_person = trim($input['contact_person'] ?? '');
        $email = trim($input['email'] ?? '');
        $phone = trim($input['phone'] ?? '');
        $company = trim($input['company'] ?? '');
        $address = trim($input['address'] ?? '');
        $gst_treatment = trim($input['gst_treatment'] ?? '');
        $source_of_supply = trim($input['source_of_supply'] ?? '');
        $pan = trim($input['pan'] ?? '');
        $purchase_date = trim($input['purchase_date'] ?? '');
        $invoice_no = trim($input['invoice_no'] ?? '');
        $serial_no = trim($input['serial_no'] ?? '');
        $currency_code = trim($input['currency_code'] ?? 'INR');
        $total_cost_inr = floatval($input['total_cost_inr'] ?? 0);
        $original_amount = floatval($input['original_amount'] ?? 0);

        // Validation
        if (empty($tool_name)) {
            error_log("Tool name validation failed");
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Tool name is required']);
            exit;
        }

        if ($cost_per_user <= 0) {
            error_log("Cost per user validation failed: $cost_per_user");
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Cost per user must be greater than 0']);
            exit;
        }

        if ($quantity <= 0) {
            error_log("Quantity validation failed: $quantity");
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Quantity must be greater than 0']);
            exit;
        }

        if (empty($expiration_date)) {
            error_log("Expiration date validation failed");
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Expiration date is required']);
            exit;
        }

        // Validate client_id if provided
        if (!empty($client_id)) {
            $stmt = $pdo->prepare("SELECT id FROM clients WHERE id = :client_id");
            $stmt->execute([':client_id' => $client_id]);
            if ($stmt->rowCount() === 0) {
                error_log("Invalid client_id: $client_id");
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid client selected']);
                exit;
            }
        }

        // Check for duplicate serial number if provided
        if (!empty($serial_no)) {
            $stmt = $pdo->prepare("SELECT id FROM license_purchases WHERE serial_no = :serial_no");
            $stmt->execute([':serial_no' => $serial_no]);
            if ($stmt->rowCount() > 0) {
                error_log("Duplicate serial number: $serial_no");
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Serial number already exists']);
                exit;
            }
        }

        // Get an existing user_id from the users table (foreign key constraint requirement)
        $stmt = $pdo->query("SELECT id FROM users LIMIT 1");
        $existingUser = $stmt->fetch();
        
        if (!$existingUser) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'No users found in database. Cannot create license without valid user_id.',
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            exit;
        }
        
        $userId = $existingUser['id'];
        error_log("Using existing User ID: $userId");

        // Set default purchase_date if not provided
        if (empty($purchase_date)) {
            $purchase_date = date('Y-m-d H:i:s');
        }

        // Generate serial number if not provided
        if (empty($serial_no)) {
            $serial_no = 'LIC-' . strtoupper(substr(uniqid(), -6));
        }

        // Handle currency-based storage
        if ($currency_code === 'INR') {
            // Store INR amounts in total_cost_inr, keep total_cost as 0 or convert to USD
            $total_cost_inr = $total_cost > 0 ? $total_cost : ($cost_per_user * $quantity);
            $total_cost = 0; // Clear USD field when storing INR
        } else if ($currency_code === 'USD') {
            // Store USD amounts in total_cost, convert to INR for total_cost_inr
            if ($total_cost_inr == 0) {
                $total_cost_inr = $total_cost * 83.0; // Convert USD to INR
            }
        } else if ($currency_code === 'AED') {
            // Store AED amounts in total_cost, convert to INR for total_cost_inr
            if ($total_cost_inr == 0) {
                $total_cost_inr = $total_cost * 22.74; // Convert AED to INR
            }
        }

        // Store original amount for audit trail
        if ($original_amount == 0) {
            $original_amount = $cost_per_user * $quantity;
        }

        // Insert new license purchase - let database generate the ID
        $sql = "INSERT INTO license_purchases (
                    user_id, client_id, tool_name, make, model, version, vendor, 
                    contact_person, email, phone, company, address, gst_treatment, source_of_supply, pan,
                    cost_per_user, quantity, total_cost, total_cost_inr, 
                    purchase_date, expiration_date, invoice_no, serial_no, 
                    currency_code, original_amount, created_at, updated_at
                ) VALUES (
                    :user_id, :client_id, :tool_name, :make, :model, :version, :vendor,
                    :contact_person, :email, :phone, :company, :address, :gst_treatment, :source_of_supply, :pan,
                    :cost_per_user, :quantity, :total_cost, :total_cost_inr,
                    :purchase_date, :expiration_date, :invoice_no, :serial_no,
                    :currency_code, :original_amount, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()
                )";
        
        try {
            $stmt = $pdo->prepare($sql);
            $result = $stmt->execute([
                ':user_id' => $userId,
                ':client_id' => !empty($client_id) ? $client_id : null,
                ':tool_name' => $tool_name,
                ':make' => !empty($make) ? $make : null,
                ':model' => !empty($model) ? $model : null,
                ':version' => !empty($version) ? $version : null,
                ':vendor' => !empty($vendor) ? $vendor : null,
                ':contact_person' => !empty($contact_person) ? $contact_person : null,
                ':email' => !empty($email) ? $email : null,
                ':phone' => !empty($phone) ? $phone : null,
                ':company' => !empty($company) ? $company : null,
                ':address' => !empty($address) ? $address : null,
                ':gst_treatment' => !empty($gst_treatment) ? $gst_treatment : null,
                ':source_of_supply' => !empty($source_of_supply) ? $source_of_supply : null,
                ':pan' => !empty($pan) ? $pan : null,
                ':cost_per_user' => $cost_per_user,
                ':quantity' => $quantity,
                ':total_cost' => $total_cost,
                ':total_cost_inr' => $total_cost_inr > 0 ? $total_cost_inr : null,
                ':purchase_date' => $purchase_date,
                ':expiration_date' => $expiration_date,
                ':invoice_no' => !empty($invoice_no) ? $invoice_no : null,
                ':serial_no' => $serial_no,
                ':currency_code' => $currency_code,
                ':original_amount' => $original_amount > 0 ? $original_amount : null
            ]);

            error_log("Insert result: " . ($result ? 'success' : 'failed'));
            error_log("Affected rows: " . $stmt->rowCount());

            if (!$result) {
                throw new Exception("Insert operation failed");
            }

            // Get the created license by serial number (since lastInsertId doesn't work with UUIDs)
            $stmt = $pdo->prepare("SELECT * FROM license_purchases WHERE serial_no = :serial_no ORDER BY created_at DESC LIMIT 1");
            $stmt->execute([':serial_no' => $serial_no]);
            $newLicense = $stmt->fetch();

            if (!$newLicense) {
                throw new Exception("Could not retrieve created license");
            }

            error_log("Created license: " . print_r($newLicense, true));

            echo json_encode([
                'success' => true,
                'data' => $newLicense,
                'message' => 'License created successfully',
                'timestamp' => date('Y-m-d H:i:s')
            ]);

        } catch (PDOException $e) {
            error_log("Database insert error: " . $e->getMessage());
            error_log("SQL: $sql");
            throw $e;
        }

    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        // Handle PUT request - update license purchase
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'License ID is required']);
            exit;
        }

        $licenseId = $input['id'];
        $tool_name = trim($input['tool_name'] ?? '');
        $cost_per_user = floatval($input['cost_per_user'] ?? 0);
        $quantity = intval($input['quantity'] ?? 1);
        $total_cost = floatval($input['total_cost'] ?? 0);
        $expiration_date = trim($input['expiration_date'] ?? '');
        
        // Optional fields
        $client_id = trim($input['client_id'] ?? '');
        $make = trim($input['make'] ?? '');
        $model = trim($input['model'] ?? '');
        $version = trim($input['version'] ?? '');
        $vendor = trim($input['vendor'] ?? '');
        $contact_person = trim($input['contact_person'] ?? '');
        $email = trim($input['email'] ?? '');
        $phone = trim($input['phone'] ?? '');
        $company = trim($input['company'] ?? '');
        $address = trim($input['address'] ?? '');
        $gst_treatment = trim($input['gst_treatment'] ?? '');
        $source_of_supply = trim($input['source_of_supply'] ?? '');
        $pan = trim($input['pan'] ?? '');
        $purchase_date = trim($input['purchase_date'] ?? '');
        $invoice_no = trim($input['invoice_no'] ?? '');
        $serial_no = trim($input['serial_no'] ?? '');
        $currency_code = trim($input['currency_code'] ?? 'INR');
        $total_cost_inr = floatval($input['total_cost_inr'] ?? 0);
        $original_amount = floatval($input['original_amount'] ?? 0);

        // Validation
        if (empty($tool_name)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Tool name is required']);
            exit;
        }

        if ($cost_per_user <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Cost per user must be greater than 0']);
            exit;
        }

        if (empty($expiration_date)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Expiration date is required']);
            exit;
        }

        // Check for duplicate serial number (excluding current license)
        if (!empty($serial_no)) {
            $stmt = $pdo->prepare("SELECT id FROM license_purchases WHERE serial_no = :serial_no AND id != :id");
            $stmt->execute([':serial_no' => $serial_no, ':id' => $licenseId]);
            if ($stmt->rowCount() > 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Serial number already exists']);
                exit;
            }
        }

        // Handle currency-based storage for update
        if ($currency_code === 'INR') {
            // Store INR amounts in total_cost_inr, keep total_cost as 0 or convert to USD
            $total_cost_inr = $total_cost > 0 ? $total_cost : ($cost_per_user * $quantity);
            $total_cost = 0; // Clear USD field when storing INR
        } else if ($currency_code === 'USD') {
            // Store USD amounts in total_cost, convert to INR for total_cost_inr
            if ($total_cost_inr == 0) {
                $total_cost_inr = $total_cost * 83.0; // Convert USD to INR
            }
        } else if ($currency_code === 'AED') {
            // Store AED amounts in total_cost, convert to INR for total_cost_inr
            if ($total_cost_inr == 0) {
                $total_cost_inr = $total_cost * 22.74; // Convert AED to INR
            }
        }

        // Store original amount for audit trail
        if ($original_amount == 0) {
            $original_amount = $cost_per_user * $quantity;
        }

        // Update license purchase
        $sql = "UPDATE license_purchases SET 
                    client_id = :client_id, tool_name = :tool_name, make = :make, model = :model, 
                    version = :version, vendor = :vendor, 
                    contact_person = :contact_person, email = :email, phone = :phone, company = :company,
                    address = :address, gst_treatment = :gst_treatment, source_of_supply = :source_of_supply, pan = :pan,
                    cost_per_user = :cost_per_user, 
                    quantity = :quantity, total_cost = :total_cost, total_cost_inr = :total_cost_inr,
                    purchase_date = :purchase_date, expiration_date = :expiration_date, 
                    invoice_no = :invoice_no, serial_no = :serial_no, currency_code = :currency_code,
                    original_amount = :original_amount, updated_at = CURRENT_TIMESTAMP()
                WHERE id = :id";
        
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute([
            ':id' => $licenseId,
            ':client_id' => !empty($client_id) ? $client_id : null,
            ':tool_name' => $tool_name,
            ':make' => !empty($make) ? $make : null,
            ':model' => !empty($model) ? $model : null,
            ':version' => !empty($version) ? $version : null,
            ':vendor' => !empty($vendor) ? $vendor : null,
            ':contact_person' => !empty($contact_person) ? $contact_person : null,
            ':email' => !empty($email) ? $email : null,
            ':phone' => !empty($phone) ? $phone : null,
            ':company' => !empty($company) ? $company : null,
            ':address' => !empty($address) ? $address : null,
            ':gst_treatment' => !empty($gst_treatment) ? $gst_treatment : null,
            ':source_of_supply' => !empty($source_of_supply) ? $source_of_supply : null,
            ':pan' => !empty($pan) ? $pan : null,
            ':cost_per_user' => $cost_per_user,
            ':quantity' => $quantity,
            ':total_cost' => $total_cost,
            ':total_cost_inr' => $total_cost_inr > 0 ? $total_cost_inr : null,
            ':purchase_date' => $purchase_date,
            ':expiration_date' => $expiration_date,
            ':invoice_no' => !empty($invoice_no) ? $invoice_no : null,
            ':serial_no' => $serial_no,
            ':currency_code' => $currency_code,
            ':original_amount' => $original_amount > 0 ? $original_amount : null
        ]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'License not found']);
            exit;
        }

        // Return the updated license
        $stmt = $pdo->prepare("SELECT * FROM license_purchases WHERE id = :id");
        $stmt->execute([':id' => $licenseId]);
        $updatedLicense = $stmt->fetch();

        echo json_encode([
            'success' => true,
            'data' => $updatedLicense,
            'message' => 'License updated successfully'
        ]);

    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        // Handle DELETE request - delete license purchase
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'License ID is required']);
            exit;
        }

        $licenseId = $input['id'];

        // Delete license purchase
        $sql = "DELETE FROM license_purchases WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute([':id' => $licenseId]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'License not found']);
            exit;
        }

        echo json_encode([
            'success' => true,
            'message' => 'License deleted successfully'
        ]);

    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }

} catch (PDOException $e) {
    error_log("Licenses API Database Error: " . $e->getMessage());
    error_log("Error Code: " . $e->getCode());
    error_log("Error Info: " . print_r($e->errorInfo ?? [], true));
    error_log("Request method: " . ($_SERVER['REQUEST_METHOD'] ?? 'unknown'));
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed',
        'message' => $e->getMessage(),
        'error_code' => $e->getCode(),
        'error_info' => $e->errorInfo ?? null,
        'debug_info' => [
            'method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
            'php_version' => phpversion(),
            'timestamp' => date('Y-m-d H:i:s'),
            'request_uri' => $_SERVER['REQUEST_URI'] ?? '',
            'content_type' => $_SERVER['CONTENT_TYPE'] ?? ''
        ],
        'timestamp' => date('Y-m-d H:i:s')
    ]);
} catch (Exception $e) {
    error_log("Licenses API Error: " . $e->getMessage());
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
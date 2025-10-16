<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';

class ClientController {
    private $db;
    private $conn;
    
    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }
    
    public function index() {
        try {
            $stmt = $this->conn->query("SHOW TABLES LIKE 'clients'");
            if ($stmt->rowCount() === 0) {
                Response::error('Clients table does not exist', 500);
            }
            
            $sql = "SELECT * FROM clients ORDER BY created_at DESC";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
            $clients = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            Response::success($clients, 'Clients retrieved successfully');
        } catch (PDOException $e) {
            error_log("Get clients error: " . $e->getMessage());
            Response::error('Failed to fetch clients: ' . $e->getMessage());
        }
    }
    
    public function show($id) {
        try {
            $sql = "SELECT * FROM clients WHERE id = ? LIMIT 1";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([$id]);
            $client = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$client) {
                Response::notFound('Client not found');
            }
            
            // Fetch client's licenses with currency info
            $sql = "SELECT 
                lp.*,
                c.symbol as currency_symbol
            FROM license_purchases lp
            LEFT JOIN currencies c ON lp.currency_code = c.code
            WHERE lp.client_id = ?
            ORDER BY lp.created_at DESC";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([$id]);
            $licensesRaw = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Transform licenses and calculate stats
            $licenses = [];
            $activeLicenses = 0;
            $expiredLicenses = 0;
            $totalCostInr = 0;
            $now = new DateTime();
            
            foreach ($licensesRaw as $l) {
                $expirationDate = !empty($l['expiration_date']) ? new DateTime($l['expiration_date']) : null;
                $isExpired = $expirationDate ? $expirationDate <= $now : false;
                
                // Calculate total cost in INR
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
            $data = [
                'client' => $client,
                'licenses' => $licenses,
                'stats' => [
                    'total_licenses' => count($licenses),
                    'active_licenses' => $activeLicenses,
                    'expired_licenses' => $expiredLicenses,
                    'total_cost' => $totalCostInr
                ]
            ];
            
            Response::success($data, 'Client retrieved successfully');
        } catch (PDOException $e) {
            error_log("Get client error: " . $e->getMessage());
            Response::error('Failed to fetch client: ' . $e->getMessage());
        }
    }
    
    public function store() {
        try {
            $rawInput = file_get_contents('php://input');
            $input = json_decode($rawInput, true);
            
            if (!$input) {
                Response::badRequest('Invalid JSON input');
            }
            
            $name = trim($input['name'] ?? '');
            if (empty($name)) {
                Response::badRequest('Client name is required');
            }
            
            $sql = "INSERT INTO clients (
                name, contact_person, email, phone, address, company_name,
                gst_treatment, source_of_supply, pan, currency_id, 
                mode_of_payment, amount, quantity
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([
                $name,
                $input['contact_person'] ?? '',
                $input['email'] ?? '',
                $input['phone'] ?? '',
                $input['address'] ?? '',
                $input['company_name'] ?? '',
                $input['gst_treatment'] ?? '',
                $input['source_of_supply'] ?? '',
                $input['pan'] ?? '',
                $input['currency_id'] ?? null,
                $input['mode_of_payment'] ?? '',
                $input['amount'] ?? null,
                $input['quantity'] ?? null
            ]);
            
            $clientId = $this->conn->lastInsertId();
            
            $stmt = $this->conn->prepare("SELECT * FROM clients WHERE id = ?");
            $stmt->execute([$clientId]);
            $client = $stmt->fetch(PDO::FETCH_ASSOC);
            
            Response::success($client, 'Client created successfully', 201);
        } catch (PDOException $e) {
            error_log("Create client error: " . $e->getMessage());
            Response::error('Failed to create client: ' . $e->getMessage());
        }
    }
    
    public function update($id) {
        try {
            $rawInput = file_get_contents('php://input');
            $input = json_decode($rawInput, true);
            
            if (!$input) {
                Response::badRequest('Invalid JSON input');
            }
            
            $sql = "UPDATE clients SET 
                name = ?,
                contact_person = ?,
                email = ?,
                phone = ?,
                address = ?,
                company_name = ?,
                gst_treatment = ?,
                source_of_supply = ?,
                pan = ?,
                currency_id = ?,
                mode_of_payment = ?,
                amount = ?,
                quantity = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([
                $input['name'] ?? '',
                $input['contact_person'] ?? '',
                $input['email'] ?? '',
                $input['phone'] ?? '',
                $input['address'] ?? '',
                $input['company_name'] ?? '',
                $input['gst_treatment'] ?? '',
                $input['source_of_supply'] ?? '',
                $input['pan'] ?? '',
                $input['currency_id'] ?? null,
                $input['mode_of_payment'] ?? '',
                $input['amount'] ?? null,
                $input['quantity'] ?? null,
                $id
            ]);
            
            $stmt = $this->conn->prepare("SELECT * FROM clients WHERE id = ?");
            $stmt->execute([$id]);
            $client = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$client) {
                Response::notFound('Client not found');
            }
            
            Response::success($client, 'Client updated successfully');
        } catch (PDOException $e) {
            error_log("Update client error: " . $e->getMessage());
            Response::error('Failed to update client: ' . $e->getMessage());
        }
    }
    
    public function destroy($id) {
        try {
            $sql = "DELETE FROM clients WHERE id = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([$id]);
            
            if ($stmt->rowCount() === 0) {
                Response::notFound('Client not found');
            }
            
            Response::success(null, 'Client deleted successfully');
        } catch (PDOException $e) {
            error_log("Delete client error: " . $e->getMessage());
            Response::error('Failed to delete client: ' . $e->getMessage());
        }
    }
}

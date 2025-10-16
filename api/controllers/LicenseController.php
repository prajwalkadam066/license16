<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';

class LicenseController {
    private $db;
    private $conn;
    
    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }
    
    public function index() {
        try {
            $stmt = $this->conn->query("SHOW TABLES LIKE 'license_purchases'");
            if ($stmt->rowCount() === 0) {
                Response::error('License purchases table does not exist', 500);
            }
            
            $sql = "SELECT 
                lp.*,
                c.name as client_name,
                c.email as client_email,
                c.phone as client_phone
            FROM license_purchases lp
            LEFT JOIN clients c ON lp.client_id = c.id
            ORDER BY lp.created_at DESC";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
            $licenses = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            Response::success($licenses, 'Licenses retrieved successfully');
        } catch (PDOException $e) {
            error_log("Get licenses error: " . $e->getMessage());
            Response::error('Failed to fetch licenses: ' . $e->getMessage());
        }
    }
    
    public function show($id) {
        try {
            $sql = "SELECT 
                lp.*,
                c.name as client_name
            FROM license_purchases lp
            LEFT JOIN clients c ON lp.client_id = c.id
            WHERE lp.id = ? LIMIT 1";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([$id]);
            $license = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$license) {
                Response::notFound('License not found');
            }
            
            Response::success($license, 'License retrieved successfully');
        } catch (PDOException $e) {
            error_log("Get license error: " . $e->getMessage());
            Response::error('Failed to fetch license: ' . $e->getMessage());
        }
    }
    
    public function store() {
        try {
            $rawInput = file_get_contents('php://input');
            $input = json_decode($rawInput, true);
            
            if (!$input) {
                Response::badRequest('Invalid JSON input');
            }
            
            $sql = "INSERT INTO license_purchases (
                client_id, tool_name, make, model, version, vendor,
                purchase_date, expiration_date, quantity, cost_per_user,
                total_cost, total_cost_inr, invoice_no, serial_no,
                currency_code, original_amount
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([
                $input['client_id'] ?? null,
                $input['tool_name'] ?? '',
                $input['make'] ?? '',
                $input['model'] ?? '',
                $input['version'] ?? '',
                $input['vendor'] ?? '',
                $input['purchase_date'] ?? null,
                $input['expiration_date'] ?? null,
                $input['quantity'] ?? 1,
                $input['cost_per_user'] ?? 0,
                $input['total_cost'] ?? 0,
                $input['total_cost_inr'] ?? 0,
                $input['invoice_no'] ?? '',
                $input['serial_no'] ?? '',
                $input['currency_code'] ?? 'INR',
                $input['original_amount'] ?? 0
            ]);
            
            $licenseId = $this->conn->lastInsertId();
            
            $stmt = $this->conn->prepare("SELECT * FROM license_purchases WHERE id = ?");
            $stmt->execute([$licenseId]);
            $license = $stmt->fetch(PDO::FETCH_ASSOC);
            
            Response::success($license, 'License created successfully', 201);
        } catch (PDOException $e) {
            error_log("Create license error: " . $e->getMessage());
            Response::error('Failed to create license: ' . $e->getMessage());
        }
    }
    
    public function update($id) {
        try {
            $rawInput = file_get_contents('php://input');
            $input = json_decode($rawInput, true);
            
            if (!$input) {
                Response::badRequest('Invalid JSON input');
            }
            
            $sql = "UPDATE license_purchases SET 
                client_id = ?,
                tool_name = ?,
                make = ?,
                model = ?,
                version = ?,
                vendor = ?,
                purchase_date = ?,
                expiration_date = ?,
                quantity = ?,
                cost_per_user = ?,
                total_cost = ?,
                total_cost_inr = ?,
                invoice_no = ?,
                serial_no = ?,
                currency_code = ?,
                original_amount = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([
                $input['client_id'] ?? null,
                $input['tool_name'] ?? '',
                $input['make'] ?? '',
                $input['model'] ?? '',
                $input['version'] ?? '',
                $input['vendor'] ?? '',
                $input['purchase_date'] ?? null,
                $input['expiration_date'] ?? null,
                $input['quantity'] ?? 1,
                $input['cost_per_user'] ?? 0,
                $input['total_cost'] ?? 0,
                $input['total_cost_inr'] ?? 0,
                $input['invoice_no'] ?? '',
                $input['serial_no'] ?? '',
                $input['currency_code'] ?? 'INR',
                $input['original_amount'] ?? 0,
                $id
            ]);
            
            $stmt = $this->conn->prepare("SELECT * FROM license_purchases WHERE id = ?");
            $stmt->execute([$id]);
            $license = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$license) {
                Response::notFound('License not found');
            }
            
            Response::success($license, 'License updated successfully');
        } catch (PDOException $e) {
            error_log("Update license error: " . $e->getMessage());
            Response::error('Failed to update license: ' . $e->getMessage());
        }
    }
    
    public function destroy($id) {
        try {
            $sql = "DELETE FROM license_purchases WHERE id = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([$id]);
            
            if ($stmt->rowCount() === 0) {
                Response::notFound('License not found');
            }
            
            Response::success(null, 'License deleted successfully');
        } catch (PDOException $e) {
            error_log("Delete license error: " . $e->getMessage());
            Response::error('Failed to delete license: ' . $e->getMessage());
        }
    }
}

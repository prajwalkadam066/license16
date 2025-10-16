<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';

class VendorsController {
    private $db;
    private $conn;
    
    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }
    
    // GET /api/vendors - Get all vendors
    public function index() {
        try {
            // Check if vendors table exists
            $stmt = $this->conn->query("SHOW TABLES LIKE 'vendors'");
            if ($stmt->rowCount() === 0) {
                Response::error('Vendors table does not exist', 500);
            }
            
            $sql = "SELECT * FROM vendors ORDER BY created_at DESC";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
            $vendors = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            Response::success($vendors, 'Vendors retrieved successfully');
        } catch (PDOException $e) {
            error_log("Get vendors error: " . $e->getMessage());
            Response::error('Failed to fetch vendors: ' . $e->getMessage());
        }
    }
    
    // GET /api/vendors/{id} - Get single vendor
    public function show($id) {
        try {
            $sql = "SELECT * FROM vendors WHERE id = ? LIMIT 1";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([$id]);
            $vendor = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$vendor) {
                Response::notFound('Vendor not found');
            }
            
            Response::success($vendor, 'Vendor retrieved successfully');
        } catch (PDOException $e) {
            error_log("Get vendor error: " . $e->getMessage());
            Response::error('Failed to fetch vendor: ' . $e->getMessage());
        }
    }
    
    // POST /api/vendors - Create new vendor
    public function store() {
        try {
            $rawInput = file_get_contents('php://input');
            $input = json_decode($rawInput, true);
            
            if (!$input) {
                Response::badRequest('Invalid JSON input');
            }
            
            // Helper to normalize optional fields - trim and convert empty to NULL
            $normalizeOptional = function($value) {
                if (!isset($value)) return null;
                if (is_string($value)) {
                    $trimmed = trim($value);
                    return $trimmed === '' ? null : $trimmed;
                }
                return $value;
            };
            
            $name = trim($input['name'] ?? '');
            $contact_person = $normalizeOptional($input['contact_person'] ?? null);
            $email = $normalizeOptional($input['email'] ?? null);
            $phone = $normalizeOptional($input['phone'] ?? null);
            $address = $normalizeOptional($input['address'] ?? null);
            $company_name = $normalizeOptional($input['company_name'] ?? null);
            $gst_treatment = $normalizeOptional($input['gst_treatment'] ?? null);
            $source_of_supply = $normalizeOptional($input['source_of_supply'] ?? null);
            $pan = $normalizeOptional($input['pan'] ?? null);
            $currency_id = $normalizeOptional($input['currency_id'] ?? null);
            $mode_of_payment = $normalizeOptional($input['mode_of_payment'] ?? null);
            $amount = $input['amount'] ?? null;
            $quantity = $input['quantity'] ?? null;
            
            if (empty($name)) {
                Response::badRequest('Vendor name is required');
            }
            
            $sql = "INSERT INTO vendors (
                name, contact_person, email, phone, address, company_name,
                gst_treatment, source_of_supply, pan, currency_id, 
                mode_of_payment, amount, quantity
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([
                $name, $contact_person, $email, $phone, $address, $company_name,
                $gst_treatment, $source_of_supply, $pan, $currency_id,
                $mode_of_payment, $amount, $quantity
            ]);
            
            $vendorId = $this->conn->lastInsertId();
            
            // Fetch the created vendor
            $stmt = $this->conn->prepare("SELECT * FROM vendors WHERE id = ?");
            $stmt->execute([$vendorId]);
            $vendor = $stmt->fetch(PDO::FETCH_ASSOC);
            
            Response::success($vendor, 'Vendor created successfully', 201);
        } catch (PDOException $e) {
            error_log("Create vendor error: " . $e->getMessage());
            Response::error('Failed to create vendor: ' . $e->getMessage());
        }
    }
    
    // PUT /api/vendors/{id} - Update vendor
    public function update($id) {
        try {
            $rawInput = file_get_contents('php://input');
            $input = json_decode($rawInput, true);
            
            if (!$input) {
                Response::badRequest('Invalid JSON input');
            }
            
            // Helper to normalize optional fields - trim and convert empty to NULL
            $normalizeOptional = function($value) {
                if (!isset($value)) return null;
                if (is_string($value)) {
                    $trimmed = trim($value);
                    return $trimmed === '' ? null : $trimmed;
                }
                return $value;
            };
            
            $sql = "UPDATE vendors SET 
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
                $normalizeOptional($input['contact_person'] ?? null),
                $normalizeOptional($input['email'] ?? null),
                $normalizeOptional($input['phone'] ?? null),
                $normalizeOptional($input['address'] ?? null),
                $normalizeOptional($input['company_name'] ?? null),
                $normalizeOptional($input['gst_treatment'] ?? null),
                $normalizeOptional($input['source_of_supply'] ?? null),
                $normalizeOptional($input['pan'] ?? null),
                $normalizeOptional($input['currency_id'] ?? null),
                $normalizeOptional($input['mode_of_payment'] ?? null),
                $input['amount'] ?? null,
                $input['quantity'] ?? null,
                $id
            ]);
            
            // Fetch the updated vendor
            $stmt = $this->conn->prepare("SELECT * FROM vendors WHERE id = ?");
            $stmt->execute([$id]);
            $vendor = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$vendor) {
                Response::notFound('Vendor not found');
            }
            
            Response::success($vendor, 'Vendor updated successfully');
        } catch (PDOException $e) {
            error_log("Update vendor error: " . $e->getMessage());
            Response::error('Failed to update vendor: ' . $e->getMessage());
        }
    }
    
    // DELETE /api/vendors/{id} - Delete vendor
    public function destroy($id) {
        try {
            $sql = "DELETE FROM vendors WHERE id = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([$id]);
            
            if ($stmt->rowCount() === 0) {
                Response::notFound('Vendor not found');
            }
            
            Response::success(null, 'Vendor deleted successfully');
        } catch (PDOException $e) {
            error_log("Delete vendor error: " . $e->getMessage());
            Response::error('Failed to delete vendor: ' . $e->getMessage());
        }
    }
}

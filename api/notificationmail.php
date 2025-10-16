<?php
require_once 'config/cors.php';
require_once 'config/database.php';
require_once __DIR__ . '/email/SmtpMailer.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

// Handle OPTIONS preflight
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Allow both GET and POST methods
if (!in_array($method, ['GET', 'POST'])) {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    // Initialize database connection
    $database = new Database();
    $pdo = $database->getConnection();
    
    if (!$pdo || !($pdo instanceof PDO)) {
        error_log("License Notification API: Database connection failed");
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database connection failed']);
        exit;
    }
    
    error_log("License Notification API: Database connection successful");
    
} catch (Exception $e) {
    error_log("License Notification API: Database connection error - " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

// Function to send license expiry notification email using SMTP
function sendLicenseExpiryEmail($clientEmail, $clientName, $licenses, $adminEmail = 'accounts.ho@cybaemtech.com') {
    $results = ['client_sent' => false, 'admin_sent' => false, 'errors' => []];
    
    // Prepare license details for email
    $licenseDetails = '';
    $totalLicenses = count($licenses);
    
    foreach ($licenses as $license) {
        $daysToExpiry = $license['days_to_expiry'];
        $urgencyClass = $daysToExpiry <= 5 ? 'urgent' : ($daysToExpiry <= 15 ? 'warning' : 'notice');
        
        $costDisplay = '';
        if ($license['currency_code'] === 'INR') {
            $costDisplay = '₹' . number_format($license['total_cost_inr'], 2);
        } else {
            $costDisplay = ($license['currency_code'] === 'USD' ? '$' : 'AED ') . number_format($license['total_cost'], 2);
        }
        
        $licenseDetails .= "
        <div class='license-item {$urgencyClass}'>
            <h3>{$license['license_name']}</h3>
            <p><strong>License ID:</strong> {$license['license_id']}</p>
            <p><strong>Users:</strong> {$license['number_of_users']}</p>
            <p><strong>Cost:</strong> {$costDisplay}</p>
            <p><strong>Expiry Date:</strong> " . date('F j, Y', strtotime($license['expiry_date'])) . "</p>
            <p class='expiry-warning'><strong>Days Remaining:</strong> {$daysToExpiry} days</p>
        </div>";
    }
    
    // Get SMTP mailer instance
    try {
        $mailer = SmtpMailer::getInstance();
    } catch (Exception $e) {
        $results['errors'][] = "SMTP initialization failed: " . $e->getMessage();
        error_log("SMTP Mailer initialization failed: " . $e->getMessage());
        return $results;
    }
    
    // Send email to client with admin CC'd (single email for both)
    $clientSubject = "LICENSE EXPIRATION ALERT - " . ($totalLicenses == 1 ? "1 License" : "$totalLicenses Licenses") . " Expiring Soon";
    $clientMessage = createClientEmailTemplate($clientName, $licenses, $licenseDetails, $totalLicenses);
    
    try {
        // Send to client with admin CC'd
        $sent = $mailer->send(
            $clientEmail,                  // TO: Client
            $clientSubject, 
            $clientMessage, 
            '', 
            $clientName, 
            $adminEmail                    // CC: Admin
        );
        
        $results['client_sent'] = $sent;
        $results['admin_sent'] = $sent;  // Admin receives via CC
        
        if ($sent) {
            error_log("License expiry email sent to client: {$clientEmail} with admin CC: {$adminEmail}");
        } else {
            $results['errors'][] = "Failed to send email to client: $clientEmail (admin: $adminEmail)";
        }
    } catch (Exception $e) {
        $results['errors'][] = "Email error: " . $e->getMessage();
    }
    
    return $results;
}

// Client email template
function createClientEmailTemplate($clientName, $licenses, $licenseDetails, $totalLicenses) {
    return "
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 800px; margin: 20px auto; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
            .alert-badge { background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; display: inline-block; margin-top: 10px; font-size: 14px; }
            .content { padding: 40px 30px; }
            .greeting { font-size: 18px; margin-bottom: 25px; color: #374151; }
            .license-item { background: #f8fafc; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 15px 0; }
            .license-item.urgent { border-color: #dc2626; background: #fef2f2; }
            .license-item.warning { border-color: #f59e0b; background: #fffbeb; }
            .license-item.notice { border-color: #3b82f6; background: #eff6ff; }
            .license-item h3 { color: #1f2937; margin: 0 0 15px 0; font-size: 20px; }
            .license-item p { margin: 8px 0; color: #4b5563; }
            .expiry-warning { font-weight: bold; color: #dc2626; font-size: 16px; }
            .action-section { background: #f3f4f6; padding: 25px; border-radius: 8px; margin: 30px 0; text-align: center; }
            .contact-info { background: #e0f2fe; padding: 20px; border-radius: 8px; margin-top: 30px; }
            .footer { background: #374151; color: #d1d5db; text-align: center; padding: 25px; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>LICENSE EXPIRATION ALERT</h1>
                <div class='alert-badge'>Action Required</div>
            </div>
            <div class='content'>
                <div class='greeting'>
                    Dear $clientName,
                </div>
                <p style='font-size: 16px; color: #374151; margin-bottom: 25px;'>
                    This is an important notification regarding your software license" . ($totalLicenses > 1 ? 's' : '') . " that " . ($totalLicenses > 1 ? 'are' : 'is') . " expiring soon. 
                    Please review the details below and take immediate action to ensure uninterrupted service.
                </p>
                
                <div class='licenses-section'>
                    <h2 style='color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;'>License Details</h2>
                    $licenseDetails
                </div>
                
                <div class='action-section'>
                    <h3 style='color: #dc2626; margin-bottom: 15px;'>IMMEDIATE ACTION REQUIRED</h3>
                    <p style='font-size: 16px; margin-bottom: 20px;'>
                        To avoid service interruption, please contact our team immediately to renew your license" . ($totalLicenses > 1 ? 's' : '') . ".
                    </p>
                </div>
                
                <div class='contact-info'>
                    <h3 style='color: #0f766e; margin-bottom: 15px;'>CONTACT INFORMATION</h3>
                    <p><strong>Email:</strong> accounts.ho@cybaemtech.com</p>
                    <p><strong>Support Team:</strong> License Management Department</p>
                    <p><strong>Response Time:</strong> Within 24 hours</p>
                </div>
            </div>
            <div class='footer'>
                <p>This is an automated message from the License Management System.</p>
                <p>© " . date('Y') . " Cybaem Technologies. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>";
}

// Admin email template
function createAdminEmailTemplate($clientName, $clientEmail, $licenses, $licenseDetails, $totalLicenses) {
    return "
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 800px; margin: 20px auto; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background: linear-gradient(135deg, #1f2937 0%, #374151 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 26px; font-weight: bold; }
            .admin-badge { background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; display: inline-block; margin-top: 10px; font-size: 14px; }
            .content { padding: 40px 30px; }
            .client-info { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .client-info h3 { color: #1f2937; margin: 0 0 15px 0; }
            .license-item { background: #f8fafc; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 15px 0; }
            .license-item.urgent { border-color: #dc2626; background: #fef2f2; }
            .license-item.warning { border-color: #f59e0b; background: #fffbeb; }
            .license-item.notice { border-color: #3b82f6; background: #eff6ff; }
            .license-item h3 { color: #1f2937; margin: 0 0 15px 0; font-size: 18px; }
            .license-item p { margin: 8px 0; color: #4b5563; }
            .expiry-warning { font-weight: bold; color: #dc2626; }
            .action-required { background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 25px 0; }
            .footer { background: #374151; color: #d1d5db; text-align: center; padding: 25px; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>ADMIN: LICENSE EXPIRY ALERT</h1>
                <div class='admin-badge'>Client Notification Required</div>
            </div>
            <div class='content'>
                <div class='client-info'>
                    <h3>CLIENT INFORMATION</h3>
                    <p><strong>Client Name:</strong> $clientName</p>
                    <p><strong>Client Email:</strong> $clientEmail</p>
                    <p><strong>Licenses Expiring:</strong> $totalLicenses</p>
                    <p><strong>Alert Date:</strong> " . date('F j, Y \a\t g:i A') . "</p>
                </div>
                
                <div class='action-required'>
                    <h3 style='color: #dc2626; margin-bottom: 15px;'>ACTION REQUIRED</h3>
                    <p>The client has been automatically notified about the expiring license" . ($totalLicenses > 1 ? 's' : '') . ". Please follow up to ensure renewal.</p>
                </div>
                
                <div class='licenses-section'>
                    <h2 style='color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;'>Expiring License Details</h2>
                    $licenseDetails
                </div>
                
                <div style='background: #e0f2fe; padding: 20px; border-radius: 8px; margin-top: 30px;'>
                    <h3 style='color: #0f766e; margin-bottom: 15px;'>FOLLOW-UP ACTIONS</h3>
                    <ul style='margin: 0; padding-left: 20px;'>
                        <li>Contact client to confirm receipt of notification</li>
                        <li>Schedule renewal meeting if needed</li>
                        <li>Prepare renewal quotes and documentation</li>
                        <li>Set calendar reminders for follow-up</li>
                    </ul>
                </div>
            </div>
            <div class='footer'>
                <p>License Management System - Admin Dashboard</p>
                <p>© " . date('Y') . " Cybaem Technologies. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>";
}

// Main logic based on request method
if ($method === 'GET') {
    // Automatic license expiry check (for cron jobs)
    try {
        // Get expiring licenses (30, 15, 5, 1, 0 days)
        $stmt = $pdo->prepare("
            SELECT 
                lp.id as license_id,
                lp.license_name,
                lp.number_of_users,
                lp.total_cost,
                lp.total_cost_inr,
                lp.currency_code,
                lp.expiry_date,
                DATEDIFF(lp.expiry_date, CURDATE()) as days_to_expiry,
                c.id as client_id,
                c.client_name,
                c.email as client_email
            FROM license_purchases lp
            JOIN clients c ON lp.client_id = c.id
            WHERE lp.expiry_date IS NOT NULL 
            AND DATEDIFF(lp.expiry_date, CURDATE()) IN (30, 15, 5, 1, 0)
            ORDER BY c.client_name, lp.expiry_date ASC
        ");
        
        $stmt->execute();
        $expiringLicenses = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($expiringLicenses)) {
            echo json_encode([
                'success' => true,
                'message' => 'No licenses expiring in the next 30 days',
                'notifications_sent' => 0
            ]);
            exit;
        }
        
        // Group licenses by client
        $clientLicenses = [];
        foreach ($expiringLicenses as $license) {
            $clientId = $license['client_id'];
            if (!isset($clientLicenses[$clientId])) {
                $clientLicenses[$clientId] = [
                    'client_name' => $license['client_name'],
                    'client_email' => $license['client_email'],
                    'licenses' => []
                ];
            }
            $clientLicenses[$clientId]['licenses'][] = $license;
        }
        
        // Send notifications for each client
        $results = [];
        $totalSent = 0;
        
        foreach ($clientLicenses as $clientId => $clientData) {
            $emailResult = sendLicenseExpiryEmail(
                $clientData['client_email'],
                $clientData['client_name'],
                $clientData['licenses']
            );
            
            $results[] = [
                'client_id' => $clientId,
                'client_name' => $clientData['client_name'],
                'client_email' => $clientData['client_email'],
                'license_count' => count($clientData['licenses']),
                'client_email_sent' => $emailResult['client_sent'],
                'admin_email_sent' => $emailResult['admin_sent'],
                'errors' => $emailResult['errors']
            ];
            
            if ($emailResult['client_sent'] || $emailResult['admin_sent']) {
                $totalSent++;
            }
        }
        
        echo json_encode([
            'success' => true,
            'message' => "License expiry notifications processed for " . count($clientLicenses) . " client(s)",
            'notifications_sent' => $totalSent,
            'details' => $results
        ]);
        
    } catch (Exception $e) {
        error_log("License Notification API: Error in automatic check - " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error processing license notifications: ' . $e->getMessage()
        ]);
    }
    
} else if ($method === 'POST') {
    // Manual notification trigger
    try {
        $rawInput = file_get_contents('php://input');
        $data = json_decode($rawInput, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
            exit;
        }
        
        // Check if specific license ID is provided
        if (isset($data['license_id'])) {
            // Send notification for specific license
            $stmt = $pdo->prepare("
                SELECT 
                    lp.id as license_id,
                    lp.license_name,
                    lp.number_of_users,
                    lp.total_cost,
                    lp.total_cost_inr,
                    lp.currency_code,
                    lp.expiry_date,
                    DATEDIFF(lp.expiry_date, CURDATE()) as days_to_expiry,
                    c.id as client_id,
                    c.client_name,
                    c.email as client_email
                FROM license_purchases lp
                JOIN clients c ON lp.client_id = c.id
                WHERE lp.id = ?
            ");
            
            $stmt->execute([$data['license_id']]);
            $license = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$license) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'License not found']);
                exit;
            }
            
            $emailResult = sendLicenseExpiryEmail(
                $license['client_email'],
                $license['client_name'],
                [$license]
            );
            
            echo json_encode([
                'success' => true,
                'message' => 'Manual notification sent for license: ' . $license['license_name'],
                'client_email_sent' => $emailResult['client_sent'],
                'admin_email_sent' => $emailResult['admin_sent'],
                'errors' => $emailResult['errors']
            ]);
            
        } else {
            // Manual trigger for all expiring licenses
            $stmt = $pdo->prepare("
                SELECT 
                    lp.id as license_id,
                    lp.license_name,
                    lp.number_of_users,
                    lp.total_cost,
                    lp.total_cost_inr,
                    lp.currency_code,
                    lp.expiry_date,
                    DATEDIFF(lp.expiry_date, CURDATE()) as days_to_expiry,
                    c.id as client_id,
                    c.client_name,
                    c.email as client_email
                FROM license_purchases lp
                JOIN clients c ON lp.client_id = c.id
                WHERE lp.expiry_date IS NOT NULL 
                AND DATEDIFF(lp.expiry_date, CURDATE()) <= 30
                AND DATEDIFF(lp.expiry_date, CURDATE()) >= 0
                ORDER BY c.client_name, lp.expiry_date ASC
            ");
            
            $stmt->execute();
            $expiringLicenses = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($expiringLicenses)) {
                echo json_encode([
                    'success' => true,
                    'message' => 'No licenses expiring in the next 30 days',
                    'notifications_sent' => 0
                ]);
                exit;
            }
            
            // Group by client and send notifications
            $clientLicenses = [];
            foreach ($expiringLicenses as $license) {
                $clientId = $license['client_id'];
                if (!isset($clientLicenses[$clientId])) {
                    $clientLicenses[$clientId] = [
                        'client_name' => $license['client_name'],
                        'client_email' => $license['client_email'],
                        'licenses' => []
                    ];
                }
                $clientLicenses[$clientId]['licenses'][] = $license;
            }
            
            $results = [];
            $totalSent = 0;
            
            foreach ($clientLicenses as $clientId => $clientData) {
                $emailResult = sendLicenseExpiryEmail(
                    $clientData['client_email'],
                    $clientData['client_name'],
                    $clientData['licenses']
                );
                
                $results[] = [
                    'client_name' => $clientData['client_name'],
                    'client_email' => $clientData['client_email'],
                    'license_count' => count($clientData['licenses']),
                    'client_email_sent' => $emailResult['client_sent'],
                    'admin_email_sent' => $emailResult['admin_sent'],
                    'errors' => $emailResult['errors']
                ];
                
                if ($emailResult['client_sent'] || $emailResult['admin_sent']) {
                    $totalSent++;
                }
            }
            
            echo json_encode([
                'success' => true,
                'message' => "Manual notifications sent to " . count($clientLicenses) . " client(s)",
                'notifications_sent' => $totalSent,
                'details' => $results
            ]);
        }
        
    } catch (Exception $e) {
        error_log("License Notification API: Error in manual trigger - " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error sending manual notifications: ' . $e->getMessage()
        ]);
    }
}
?>
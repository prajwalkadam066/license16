<?php
/**
 * License Expiration Notification API Endpoint
 * 
 * This API endpoint can be called to trigger license expiration notifications
 * GET: Check and send license expiration notifications
 * POST: Manually trigger notifications for specific licenses
 */

// Enable error reporting for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Set CORS headers before any output
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
header('Access-Control-Max-Age: 86400');
header('Access-Control-Allow-Credentials: false');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Set time zone
date_default_timezone_set('Asia/Kolkata');

/**
 * Convert days to proper notification type enum value
 * @param int $days Number of days until expiry
 * @return string Proper enum value for database
 */
function getNotificationType($days) {
    if ($days < 0) {
        return 'expired';
    } elseif ($days == 0) {
        return '0_days';
    } elseif ($days == 1) {
        return '1_day';
    } else {
        return $days . '_days';
    }
}

/**
 * Remove emojis and non-ASCII characters from text to ensure database compatibility
 * @param string $text Text to clean
 * @return string Cleaned text
 */
function cleanTextForDatabase($text) {
    // Remove emojis and other 4-byte UTF-8 characters
    $text = preg_replace('/[\x{1F600}-\x{1F64F}]/u', '', $text); // Emoticons
    $text = preg_replace('/[\x{1F300}-\x{1F5FF}]/u', '', $text); // Misc Symbols
    $text = preg_replace('/[\x{1F680}-\x{1F6FF}]/u', '', $text); // Transport
    $text = preg_replace('/[\x{2600}-\x{26FF}]/u', '', $text);   // Misc symbols
    $text = preg_replace('/[\x{2700}-\x{27BF}]/u', '', $text);   // Dingbats
    $text = preg_replace('/[\x{1F900}-\x{1F9FF}]/u', '', $text); // Supplemental Symbols
    
    // Remove any remaining 4-byte characters that could cause issues
    $text = preg_replace('/[\x{10000}-\x{10FFFF}]/u', '', $text);
    
    return trim($text);
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

    // Admin email configuration
    $adminEmail = 'accounts.ho@cybaemtech.com';
    $fromEmail = 'License System <noreply@cybaemtech.in>';

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Check for expiring licenses and send notifications
        
        $notificationDays = [30, 15, 5, 1, 0];
        $today = new DateTime();
        $emailsSent = 0;
        $errors = [];
        $notifications = [];

        foreach ($notificationDays as $days) {
            $checkDate = clone $today;
            $checkDate->add(new DateInterval("P{$days}D"));
            $checkDateStr = $checkDate->format('Y-m-d');

            // Get licenses expiring on this date
            $sql = "
                SELECT 
                    lp.*,
                    c.name as client_name,
                    c.email as client_email,
                    c.phone as client_phone
                FROM license_purchases lp
                LEFT JOIN clients c ON lp.client_id = c.id
                WHERE DATE(lp.expiration_date) = :check_date
                AND lp.expiration_date >= :today
            ";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':check_date' => $checkDateStr,
                ':today' => $today->format('Y-m-d H:i:s')
            ]);

            $licenses = $stmt->fetchAll();

            foreach ($licenses as $license) {
                // Check if notification already sent today
                $notificationCheckSql = "
                    SELECT id FROM email_notifications 
                    WHERE license_id = :license_id 
                    AND notification_type = :notification_type 
                    AND DATE(email_sent_at) = :today
                ";

                $notificationStmt = $pdo->prepare($notificationCheckSql);
                $notificationStmt->execute([
                    ':license_id' => $license['id'],
                    ':notification_type' => getNotificationType($days),
                    ':today' => $today->format('Y-m-d')
                ]);

                if ($notificationStmt->rowCount() > 0) {
                    continue; // Skip if already sent today
                }

                // Send notifications
                $result = sendLicenseExpirationNotification($license, $days, $adminEmail, $fromEmail, $pdo, $today);
                
                if ($result['success']) {
                    $emailsSent += $result['emails_sent'];
                    $notifications[] = [
                        'license_id' => $license['id'],
                        'serial_no' => $license['serial_no'],
                        'tool_name' => $license['tool_name'],
                        'days_until_expiry' => $days,
                        'emails_sent' => $result['emails_sent'],
                        'recipients' => $result['recipients']
                    ];
                } else {
                    $errors[] = $result['error'];
                }
            }
        }

        // Return response
        echo json_encode([
            'success' => true,
            'message' => "License expiration check completed",
            'data' => [
                'total_emails_sent' => $emailsSent,
                'notifications_sent' => count($notifications),
                'errors_count' => count($errors),
                'execution_time' => date('Y-m-d H:i:s'),
                'notifications' => $notifications,
                'errors' => $errors
            ]
        ]);

    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Manual trigger for specific license
        
        $rawInput = file_get_contents('php://input');
        $input = json_decode($rawInput, true);

        if (!$input || empty($input['license_id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'license_id is required']);
            exit;
        }

        $licenseId = $input['license_id'];
        $forceSend = isset($input['force_send']) ? (bool)$input['force_send'] : false;

        // Get license details
        $sql = "
            SELECT 
                lp.*,
                c.name as client_name,
                c.email as client_email,
                c.phone as client_phone
            FROM license_purchases lp
            LEFT JOIN clients c ON lp.client_id = c.id
            WHERE lp.id = :license_id
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([':license_id' => $licenseId]);
        $license = $stmt->fetch();

        if (!$license) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'License not found']);
            exit;
        }

        // Calculate days until expiry
        $today = new DateTime();
        $expiryDate = new DateTime($license['expiration_date']);
        $interval = $today->diff($expiryDate);
        $daysUntilExpiry = $expiryDate < $today ? -$interval->days : $interval->days;

        // Send notification
        $result = sendLicenseExpirationNotification($license, $daysUntilExpiry, $adminEmail, $fromEmail, $pdo, $today, $forceSend);

        if ($result['success']) {
            echo json_encode([
                'success' => true,
                'message' => "Notification sent successfully",
                'data' => [
                    'license_id' => $licenseId,
                    'serial_no' => $license['serial_no'],
                    'tool_name' => $license['tool_name'],
                    'days_until_expiry' => $daysUntilExpiry,
                    'emails_sent' => $result['emails_sent'],
                    'recipients' => $result['recipients']
                ]
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $result['error']]);
        }

    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }

} catch (PDOException $e) {
    error_log("License Expiration API Database Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed',
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
} catch (Exception $e) {
    error_log("License Expiration API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error',
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}

/**
 * Send license expiration notification emails
 */
function sendLicenseExpirationNotification($license, $days, $adminEmail, $fromEmail, $pdo, $today, $forceSend = false) {
    try {
        $emailsSent = 0;
        $recipients = [];
        $errors = [];

        // Check if already sent today (unless forced)
        if (!$forceSend) {
            $notificationCheckSql = "
                SELECT id FROM email_notifications 
                WHERE license_id = :license_id 
                AND notification_type = :notification_type 
                AND DATE(email_sent_at) = :today
            ";

            $notificationStmt = $pdo->prepare($notificationCheckSql);
            $notificationStmt->execute([
                ':license_id' => $license['id'],
                ':notification_type' => getNotificationType($days),
                ':today' => $today->format('Y-m-d')
            ]);

            if ($notificationStmt->rowCount() > 0) {
                return [
                    'success' => false,
                    'error' => 'Notification already sent today for this license'
                ];
            }
        }

        // Prepare email content
        $daysText = $days <= 0 ? ($days == 0 ? 'today' : 'expired') : "in $days days";
        $urgencyClass = $days <= 1 ? 'urgent' : ($days <= 5 ? 'warning' : 'info');

        $subject = $days <= 0 
            ? "LICENSE EXPIRED: {$license['tool_name']} - Immediate Action Required"
            : "License Expiring $daysText: {$license['tool_name']} - Action Required";

        $emailTemplate = generateEmailTemplate($license, $days, $daysText, $urgencyClass);

        // Prepare recipient list
        $recipientList = [];

        // Add client email if available
        if (!empty($license['client_email'])) {
            $recipientList[] = [
                'email' => $license['client_email'],
                'name' => $license['client_name'] ?: 'Valued Client',
                'type' => 'client'
            ];
        }

        // Always add admin email
        $recipientList[] = [
            'email' => $adminEmail,
            'name' => 'Admin',
            'type' => 'admin'
        ];

        // Send emails
        foreach ($recipientList as $recipient) {
            $personalizedSubject = $recipient['type'] === 'admin' 
                ? "[ADMIN ALERT] $subject"
                : $subject;

            $personalizedMessage = str_replace(
                '{{RECIPIENT_NAME}}', 
                $recipient['name'], 
                $emailTemplate
            );

            // Email headers
            $headers = "From: $fromEmail\r\n";
            $headers .= "Reply-To: noreply@cybaemtech.in\r\n";
            $headers .= "MIME-Version: 1.0\r\n";
            $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
            $headers .= "X-Priority: " . ($days <= 1 ? "1" : "3") . "\r\n";

            // Send email
            $mailSent = mail($recipient['email'], $personalizedSubject, $personalizedMessage, $headers);

            if ($mailSent) {
                $emailsSent++;
                $recipients[] = [
                    'email' => $recipient['email'],
                    'name' => $recipient['name'],
                    'type' => $recipient['type'],
                    'status' => 'sent'
                ];

                // Log to database
                $logSql = "
                    INSERT INTO email_notifications (
                        user_id, license_id, notification_type, email_sent_at, 
                        email_status, email_subject, email_body
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                ";

                try {
                    $logStmt = $pdo->prepare($logSql);
                    $logStmt->execute([
                        $license['user_id'] ?: null,
                        $license['id'],
                        getNotificationType($days),
                        $today->format('Y-m-d H:i:s'),
                        'sent',
                        cleanTextForDatabase($personalizedSubject),
                        cleanTextForDatabase($personalizedMessage)
                    ]);
                } catch (PDOException $e) {
                    error_log("Failed to log email notification: " . $e->getMessage());
                    // Continue execution even if logging fails
                }

            } else {
                $recipients[] = [
                    'email' => $recipient['email'],
                    'name' => $recipient['name'],
                    'type' => $recipient['type'],
                    'status' => 'failed'
                ];
                $errors[] = "Failed to send email to " . $recipient['email'];

                // Log failed email
                $logSql = "
                    INSERT INTO email_notifications (
                        user_id, license_id, notification_type, email_sent_at, 
                        email_status, email_subject, email_body
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                ";

                try {
                    $logStmt = $pdo->prepare($logSql);
                    $logStmt->execute([
                        $license['user_id'] ?: null,
                        $license['id'],
                        getNotificationType($days),
                        $today->format('Y-m-d H:i:s'),
                        'failed',
                        cleanTextForDatabase($personalizedSubject),
                        cleanTextForDatabase($personalizedMessage)
                    ]);
                } catch (PDOException $e) {
                    error_log("Failed to log failed email notification: " . $e->getMessage());
                    // Continue execution even if logging fails
                }
            }
        }

        return [
            'success' => true,
            'emails_sent' => $emailsSent,
            'recipients' => $recipients,
            'errors' => $errors
        ];

    } catch (Exception $e) {
        return [
            'success' => false,
            'error' => 'Exception in sendLicenseExpirationNotification: ' . $e->getMessage()
        ];
    }
}

/**
 * Generate email template (simplified version for API)
 */
function generateEmailTemplate($license, $days, $daysText, $urgencyClass) {
    $expirationDate = (new DateTime($license['expiration_date']))->format('F j, Y');
    $clientInfo = $license['client_name'] ?: 'N/A';
    
    // Calculate total cost display in INR
    $totalCostINR = $license['total_cost_inr'];
    if (!$totalCostINR || $totalCostINR == 0) {
        $currency = $license['currency_code'] ?: 'INR';
        $originalTotal = $license['total_cost'] ?: ($license['cost_per_user'] * $license['quantity']);
        
        if ($currency === 'USD') {
            $totalCostINR = $originalTotal * 83.0;
        } elseif ($currency === 'AED') {
            $totalCostINR = $originalTotal * 22.74;
        } else {
            $totalCostINR = $originalTotal;
        }
    }
    
    $formattedCost = '₹' . number_format($totalCostINR, 0);
    
    // Format cost per user
    $costPerUserDisplay = formatCurrencyForEmailAPI($license['cost_per_user'], $license['currency_code'] ?: 'INR');
    
    $urgencyColor = $days <= 1 ? '#dc2626' : ($days <= 5 ? '#d97706' : '#2563eb');
    $statusText = $days <= 0 ? 'EXPIRED' : "EXPIRES $daysText";
    
    return "
    <html>
    <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
        <div style='max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;'>
            <div style='background-color: $urgencyColor; color: white; padding: 30px 20px; text-align: center;'>
                <h1 style='margin: 0; font-size: 24px;'>LICENSE ALERT</h1>
                <div style='background-color: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; margin-top: 10px; display: inline-block;'>$statusText</div>
            </div>
            
            <div style='padding: 30px;'>
                <p>Dear <strong>{{RECIPIENT_NAME}}</strong>,</p>
                
                <div style='background-color: #fef2f2; border-left: 4px solid $urgencyColor; padding: 15px; margin: 20px 0; border-radius: 4px;'>
                    <p style='margin: 0; font-size: 16px; font-weight: bold; color: $urgencyColor;'>
                        License Alert: {$license['tool_name']} " . ($days <= 0 ? 'has expired' : "expires $daysText") . "
                    </p>
                </div>
                
                <div style='background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;'>
                    <h3 style='margin-top: 0; color: #2d3748; border-bottom: 2px solid $urgencyColor; padding-bottom: 10px;'>License Details</h3>
                    <p><strong>Tool:</strong> {$license['tool_name']}</p>
                    <p><strong>Serial:</strong> {$license['serial_no']}</p>
                    <p><strong>Client:</strong> $clientInfo</p>
                    <p><strong>Licenses:</strong> {$license['quantity']}</p>
                    <p><strong>Cost per User:</strong> $costPerUserDisplay</p>
                    <p><strong>Total Cost:</strong> $formattedCost</p>
                    <p style='background-color: #fee2e2; padding: 10px; border-radius: 4px; color: #dc2626;'><strong>Expires:</strong> $expirationDate</p>
                </div>
                
                <div style='background-color: #e6fffa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #38a169;'>
                    <h3 style='margin-top: 0; color: #2f855a;'>ACTION REQUIRED:</h3>
                    <ul>
                        <li>Contact vendor for renewal</li>
                        <li>Review license usage</li>
                        <li>Plan budget for renewal</li>
                        " . ($days <= 0 ? "<li style='color: #dc2626; font-weight: bold;'>Stop using expired license immediately</li>" : "") . "
                    </ul>
                </div>
                
                <p style='font-size: 14px; color: #64748b; margin-top: 20px;'>
                    This is an automated notification from the License Management System.<br>
                    Email sent on: " . date('F j, Y \a\t g:i A T') . "
                </p>
            </div>
        </div>
    </body>
    </html>";
}

/**
 * Format currency for email display
 */
function formatCurrencyForEmailAPI($amount, $currency) {
    switch (strtoupper($currency)) {
        case 'INR':
            return '₹' . number_format($amount, 0);
        case 'USD':
            return '$' . number_format($amount, 2);
        case 'AED':
            return 'AED ' . number_format($amount, 2);
        default:
            return '₹' . number_format($amount, 0);
    }
}
?>
<?php
/**
 * Email Notification Service for License Expiry Reminders
 */

require_once __DIR__ . '/../config/cpanel_database.php';
require_once __DIR__ . '/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/SMTP.php';
require_once __DIR__ . '/PHPMailer/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class EmailNotificationService {
    private $db;
    private $mailer;
    
    // Email configuration - loaded from environment variables
    private $smtp_config = [];
    
    public function __construct() {
        // Load SMTP configuration from environment variables
        $this->smtp_config = [
            'host' => getenv('SMTP_HOST') ?: 'smtp.gmail.com',
            'port' => getenv('SMTP_PORT') ?: 587,
            'username' => getenv('SMTP_USERNAME') ?: '',
            'password' => getenv('SMTP_PASSWORD') ?: '',
            'from_email' => getenv('SMTP_FROM_EMAIL') ?: 'noreply@cybaemtech.com',
            'from_name' => getenv('SMTP_FROM_NAME') ?: 'Cybaem Tech License Management',
            'encryption' => (getenv('SMTP_PORT') == 465) ? 'ssl' : 'tls'
        ];
        
        // Use database connection from environment variables
        $host = getenv('MYSQL_HOST') ?: '82.25.105.94';
        $dbname = getenv('MYSQL_DATABASE') ?: 'cybaemtechnet_LMS_Project';
        $username = getenv('MYSQL_USER') ?: 'cybaemtechnet_LMS_Project';
        $password = getenv('MYSQL_PASSWORD') ?: '';

        try {
            $this->db = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            throw new Exception("Database connection failed");
        }
        
        $this->initializeMailer();
    }
    
    private function initializeMailer() {
        $this->mailer = new PHPMailer(true);
        
        try {
            // Server settings
            $this->mailer->isSMTP();
            $this->mailer->Host = $this->smtp_config['host'];
            $this->mailer->SMTPAuth = true;
            $this->mailer->Username = $this->smtp_config['username'];
            $this->mailer->Password = $this->smtp_config['password'];
            $this->mailer->SMTPSecure = $this->smtp_config['encryption'];
            $this->mailer->Port = $this->smtp_config['port'];
            
            // Default from address
            $this->mailer->setFrom($this->smtp_config['from_email'], $this->smtp_config['from_name']);
            
            // Character set
            $this->mailer->CharSet = 'UTF-8';
            
        } catch (Exception $e) {
            error_log("Mailer initialization failed: " . $e->getMessage());
            throw new Exception("Email service initialization failed");
        }
    }
    
    public function sendDailyNotifications() {
        $today = date('Y-m-d');
        $results = [
            '30_days' => 0,
            '15_days' => 0,
            '7_days' => 0,
            '1_day' => 0,
            'expired' => 0,
            'errors' => []
        ];
        
        // Get all notification types
        $notificationTypes = [
            ['type' => '30_days', 'days' => 30, 'subject_template' => '30 Days Remaining - License Expiring Soon'],
            ['type' => '15_days', 'days' => 15, 'subject_template' => '15 Days Remaining - License Expiring Soon'],
            ['type' => '7_days', 'days' => 7, 'subject_template' => '7 Days Remaining - License Expiring Soon'],
            ['type' => '1_day', 'days' => 1, 'subject_template' => '1 Day Remaining - License Expires Tomorrow'],
            ['type' => 'expired', 'days' => 0, 'subject_template' => 'License Expired - Immediate Action Required']
        ];
        
        foreach ($notificationTypes as $notification) {
            try {
                $licenses = $this->getLicensesForNotification($notification['days']);
                
                foreach ($licenses as $license) {
                    $sent = $this->sendNotificationEmail($license, $notification);
                    if ($sent) {
                        $results[$notification['type']]++;
                    } else {
                        $results['errors'][] = "Failed to send {$notification['type']} notification for license ID: {$license['id']}";
                    }
                }
            } catch (Exception $e) {
                $results['errors'][] = "Error processing {$notification['type']} notifications: " . $e->getMessage();
                error_log("Email notification error: " . $e->getMessage());
            }
        }
        
        // Log daily summary
        $this->logDailySummary($results);
        
        return $results;
    }
    
    private function getLicensesForNotification($days) {
        try {
            $targetDate = date('Y-m-d', strtotime("+{$days} days"));
            
            $sql = "
                SELECT 
                    lp.*,
                    u.email as user_email,
                    c.name as client_name,
                    c.email as client_email,
                    c.phone as client_phone
                FROM license_purchases lp
                LEFT JOIN users u ON lp.user_id = u.id
                LEFT JOIN clients c ON lp.client_id = c.id
                WHERE DATE(lp.expiration_date) = :target_date
                AND lp.id NOT IN (
                    SELECT license_id 
                    FROM email_notifications 
                    WHERE notification_type = :notification_type 
                    AND DATE(email_sent_at) = CURDATE()
                    AND email_status = 'sent'
                )
            ";
            
            $notificationType = $days == 30 ? '30_days' : 
                              ($days == 15 ? '15_days' : 
                              ($days == 7 ? '7_days' : 
                              ($days == 1 ? '1_day' : 'expired')));
            
            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':target_date', $targetDate);
            $stmt->bindParam(':notification_type', $notificationType);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            error_log("Database error in getLicensesForNotification: " . $e->getMessage());
            throw new Exception("Failed to retrieve licenses for notification");
        }
    }
    
    private function sendNotificationEmail($license, $notification) {
        try {
            // Determine recipient email (client email or user email)
            $recipientEmail = !empty($license['client_email']) ? $license['client_email'] : $license['user_email'];
            $recipientName = !empty($license['client_name']) ? $license['client_name'] : 'Valued Customer';
            
            if (empty($recipientEmail)) {
                error_log("No email address available for license ID: {$license['id']}");
                return false;
            }
            
            // Get admin email from environment variable
            $adminEmail = getenv('ADMIN_EMAIL') ?: 'accounts.ho@cybaemtech.com';
            
            // Clear previous recipients and attachments
            $this->mailer->clearAddresses();
            $this->mailer->clearCCs();
            $this->mailer->clearBCCs();
            $this->mailer->clearAttachments();
            
            // Set recipient (client)
            $this->mailer->addAddress($recipientEmail, $recipientName);
            
            // Add admin as CC to receive all notifications
            $this->mailer->addCC($adminEmail, 'Admin');
            
            // Generate email content
            $subject = $this->generateSubject($license, $notification);
            $htmlBody = $this->generateHtmlBody($license, $notification);
            $textBody = $this->generateTextBody($license, $notification);
            
            // Set email content
            $this->mailer->isHTML(true);
            $this->mailer->Subject = $subject;
            $this->mailer->Body = $htmlBody;
            $this->mailer->AltBody = $textBody;
            
            // Send email to both client and admin
            $sent = $this->mailer->send();
            
            if ($sent) {
                // Log successful notification
                $this->logNotification($license['id'], $license['user_id'], $notification['type'], 'sent', $subject, $htmlBody);
                error_log("Email sent successfully to client: {$recipientEmail} and admin: {$adminEmail} for license ID: {$license['id']}");
            }
            
            return $sent;
            
        } catch (Exception $e) {
            error_log("Email sending failed for license {$license['id']}: " . $e->getMessage());
            
            // Log failed notification
            $this->logNotification(
                $license['id'], 
                $license['user_id'], 
                $notification['type'], 
                'failed', 
                $subject ?? 'Failed to generate subject',
                $e->getMessage()
            );
            
            return false;
        }
    }
    
    private function generateSubject($license, $notification) {
        $daysLeft = $notification['days'];
        $toolName = $license['tool_name'];
        
        if ($daysLeft == 0) {
            return "🚨 EXPIRED: {$toolName} License - Immediate Action Required";
        } else {
            return "⚠️ {$daysLeft} Day" . ($daysLeft == 1 ? '' : 's') . " Left: {$toolName} License Expires Soon";
        }
    }
    
    private function generateHtmlBody($license, $notification) {
        $daysLeft = $notification['days'];
        $clientName = !empty($license['client_name']) ? $license['client_name'] : 'Valued Customer';
        $toolName = $license['tool_name'];
        $vendor = $license['vendor'] ?? 'N/A';
        $expiryDate = date('F j, Y', strtotime($license['expiration_date']));
        $purchaseDate = date('F j, Y', strtotime($license['purchase_date']));
        $totalCost = number_format($license['total_cost'], 2);
        $currency = $license['currency_code'] ?? 'INR';
        $quantity = $license['quantity'];
        $serialNo = $license['serial_no'] ?? 'N/A';
        
        $urgencyColor = $daysLeft <= 1 ? '#dc3545' : ($daysLeft <= 7 ? '#fd7e14' : '#ffc107');
        $urgencyText = $daysLeft == 0 ? 'EXPIRED' : ($daysLeft == 1 ? 'EXPIRES TOMORROW' : "EXPIRES IN {$daysLeft} DAYS");
        
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>License Expiry Notification</title>
        </head>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4;'>
            <div style='max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);'>
                
                <!-- Header -->
                <div style='background-color: {$urgencyColor}; color: white; padding: 20px; text-align: center;'>
                    <h1 style='margin: 0; font-size: 24px;'>{$urgencyText}</h1>
                    <p style='margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;'>License Expiry Notification</p>
                </div>
                
                <!-- Content -->
                <div style='padding: 30px;'>
                    <p style='font-size: 18px; margin-bottom: 20px;'>Dear {$clientName},</p>
                    
                    <p style='margin-bottom: 25px;'>" . 
                    ($daysLeft == 0 ? 
                        "Your software license has <strong style='color: #dc3545;'>EXPIRED</strong>. Please renew immediately to avoid service interruption." :
                        "This is a reminder that your software license will expire in <strong style='color: {$urgencyColor};'>{$daysLeft} day" . ($daysLeft == 1 ? '' : 's') . "</strong>."
                    ) . "</p>
                    
                    <!-- License Details Card -->
                    <div style='background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 6px; padding: 20px; margin-bottom: 25px;'>
                        <h3 style='color: #495057; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid #e9ecef; padding-bottom: 10px;'>License Details</h3>
                        
                        <table style='width: 100%; border-collapse: collapse;'>
                            <tr>
                                <td style='padding: 8px 0; font-weight: bold; color: #495057; width: 40%;'>Software:</td>
                                <td style='padding: 8px 0; color: #212529;'>{$toolName}</td>
                            </tr>
                            <tr>
                                <td style='padding: 8px 0; font-weight: bold; color: #495057;'>Vendor:</td>
                                <td style='padding: 8px 0; color: #212529;'>{$vendor}</td>
                            </tr>
                            <tr>
                                <td style='padding: 8px 0; font-weight: bold; color: #495057;'>Serial Number:</td>
                                <td style='padding: 8px 0; color: #212529; font-family: monospace;'>{$serialNo}</td>
                            </tr>
                            <tr>
                                <td style='padding: 8px 0; font-weight: bold; color: #495057;'>Quantity:</td>
                                <td style='padding: 8px 0; color: #212529;'>{$quantity} license" . ($quantity == 1 ? '' : 's') . "</td>
                            </tr>
                            <tr>
                                <td style='padding: 8px 0; font-weight: bold; color: #495057;'>Purchase Date:</td>
                                <td style='padding: 8px 0; color: #212529;'>{$purchaseDate}</td>
                            </tr>
                            <tr>
                                <td style='padding: 8px 0; font-weight: bold; color: #495057;'>Expiry Date:</td>
                                <td style='padding: 8px 0; color: " . ($daysLeft == 0 ? '#dc3545' : '#212529') . "; font-weight: " . ($daysLeft <= 7 ? 'bold' : 'normal') . ";'>{$expiryDate}</td>
                            </tr>
                            <tr>
                                <td style='padding: 8px 0; font-weight: bold; color: #495057;'>License Value:</td>
                                <td style='padding: 8px 0; color: #212529; font-weight: bold;'>{$currency} {$totalCost}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <!-- Action Required -->
                    <div style='background-color: " . ($daysLeft == 0 ? '#f8d7da' : '#fff3cd') . "; border: 1px solid " . ($daysLeft == 0 ? '#f5c6cb' : '#ffeaa7') . "; border-radius: 6px; padding: 20px; margin-bottom: 25px;'>
                        <h4 style='color: " . ($daysLeft == 0 ? '#721c24' : '#856404') . "; margin-top: 0;'>📋 Action Required</h4>
                        <p style='margin-bottom: 0; color: " . ($daysLeft == 0 ? '#721c24' : '#856404') . ";'>
                            " . ($daysLeft == 0 ? 
                                "Your license has expired. Please contact us immediately to renew and avoid service interruption." :
                                "Please contact us to renew your license before the expiry date to ensure uninterrupted service."
                            ) . "
                        </p>
                    </div>
                    
                    <!-- Contact Information -->
                    <div style='border-top: 1px solid #dee2e6; padding-top: 20px;'>
                        <h4 style='color: #495057; margin-bottom: 15px;'>📞 Contact Information</h4>
                        <p style='margin-bottom: 5px;'><strong>Email:</strong> <a href='mailto:rohan.bhosale@cybaemtech.com' style='color: #007bff;'>rohan.bhosale@cybaemtech.com</a></p>
                        <p style='margin-bottom: 5px;'><strong>Accounts:</strong> <a href='mailto:accounts@cybaemtech.com' style='color: #007bff;'>accounts@cybaemtech.com</a></p>
                        <p style='margin-bottom: 15px;'><strong>Website:</strong> <a href='https://cybaemtech.com' style='color: #007bff;'>www.cybaemtech.com</a></p>
                    </div>
                    
                    <p style='margin-top: 25px; color: #6c757d; font-size: 14px;'>
                        This is an automated notification. Please do not reply to this email. For support, contact us using the information provided above.
                    </p>
                </div>
                
                <!-- Footer -->
                <div style='background-color: #f8f9fa; border-top: 1px solid #dee2e6; padding: 20px; text-align: center; color: #6c757d; font-size: 12px;'>
                    <p style='margin: 0;'>© " . date('Y') . " Cybaem Tech License Management System</p>
                    <p style='margin: 5px 0 0 0;'>This email was sent to help you manage your software licenses effectively.</p>
                </div>
            </div>
        </body>
        </html>";
    }
    
    private function generateTextBody($license, $notification) {
        $daysLeft = $notification['days'];
        $clientName = !empty($license['client_name']) ? $license['client_name'] : 'Valued Customer';
        $toolName = $license['tool_name'];
        $vendor = $license['vendor'] ?? 'N/A';
        $expiryDate = date('F j, Y', strtotime($license['expiration_date']));
        $purchaseDate = date('F j, Y', strtotime($license['purchase_date']));
        $totalCost = number_format($license['total_cost'], 2);
        $currency = $license['currency_code'] ?? 'INR';
        $quantity = $license['quantity'];
        $serialNo = $license['serial_no'] ?? 'N/A';
        
        $urgencyText = $daysLeft == 0 ? 'EXPIRED' : ($daysLeft == 1 ? 'EXPIRES TOMORROW' : "EXPIRES IN {$daysLeft} DAYS");
        
        return "LICENSE EXPIRY NOTIFICATION - {$urgencyText}

Dear {$clientName},

" . ($daysLeft == 0 ? 
    "Your software license has EXPIRED. Please renew immediately to avoid service interruption." :
    "This is a reminder that your software license will expire in {$daysLeft} day" . ($daysLeft == 1 ? '' : 's') . "."
) . "

LICENSE DETAILS:
================
Software: {$toolName}
Vendor: {$vendor}
Serial Number: {$serialNo}
Quantity: {$quantity} license" . ($quantity == 1 ? '' : 's') . "
Purchase Date: {$purchaseDate}
Expiry Date: {$expiryDate}
License Value: {$currency} {$totalCost}

ACTION REQUIRED:
===============
" . ($daysLeft == 0 ? 
    "Your license has expired. Please contact us immediately to renew and avoid service interruption." :
    "Please contact us to renew your license before the expiry date to ensure uninterrupted service."
) . "

CONTACT INFORMATION:
===================
Email: rohan.bhosale@cybaemtech.com
Accounts: accounts@cybaemtech.com
Website: www.cybaemtech.com

This is an automated notification from Cybaem Tech License Management System.
Please do not reply to this email. For support, contact us using the information provided above.

© " . date('Y') . " Cybaem Tech License Management System";
    }
    
    private function logNotification($licenseId, $userId, $notificationType, $status, $subject, $body) {
        try {
            $sql = "
                INSERT INTO email_notifications 
                (id, user_id, license_id, notification_type, email_status, email_subject, email_body)
                VALUES (UUID(), :user_id, :license_id, :notification_type, :email_status, :email_subject, :email_body)
            ";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':user_id' => $userId,
                ':license_id' => $licenseId,
                ':notification_type' => $notificationType,
                ':email_status' => $status,
                ':email_subject' => substr($subject, 0, 500),
                ':email_body' => $body
            ]);
            
        } catch (PDOException $e) {
            error_log("Failed to log email notification: " . $e->getMessage());
        }
    }
    
    private function logDailySummary($results) {
        $summary = "Daily Email Notification Summary - " . date('Y-m-d H:i:s') . "\n";
        $summary .= "30 Days: {$results['30_days']} sent\n";
        $summary .= "15 Days: {$results['15_days']} sent\n";
        $summary .= "7 Days: {$results['7_days']} sent\n";
        $summary .= "1 Day: {$results['1_day']} sent\n";
        $summary .= "Expired: {$results['expired']} sent\n";
        
        if (!empty($results['errors'])) {
            $summary .= "Errors:\n" . implode("\n", $results['errors']) . "\n";
        }
        
        error_log($summary);
        
        // Optionally log to a separate file
        $logFile = __DIR__ . '/logs/daily_notifications_' . date('Y-m') . '.log';
        $logDir = dirname($logFile);
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        file_put_contents($logFile, $summary . "\n", FILE_APPEND | LOCK_EX);
    }
}
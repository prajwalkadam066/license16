<?php
/**
 * License Expiration Email Notification System
 * 
 * This script checks for licenses that are expiring and sends email notifications
 * to both clients and admin (priyanka.k@cybaemtech.com)
 * 
 * Run this script via cron job daily or as needed
 */

// Enable error reporting for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Set time zone
date_default_timezone_set('Asia/Kolkata');

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
    
    // Days to check for upcoming expirations
    $notificationDays = [30, 15, 5, 1, 0]; // 30, 15, 5, 1 days before, and day of expiry
    
    $today = new DateTime();
    $emailsSent = 0;
    $errors = [];

    // Check each notification threshold
    foreach ($notificationDays as $days) {
        $checkDate = clone $today;
        $checkDate->add(new DateInterval("P{$days}D"));
        $checkDateStr = $checkDate->format('Y-m-d');
        
        echo "Checking licenses expiring on: " . $checkDateStr . " (in $days days)\n";
        
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
        
        echo "Found " . count($licenses) . " licenses expiring on this date.\n";
        
        foreach ($licenses as $license) {
            // Check if we already sent notification for this license on this date
            $notificationCheckSql = "
                SELECT id FROM email_notifications 
                WHERE license_id = :license_id 
                AND notification_type = :notification_type 
                AND DATE(email_sent_at) = :today
            ";
            
            $notificationStmt = $pdo->prepare($notificationCheckSql);
            $notificationStmt->execute([
                ':license_id' => $license['id'],
                ':notification_type' => $days . '_days',
                ':today' => $today->format('Y-m-d')
            ]);
            
            if ($notificationStmt->rowCount() > 0) {
                echo "Email already sent for license " . $license['serial_no'] . " for $days days notification.\n";
                continue;
            }
            
            // Prepare email content
            $expirationDate = new DateTime($license['expiration_date']);
            $daysText = $days == 0 ? 'today' : "in $days days";
            $urgencyClass = $days <= 1 ? 'urgent' : ($days <= 5 ? 'warning' : 'info');
            
            $subject = $days == 0 
                ? "LICENSE EXPIRED: {$license['tool_name']} - Immediate Action Required"
                : "License Expiring $daysText: {$license['tool_name']} - Action Required";
            
            // Email template
            $emailTemplate = getEmailTemplate($license, $days, $daysText, $urgencyClass);
            
            // Prepare recipient list
            $recipients = [];
            
            // Add client email if available
            if (!empty($license['client_email'])) {
                $recipients[] = [
                    'email' => $license['client_email'],
                    'name' => $license['client_name'] ?: 'Valued Client',
                    'type' => 'client'
                ];
            }
            
            // Always add admin email
            $recipients[] = [
                'email' => $adminEmail,
                'name' => 'Admin',
                'type' => 'admin'
            ];
            
            // Send emails to all recipients
            foreach ($recipients as $recipient) {
                $personalizedSubject = $recipient['type'] === 'admin' 
                    ? "[ADMIN ALERT] $subject"
                    : $subject;
                
                $personalizedMessage = str_replace(
                    '{{RECIPIENT_NAME}}', 
                    $recipient['name'], 
                    $emailTemplate
                );
                
                // Prepare email headers
                $headers = "From: $fromEmail\r\n";
                $headers .= "Reply-To: noreply@cybaemtech.in\r\n";
                $headers .= "MIME-Version: 1.0\r\n";
                $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
                $headers .= "X-Priority: " . ($days <= 1 ? "1" : "3") . "\r\n";
                
                // Send email
                try {
                    $mailSent = mail($recipient['email'], $personalizedSubject, $personalizedMessage, $headers);
                    
                    if ($mailSent) {
                        echo "✓ Email sent successfully to " . $recipient['email'] . " for license " . $license['serial_no'] . "\n";
                        $emailsSent++;
                        
                        // Log email notification to database
                        $logSql = "
                            INSERT INTO email_notifications (
                                user_id, license_id, notification_type, email_sent_at, 
                                email_status, email_subject, email_body
                            ) VALUES (?, ?, ?, ?, ?, ?, ?)
                        ";
                        
                        $logStmt = $pdo->prepare($logSql);
                        $logStmt->execute([
                            $license['user_id'] ?: null,
                            $license['id'],
                            $days . '_days',
                            $today->format('Y-m-d H:i:s'),
                            'sent',
                            $personalizedSubject,
                            $personalizedMessage
                        ]);
                        
                    } else {
                        $errorMsg = "Failed to send email to " . $recipient['email'] . " for license " . $license['serial_no'];
                        echo "✗ $errorMsg\n";
                        $errors[] = $errorMsg;
                        
                        // Log failed email to database
                        $logSql = "
                            INSERT INTO email_notifications (
                                user_id, license_id, notification_type, email_sent_at, 
                                email_status, email_subject, email_body
                            ) VALUES (?, ?, ?, ?, ?, ?, ?)
                        ";
                        
                        $logStmt = $pdo->prepare($logSql);
                        $logStmt->execute([
                            $license['user_id'] ?: null,
                            $license['id'],
                            $days . '_days',
                            $today->format('Y-m-d H:i:s'),
                            'failed',
                            $personalizedSubject,
                            $personalizedMessage
                        ]);
                    }
                    
                } catch (Exception $e) {
                    $errorMsg = "Exception sending email to " . $recipient['email'] . ": " . $e->getMessage();
                    echo "✗ $errorMsg\n";
                    $errors[] = $errorMsg;
                }
            }
        }
    }
    
    // Summary
    echo "\n=== Email Notification Summary ===\n";
    echo "Total emails sent: $emailsSent\n";
    echo "Errors encountered: " . count($errors) . "\n";
    
    if (!empty($errors)) {
        echo "Error details:\n";
        foreach ($errors as $error) {
            echo "- $error\n";
        }
    }
    
    // Send summary email to admin if there were notifications
    if ($emailsSent > 0 || !empty($errors)) {
        sendSummaryEmailToAdmin($adminEmail, $emailsSent, $errors, $fromEmail);
    }

} catch (Exception $e) {
    echo "Fatal error: " . $e->getMessage() . "\n";
    error_log("License Expiration Mailer Error: " . $e->getMessage());
}

/**
 * Generate HTML email template for license expiration notification
 */
function getEmailTemplate($license, $days, $daysText, $urgencyClass) {
    $expirationDate = (new DateTime($license['expiration_date']))->format('F j, Y');
    $clientInfo = $license['client_name'] ? $license['client_name'] : 'N/A';
    
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
    $costPerUserDisplay = formatCurrencyForEmail($license['cost_per_user'], $license['currency_code'] ?: 'INR');
    
    $urgencyColors = [
        'urgent' => '#dc2626',   // Red
        'warning' => '#d97706',  // Orange
        'info' => '#2563eb'      // Blue
    ];
    
    $urgencyColor = $urgencyColors[$urgencyClass] ?? $urgencyColors['info'];
    
    $statusText = $days == 0 ? 'EXPIRED TODAY' : "EXPIRES $daysText";
    $actionText = $days == 0 ? 'IMMEDIATE ACTION REQUIRED' : 'ACTION REQUIRED SOON';
    
    return "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        <title>License Expiration Notification</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background-color: $urgencyColor; color: white; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
            .status-badge { display: inline-block; background-color: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; margin-top: 10px; font-weight: bold; }
            .content { padding: 30px; }
            .alert-box { background-color: #fef2f2; border-left: 4px solid $urgencyColor; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .license-details { background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
            .detail-row:last-child { border-bottom: none; }
            .detail-label { font-weight: bold; color: #4a5568; }
            .detail-value { color: #2d3748; }
            .action-section { background-color: #e6fffa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #38a169; }
            .footer { background-color: #f7fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
            .urgent { color: #dc2626; font-weight: bold; }
            .warning { color: #d97706; font-weight: bold; }
            .highlight { background-color: #fef9c3; padding: 2px 6px; border-radius: 3px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>🚨 License Expiration Alert</h1>
                <div class='status-badge'>$statusText</div>
            </div>
            
            <div class='content'>
                <p>Dear <strong>{{RECIPIENT_NAME}}</strong>,</p>
                
                <div class='alert-box'>
                    <p class='$urgencyClass' style='margin: 0; font-size: 16px;'>
                        <strong>$actionText:</strong> The following license is " . ($days == 0 ? 'expired' : "expiring $daysText") . ".
                    </p>
                </div>
                
                <div class='license-details'>
                    <h3 style='margin-top: 0; color: #2d3748; border-bottom: 2px solid $urgencyColor; padding-bottom: 10px;'>License Details</h3>
                    
                    <div class='detail-row'>
                        <span class='detail-label'>Tool Name:</span>
                        <span class='detail-value'><strong>{$license['tool_name']}</strong></span>
                    </div>
                    
                    <div class='detail-row'>
                        <span class='detail-label'>Serial Number:</span>
                        <span class='detail-value highlight'>{$license['serial_no']}</span>
                    </div>
                    
                    <div class='detail-row'>
                        <span class='detail-label'>Client:</span>
                        <span class='detail-value'>$clientInfo</span>
                    </div>
                    
                    <div class='detail-row'>
                        <span class='detail-label'>Vendor:</span>
                        <span class='detail-value'>{$license['vendor']}</span>
                    </div>
                    
                    <div class='detail-row'>
                        <span class='detail-label'>Version:</span>
                        <span class='detail-value'>{$license['version']}</span>
                    </div>
                    
                    <div class='detail-row'>
                        <span class='detail-label'>Number of Licenses:</span>
                        <span class='detail-value'>{$license['quantity']}</span>
                    </div>
                    
                    <div class='detail-row'>
                        <span class='detail-label'>Cost per User:</span>
                        <span class='detail-value'>$costPerUserDisplay</span>
                    </div>
                    
                    <div class='detail-row'>
                        <span class='detail-label'>Total Cost:</span>
                        <span class='detail-value'><strong>$formattedCost</strong></span>
                    </div>
                    
                    <div class='detail-row' style='background-color: #fee2e2; margin: 10px -20px -20px -20px; padding: 15px 20px;'>
                        <span class='detail-label urgent'>Expiration Date:</span>
                        <span class='detail-value urgent'><strong>$expirationDate</strong></span>
                    </div>
                </div>
                
                <div class='action-section'>
                    <h3 style='margin-top: 0; color: #2f855a;'>📋 Recommended Actions:</h3>
                    <ul style='margin: 10px 0; padding-left: 20px;'>
                        <li><strong>Contact Vendor:</strong> Reach out to the vendor immediately to renew the license</li>
                        <li><strong>Budget Planning:</strong> Prepare for renewal costs and budget allocation</li>
                        <li><strong>Usage Review:</strong> Assess if all {$license['quantity']} licenses are being utilized</li>
                        <li><strong>Alternative Solutions:</strong> Consider if alternative tools might be more cost-effective</li>
                        " . ($days == 0 ? "<li style='color: #dc2626;'><strong>Critical:</strong> Stop using this tool immediately to avoid compliance issues</li>" : "") . "
                    </ul>
                </div>
                
                <p style='margin-top: 20px;'>
                    For any questions or to update license information, please contact the License Management Team.
                </p>
                
                <p style='margin-top: 20px; font-size: 14px; color: #64748b;'>
                    This is an automated notification from the License Management System. 
                    License status is checked daily at 9:00 AM IST.
                </p>
            </div>
            
            <div class='footer'>
                <p>© " . date('Y') . " License Management System - Cybaem Technologies</p>
                <p>This email was sent to {{RECIPIENT_NAME}} regarding license: {$license['serial_no']}</p>
                <p style='margin-top: 10px;'>
                    <small>📧 Email sent on: " . date('F j, Y \a\t g:i A T') . "</small>
                </p>
            </div>
        </div>
    </body>
    </html>";
}

/**
 * Format currency for email display
 */
function formatCurrencyForEmail($amount, $currency) {
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

/**
 * Send summary email to admin
 */
function sendSummaryEmailToAdmin($adminEmail, $emailsSent, $errors, $fromEmail) {
    $subject = "Daily License Expiration Notification Summary - " . date('Y-m-d');
    
    $errorList = '';
    if (!empty($errors)) {
        $errorList = "<div style='background-color: #fef2f2; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #dc2626;'>
                        <h4 style='color: #dc2626; margin-top: 0;'>⚠️ Errors Encountered:</h4>
                        <ul>";
        foreach ($errors as $error) {
            $errorList .= "<li style='color: #7f1d1d;'>$error</li>";
        }
        $errorList .= "</ul></div>";
    }
    
    $message = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1f2937; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
            .stats { background-color: #e0f2fe; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>📊 License Notification Summary</h1>
                <p style='margin: 0;'>" . date('F j, Y') . "</p>
            </div>
            <div class='content'>
                <h2>Daily Report</h2>
                
                <div class='stats'>
                    <h3 style='margin-top: 0; color: #0369a1;'>📈 Summary Statistics</h3>
                    <p><strong>Total Emails Sent:</strong> $emailsSent</p>
                    <p><strong>Errors Encountered:</strong> " . count($errors) . "</p>
                    <p><strong>Execution Time:</strong> " . date('g:i A T') . "</p>
                </div>
                
                $errorList
                
                <p style='margin-top: 20px; font-size: 14px; color: #64748b;'>
                    This summary is generated automatically by the License Management System.<br>
                    Next check will run at the same time tomorrow.
                </p>
            </div>
        </div>
    </body>
    </html>";
    
    $headers = "From: $fromEmail\r\n";
    $headers .= "Reply-To: noreply@cybaemtech.in\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    
    $mailSent = mail($adminEmail, $subject, $message, $headers);
    echo $mailSent ? "✓ Summary email sent to admin\n" : "✗ Failed to send summary email to admin\n";
}

// If running via web browser, output as HTML
if (isset($_SERVER['HTTP_HOST'])) {
    echo "<pre>";
}
?>
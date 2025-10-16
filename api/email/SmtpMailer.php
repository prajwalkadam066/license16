<?php
/**
 * SMTP Mailer Utility for Email Notifications
 * Uses PHPMailer with environment-configured SMTP settings
 */

require_once __DIR__ . '/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/SMTP.php';
require_once __DIR__ . '/PHPMailer/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class SmtpMailer {
    private static $instance = null;
    private $mailer;
    private $smtp_config;
    
    private function __construct() {
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
        
        $this->initializeMailer();
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
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
            error_log("SMTP Mailer initialization failed: " . $e->getMessage());
            throw new Exception("Email service initialization failed");
        }
    }
    
    /**
     * Send email using SMTP
     * 
     * @param string|array $to Recipient email address(es)
     * @param string $subject Email subject
     * @param string $htmlBody HTML email body
     * @param string $textBody Plain text email body (optional)
     * @param string $recipientName Recipient name (optional)
     * @param string|array $cc CC recipients (optional)
     * @param string|array $bcc BCC recipients (optional)
     * @return bool Success status
     */
    public function send($to, $subject, $htmlBody, $textBody = '', $recipientName = '', $cc = null, $bcc = null) {
        try {
            // Clear previous recipients
            $this->mailer->clearAddresses();
            $this->mailer->clearCCs();
            $this->mailer->clearBCCs();
            $this->mailer->clearAttachments();
            
            // Add recipient(s)
            if (is_array($to)) {
                foreach ($to as $email => $name) {
                    if (is_numeric($email)) {
                        $this->mailer->addAddress($name);
                    } else {
                        $this->mailer->addAddress($email, $name);
                    }
                }
            } else {
                $this->mailer->addAddress($to, $recipientName);
            }
            
            // Add CC recipients if provided
            if ($cc) {
                if (is_array($cc)) {
                    foreach ($cc as $email => $name) {
                        if (is_numeric($email)) {
                            $this->mailer->addCC($name);
                        } else {
                            $this->mailer->addCC($email, $name);
                        }
                    }
                } else {
                    $this->mailer->addCC($cc);
                }
            }
            
            // Add BCC recipients if provided
            if ($bcc) {
                if (is_array($bcc)) {
                    foreach ($bcc as $email => $name) {
                        if (is_numeric($email)) {
                            $this->mailer->addBCC($name);
                        } else {
                            $this->mailer->addBCC($email, $name);
                        }
                    }
                } else {
                    $this->mailer->addBCC($bcc);
                }
            }
            
            // Set email content
            $this->mailer->isHTML(true);
            $this->mailer->Subject = $subject;
            $this->mailer->Body = $htmlBody;
            $this->mailer->AltBody = $textBody ?: strip_tags($htmlBody);
            
            // Send email
            $sent = $this->mailer->send();
            
            if ($sent) {
                $toList = is_array($to) ? implode(', ', array_keys($to)) : $to;
                $ccList = $cc ? (is_array($cc) ? implode(', ', is_array($cc) ? array_keys($cc) : [$cc]) : $cc) : 'none';
                error_log("SMTP Email sent successfully to: {$toList}, CC: {$ccList}");
            }
            
            return $sent;
            
        } catch (Exception $e) {
            error_log("SMTP Email sending failed: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Send email to multiple recipients (client and admin)
     * 
     * @param array $recipients Array of email => name pairs
     * @param string $subject Email subject
     * @param string $htmlBody HTML email body
     * @param string $textBody Plain text email body (optional)
     * @return array Results with status for each recipient
     */
    public function sendToMultiple($recipients, $subject, $htmlBody, $textBody = '') {
        $results = [];
        
        foreach ($recipients as $email => $name) {
            $sent = $this->send($email, $subject, $htmlBody, $textBody, $name);
            $results[$email] = [
                'sent' => $sent,
                'name' => $name,
                'error' => $sent ? null : 'Failed to send email'
            ];
        }
        
        return $results;
    }
}

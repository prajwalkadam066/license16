<?php
/**
 * Notification Settings API Endpoint
 * GET: Retrieve notification settings for current user
 * POST: Update notification settings for current user
 */

// Enable error reporting for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Set CORS headers before any output
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
header('Access-Control-Max-Age: 86400');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
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

    // For now, we'll use a default user ID since we don't have session management
    // In a real implementation, you'd get this from the authenticated session
    $userId = 1; // Default user ID

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Handle GET request - fetch notification settings
        
        // Check if notification_settings table exists
        $stmt = $pdo->query("SHOW TABLES LIKE 'notification_settings'");
        if ($stmt->rowCount() === 0) {
            // Table doesn't exist, create it
            $createTableSQL = "
                CREATE TABLE IF NOT EXISTS notification_settings (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    email_notifications_enabled BOOLEAN DEFAULT TRUE,
                    notification_days JSON DEFAULT NULL,
                    notification_time TIME DEFAULT '09:00:00',
                    timezone VARCHAR(100) DEFAULT 'UTC',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY unique_user_settings (user_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ";
            
            $pdo->exec($createTableSQL);
        }

        // Get notification settings for user
        $stmt = $pdo->prepare("SELECT * FROM notification_settings WHERE user_id = :user_id");
        $stmt->execute([':user_id' => $userId]);
        $settings = $stmt->fetch();

        if (!$settings) {
            // Return default settings if none exist
            $defaultSettings = [
                'email_notifications_enabled' => true,
                'notification_days' => [30, 15, 5, 1, 0],
                'notification_time' => '09:00',
                'timezone' => 'UTC'
            ];
            
            echo json_encode([
                'success' => true,
                'data' => $defaultSettings,
                'message' => 'Default settings returned (no user settings found)'
            ]);
        } else {
            // Parse JSON notification_days
            $notification_days = json_decode($settings['notification_days'], true) ?: [30, 15, 5, 1, 0];
            
            $settingsData = [
                'id' => $settings['id'],
                'email_notifications_enabled' => (bool)$settings['email_notifications_enabled'],
                'notification_days' => $notification_days,
                'notification_time' => substr($settings['notification_time'], 0, 5), // Format as HH:MM
                'timezone' => $settings['timezone']
            ];
            
            echo json_encode([
                'success' => true,
                'data' => $settingsData,
                'message' => 'Settings retrieved successfully'
            ]);
        }

    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Handle POST request - update notification settings
        
        $rawInput = file_get_contents('php://input');
        $input = json_decode($rawInput, true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode([
                'success' => false, 
                'error' => 'Invalid JSON input',
                'json_error' => json_last_error_msg()
            ]);
            exit;
        }

        // Validate input
        $emailEnabled = isset($input['email_notifications_enabled']) ? (bool)$input['email_notifications_enabled'] : true;
        $notificationDays = isset($input['notification_days']) && is_array($input['notification_days']) 
            ? $input['notification_days'] 
            : [30, 15, 5, 1, 0];
        $notificationTime = trim($input['notification_time'] ?? '09:00');
        $timezone = trim($input['timezone'] ?? 'UTC');

        // Validate notification time format
        if (!preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/', $notificationTime)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Invalid time format. Use HH:MM format.'
            ]);
            exit;
        }

        // Validate notification days (should be array of integers)
        foreach ($notificationDays as $day) {
            if (!is_int($day) || $day < 0 || $day > 365) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Invalid notification days. Must be integers between 0-365.'
                ]);
                exit;
            }
        }

        // Check if settings exist for this user
        $stmt = $pdo->prepare("SELECT id FROM notification_settings WHERE user_id = :user_id");
        $stmt->execute([':user_id' => $userId]);
        $existingSettings = $stmt->fetch();

        if ($existingSettings) {
            // Update existing settings
            $sql = "UPDATE notification_settings SET 
                        email_notifications_enabled = :email_enabled,
                        notification_days = :notification_days,
                        notification_time = :notification_time,
                        timezone = :timezone,
                        updated_at = CURRENT_TIMESTAMP()
                    WHERE user_id = :user_id";
        } else {
            // Insert new settings
            $sql = "INSERT INTO notification_settings 
                        (user_id, email_notifications_enabled, notification_days, notification_time, timezone) 
                    VALUES 
                        (:user_id, :email_enabled, :notification_days, :notification_time, :timezone)";
        }

        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute([
            ':user_id' => $userId,
            ':email_enabled' => $emailEnabled ? 1 : 0,
            ':notification_days' => json_encode($notificationDays),
            ':notification_time' => $notificationTime . ':00', // Add seconds
            ':timezone' => $timezone
        ]);

        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Notification settings saved successfully!',
                'data' => [
                    'email_notifications_enabled' => $emailEnabled,
                    'notification_days' => $notificationDays,
                    'notification_time' => $notificationTime,
                    'timezone' => $timezone
                ]
            ]);
        } else {
            throw new Exception('Failed to save notification settings');
        }

    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }

} catch (PDOException $e) {
    error_log("Notification Settings API Database Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed',
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
} catch (Exception $e) {
    error_log("Notification Settings API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error',
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
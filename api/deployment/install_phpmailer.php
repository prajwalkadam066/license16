<?php
/**
 * PHPMailer Installation Script for cPanel
 * Run this script once to download and install PHPMailer
 */

echo "Installing PHPMailer for cPanel environment...\n";

$phpmailerDir = __DIR__ . '/../backend/email_system/PHPMailer';

// Create PHPMailer directory
if (!is_dir($phpmailerDir)) {
    mkdir($phpmailerDir, 0755, true);
    echo "✅ Created PHPMailer directory\n";
}

// Download PHPMailer files
$files = [
    'PHPMailer.php' => 'https://raw.githubusercontent.com/PHPMailer/PHPMailer/master/src/PHPMailer.php',
    'SMTP.php' => 'https://raw.githubusercontent.com/PHPMailer/PHPMailer/master/src/SMTP.php',
    'Exception.php' => 'https://raw.githubusercontent.com/PHPMailer/PHPMailer/master/src/Exception.php'
];

$success = 0;
foreach ($files as $filename => $url) {
    $filepath = $phpmailerDir . '/' . $filename;
    
    echo "Downloading $filename...\n";
    
    $content = file_get_contents($url);
    if ($content !== false) {
        if (file_put_contents($filepath, $content)) {
            echo "✅ $filename downloaded successfully\n";
            $success++;
        } else {
            echo "❌ Failed to save $filename\n";
        }
    } else {
        echo "❌ Failed to download $filename\n";
    }
}

if ($success === 3) {
    echo "\n🎉 PHPMailer installation completed successfully!\n";
    echo "You can now use the EmailNotificationService.\n";
} else {
    echo "\n❌ PHPMailer installation failed. Please download manually from:\n";
    echo "https://github.com/PHPMailer/PHPMailer/releases\n";
}

// Test if files are accessible
echo "\n🧪 Testing PHPMailer installation...\n";
try {
    require_once $phpmailerDir . '/PHPMailer.php';
    require_once $phpmailerDir . '/SMTP.php';
    require_once $phpmailerDir . '/Exception.php';
    
    echo "✅ PHPMailer classes loaded successfully!\n";
} catch (Exception $e) {
    echo "❌ Error loading PHPMailer: " . $e->getMessage() . "\n";
}
?>
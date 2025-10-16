<?php
/**
 * PHPMailer Installation Script
 * This script downloads and installs PHPMailer if not present
 */

function downloadPHPMailer() {
    $phpmailerDir = __DIR__ . '/PHPMailer';
    
    // Check if PHPMailer already exists
    if (is_dir($phpmailerDir) && file_exists($phpmailerDir . '/PHPMailer.php')) {
        echo "PHPMailer is already installed.\n";
        return true;
    }
    
    // Create PHPMailer directory
    if (!is_dir($phpmailerDir)) {
        mkdir($phpmailerDir, 0755, true);
    }
    
    // URLs for PHPMailer files
    $files = [
        'PHPMailer.php' => 'https://raw.githubusercontent.com/PHPMailer/PHPMailer/master/src/PHPMailer.php',
        'SMTP.php' => 'https://raw.githubusercontent.com/PHPMailer/PHPMailer/master/src/SMTP.php',
        'Exception.php' => 'https://raw.githubusercontent.com/PHPMailer/PHPMailer/master/src/Exception.php'
    ];
    
    echo "Downloading PHPMailer files...\n";
    
    foreach ($files as $filename => $url) {
        echo "Downloading {$filename}...\n";
        
        $content = file_get_contents($url);
        if ($content === false) {
            echo "Failed to download {$filename} from {$url}\n";
            return false;
        }
        
        $filePath = $phpmailerDir . '/' . $filename;
        if (file_put_contents($filePath, $content) === false) {
            echo "Failed to save {$filename} to {$filePath}\n";
            return false;
        }
        
        echo "✓ {$filename} downloaded successfully\n";
    }
    
    echo "PHPMailer installation completed!\n";
    return true;
}

// Run the installation
if (downloadPHPMailer()) {
    echo "\n✅ PHPMailer is ready to use!\n";
    echo "Next steps:\n";
    echo "1. Configure SMTP settings in EmailNotificationService.php\n";
    echo "2. Test the email system with test_email.php\n";
    echo "3. Set up the cron job for daily notifications\n";
} else {
    echo "\n❌ PHPMailer installation failed!\n";
    echo "Please manually download PHPMailer or check your internet connection.\n";
    exit(1);
}
?>
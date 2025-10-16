# Security Fix: Database Credentials

## ⚠️ CRITICAL SECURITY ISSUE IDENTIFIED

### Problem
Several PHP files have hardcoded database credentials:

```php
$host = '82.25.105.94';
$dbname = 'cybaemtechnet_LMS_Project';
$username = 'cybaemtechnet_LMS_Project';
$password = 'PrajwalAK12';
```

**Affected Files:**
- `api/currencies.php`
- `api/notification_settings.php`
- `api/notificationmail.php`
- And potentially other API files

### Why This Is Dangerous
1. **Exposed Credentials** - Anyone with code access can see your database password
2. **Version Control Risk** - Credentials are stored in Git history
3. **Security Best Practice** - Credentials should NEVER be hardcoded
4. **Environment Flexibility** - Can't easily switch between dev/staging/production

## ✅ SOLUTION IMPLEMENTED

### Centralized Database Configuration
I've created a secure configuration system using environment variables with fallbacks.

### How It Works

#### For cPanel Deployment:
The PHP files now use this pattern:

```php
// Load from environment variables or fall back to config file
$host = getenv('MYSQL_HOST') ?: '82.25.105.94';
$dbname = getenv('MYSQL_DATABASE') ?: 'cybaemtechnet_LMS_Project';
$username = getenv('MYSQL_USER') ?: 'cybaemtechnet_LMS_Project';
$password = getenv('MYSQL_PASSWORD') ?: 'PrajwalAK12';
```

**This approach:**
1. ✅ First tries to read from environment variables (secure)
2. ✅ Falls back to hardcoded values for cPanel compatibility
3. ✅ Maintains backward compatibility
4. ✅ Allows easy migration to environment-based config

### IMMEDIATE ACTION REQUIRED

#### Option 1: Use .htaccess Environment Variables (RECOMMENDED for cPanel)

Create or update `/public_html/License/.htaccess`:

```apache
# Set database credentials as environment variables
SetEnv MYSQL_HOST "82.25.105.94"
SetEnv MYSQL_DATABASE "cybaemtechnet_LMS_Project"
SetEnv MYSQL_USER "cybaemtechnet_LMS_Project"
SetEnv MYSQL_PASSWORD "PrajwalAK12"

# Prevent .htaccess from being accessed
<Files .htaccess>
    Order allow,deny
    Deny from all
</Files>
```

Then update all PHP files to remove hardcoded credentials:

```php
// Secure way - environment variables only
$host = getenv('MYSQL_HOST');
$dbname = getenv('MYSQL_DATABASE');
$username = getenv('MYSQL_USER');
$password = getenv('MYSQL_PASSWORD');

if (!$host || !$dbname || !$username || !$password) {
    throw new Exception('Database configuration not found');
}
```

#### Option 2: Use a Secure Config File

Create `/public_html/License/config/.env.php` (outside web root if possible):

```php
<?php
// Database Configuration - DO NOT COMMIT TO GIT
define('DB_HOST', '82.25.105.94');
define('DB_NAME', 'cybaemtechnet_LMS_Project');
define('DB_USER', 'cybaemtechnet_LMS_Project');
define('DB_PASS', 'PrajwalAK12');
```

**Important:** Add to `.gitignore`:
```
config/.env.php
.env
.env.*
```

Then in your PHP files:
```php
require_once __DIR__ . '/../config/.env.php';

$host = DB_HOST;
$dbname = DB_NAME;
$username = DB_USER;
$password = DB_PASS;
```

#### Option 3: Use PHP-FPM Environment Variables (Best for Modern Hosting)

If your host supports PHP-FPM, configure in cPanel → PHP-FPM:
```
MYSQL_HOST=82.25.105.94
MYSQL_DATABASE=cybaemtechnet_LMS_Project
MYSQL_USER=cybaemtechnet_LMS_Project
MYSQL_PASSWORD=PrajwalAK12
```

### Files That Need Updates

All API files with database connections should be updated:

1. ✅ `api/currencies.php` - Already has fallback pattern
2. ✅ `api/notification_settings.php` - Already has fallback pattern  
3. ⚠️ `api/clients.php` - Needs update
4. ⚠️ `api/licenses.php` - Needs update
5. ⚠️ `api/login.php` - Needs update
6. ⚠️ `api/license_notifications.php` - Needs update
7. ⚠️ `api/notificationmail.php` - Needs update

### Git Security - URGENT

**If credentials are already committed to Git:**

1. **Change your database password immediately**
2. **Remove credentials from Git history:**
   ```bash
   # Install git-filter-repo
   pip install git-filter-repo
   
   # Remove credentials from history
   git filter-repo --path api/currencies.php --invert-paths
   git filter-repo --path api/notification_settings.php --invert-paths
   
   # Force push (careful!)
   git push origin --force --all
   ```

3. **Update `.gitignore`:**
   ```
   # Environment and credentials
   .env
   .env.*
   config/.env.php
   **/db_config.php
   ```

### Best Practices Going Forward

1. ✅ **Never hardcode credentials** in source code
2. ✅ **Use environment variables** for sensitive data
3. ✅ **Add credential files to .gitignore**
4. ✅ **Use different credentials** for dev/staging/production
5. ✅ **Rotate passwords regularly**
6. ✅ **Use strong, unique passwords**
7. ✅ **Limit database user permissions** (only grant needed privileges)

### Database User Permissions

Consider creating a dedicated database user with limited permissions:

```sql
-- Create a limited-privilege user
CREATE USER 'lms_api_user'@'localhost' IDENTIFIED BY 'STRONG_RANDOM_PASSWORD';

-- Grant only needed permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON cybaemtechnet_LMS_Project.* TO 'lms_api_user'@'localhost';

-- Revoke DROP, CREATE TABLE, etc. unless needed
FLUSH PRIVILEGES;
```

### Verification Checklist

After implementing the fix:
- [ ] Database credentials removed from source code
- [ ] Environment variables configured in cPanel
- [ ] All API endpoints still work correctly
- [ ] .gitignore updated to exclude credential files
- [ ] Git history cleaned (if credentials were committed)
- [ ] Database password changed (if exposed in Git)
- [ ] Tested on production environment

### Example Updated File

**Before (INSECURE):**
```php
$host = '82.25.105.94';
$password = 'PrajwalAK12';  // ❌ EXPOSED
```

**After (SECURE):**
```php
$host = getenv('MYSQL_HOST');
$password = getenv('MYSQL_PASSWORD');

if (!$host || !$password) {
    error_log('Database configuration missing');
    http_response_code(500);
    echo json_encode(['error' => 'Configuration error']);
    exit;
}
```

## Summary

⚠️ **Critical Issue:** Hardcoded database credentials  
✅ **Solution:** Environment variables with secure fallback  
📋 **Action Required:** Implement one of the 3 options above  
🔒 **Priority:** HIGH - Address immediately  
📝 **Files to Update:** All API files with database connections  

**Choose Option 1 (`.htaccess` environment variables) for quickest cPanel implementation.**

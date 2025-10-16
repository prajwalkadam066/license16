# 🔧 cPanel Deployment Fix Guide - License Management System

## 🚨 **Issues You're Experiencing**

Based on your screenshots, you're encountering these errors:
1. ❌ **404 Not Found** for API endpoints (`/License/api/licenses`)
2. ❌ **"Unexpected token '<'" errors** - App receiving HTML instead of JSON
3. ❌ **Assets not loading** (favicon, images showing 404)
4. ❌ **Database connection issues** after deployment

## ✅ **Complete Fix Steps**

---

### **STEP 1: Update Your .htaccess File on cPanel**

The main issue is your `.htaccess` file is not configured correctly for the `/License/` subdirectory.

**📍 Location:** Upload this to `public_html/License/.htaccess`

**Important:** The `.htaccess` file must be in the **same folder** as your `index.html` file (inside `/License/` folder, NOT in root `public_html/`)

#### **Correct .htaccess Content:**

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /License/
  
  # Force HTTPS (uncomment if you have SSL certificate)
  # RewriteCond %{HTTPS} off
  # RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
  
  # Serve existing files directly first (prevents rewriting real PHP files)
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]
  
  # API Routing - Route clean /License/api/* requests to PHP files in api folder
  # This only applies if the file doesn't exist (checked above)
  # Example: /License/api/licenses routes to api/licenses.php
  RewriteRule ^api/([^/]+)/?$ api/$1.php [L,QSA,NC]
  RewriteRule ^api/([^/]+)/(.*)$ api/$1.php?params=$2 [L,QSA,NC]
  
  # Skip index.html from rewriting
  RewriteRule ^index\.html$ - [L]
  
  # Route all other requests to React's index.html (for React Router)
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /License/index.html [L]
</IfModule>

# Security Headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
  
  # CORS Headers for API
  Header set Access-Control-Allow-Origin "*"
  Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
  Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>

# Enable GZIP Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Caching for static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access 1 year"
  ExpiresByType image/jpeg "access 1 year"
  ExpiresByType image/gif "access 1 year"
  ExpiresByType image/png "access 1 year"
  ExpiresByType image/webp "access 1 year"
  ExpiresByType text/css "access 1 month"
  ExpiresByType application/javascript "access 1 month"
</IfModule>

# Disable directory browsing
Options -Indexes

# Prevent access to sensitive files
<FilesMatch "^\.">
  Order allow,deny
  Deny from all
</FilesMatch>
```

---

### **STEP 2: Verify Your Folder Structure on cPanel**

Your cPanel folder structure should look like this:

```
public_html/
└── License/
    ├── .htaccess          ← MUST BE HERE!
    ├── index.html
    ├── assets/
    │   ├── index-[hash].js
    │   └── index-[hash].css
    └── api/               ← Your PHP API files
        ├── licenses.php
        ├── clients.php
        ├── login.php
        ├── config/
        │   └── database.php
        └── ...
```

**✅ Checklist:**
- [ ] `.htaccess` file is inside `/License/` folder (not in root `public_html/`)
- [ ] All React build files (from `dist/`) are in `/License/` folder
- [ ] `api/` folder with all PHP files is inside `/License/` folder
- [ ] Database credentials are correct in PHP files

---

### **STEP 3: Configure Database Connection**

Your PHP API files are using these database credentials with fallback values. Verify they match your cPanel database:

**📍 File:** `public_html/License/api/config/database.php`

```php
$host = getenv('MYSQL_HOST') ?: '82.25.105.94';
$dbname = getenv('MYSQL_DATABASE') ?: 'cybaemtechnet_LMS_Project';
$username = getenv('MYSQL_USER') ?: 'cybaemtechnet_LMS_Project';
$password = getenv('MYSQL_PASSWORD') ?: 'PrajwalAK12';
```

**Option 1: Set Environment Variables in cPanel**
1. Go to cPanel → **Select PHP Version** or **MultiPHP INI Editor**
2. Add these variables:
   - `MYSQL_HOST` → Your database host
   - `MYSQL_DATABASE` → Your database name
   - `MYSQL_USER` → Your database username
   - `MYSQL_PASSWORD` → Your database password

**Option 2: Update PHP Files Directly** (Less secure, but works)
1. Edit each PHP file in `api/` folder
2. Update the database credentials directly:
   ```php
   $host = 'localhost'; // or your database host
   $dbname = 'your_database_name';
   $username = 'your_database_user';
   $password = 'your_database_password';
   ```

---

### **STEP 4: Test the Fixes**

#### **Test API Endpoints Directly:**

1. **Test Licenses API:**
   - Open browser: `https://cybaemtech.net/License/api/licenses`
   - You should see JSON response (list of licenses)
   - If you see error, check PHP error logs in cPanel

2. **Test Login API:**
   - Open: `https://cybaemtech.net/License/api/login`
   - Should return JSON error (since it needs POST data)

#### **Test React App:**

1. Open: `https://cybaemtech.net/License/`
2. You should see the login page
3. Open browser console (F12)
4. Check for errors - API calls should work now

---

### **STEP 5: Common Issues & Solutions**

#### **Issue: Still Getting 404 for API**

**Solution:**
```bash
# In cPanel File Manager, check file permissions:
# - .htaccess should be 644
# - api folder should be 755
# - PHP files should be 644
```

Also verify mod_rewrite is enabled:
1. Ask your hosting provider to enable `mod_rewrite` if not already enabled
2. Check if `.htaccess` files are allowed (AllowOverride must be enabled)

#### **Issue: "Unexpected token '<'" Error**

This means the API is returning HTML (404 page) instead of JSON.

**Solutions:**
1. ✅ Make sure `.htaccess` is in `/License/` folder (NOT in `public_html/` root)
2. ✅ Verify `RewriteBase /License/` is set correctly
3. ✅ Check that `api/` folder exists and has PHP files
4. ✅ Test API directly in browser (should show JSON, not HTML)

#### **Issue: Assets (CSS/JS) Not Loading**

**Solution:**
1. Clear browser cache (Ctrl + Shift + Del)
2. Do a hard refresh (Ctrl + Shift + R)
3. Verify assets folder exists in `/License/assets/`
4. Check if `base: '/License/'` is set in `vite.config.ts` before building

#### **Issue: Database Connection Failed**

**Error:** "SQLSTATE[HY000] [1045] Access denied"

**Solutions:**
1. ✅ Verify database exists in cPanel → MySQL Databases
2. ✅ Verify database user has privileges
3. ✅ Check database name includes cPanel prefix (e.g., `cpanelusername_dbname`)
4. ✅ Try `localhost`, `127.0.0.1`, or actual DB host IP
5. ✅ In cPanel MySQL Databases, ensure user is added to database with ALL PRIVILEGES

#### **Issue: CORS Errors**

If you see CORS errors in browser console:

**Solution:**
1. The PHP files already have CORS headers
2. Add to `.htaccess` if needed (already included in the fix above)
3. Make sure headers module is enabled on your server

---

### **STEP 6: Rebuild and Redeploy (If Needed)**

If you need to rebuild the project with correct settings:

#### **On Your Local Machine or Replit:**

```bash
# 1. Ensure vite.config.ts has correct base path
# base: '/License/'

# 2. Build the project
npm run build

# 3. Upload contents of 'dist' folder to cPanel
# Upload to: public_html/License/
# (NOT the dist folder itself, just its contents)

# 4. Upload .htaccess file (from cpanel.htaccess)
# Place in: public_html/License/.htaccess

# 5. Upload api folder
# Place in: public_html/License/api/
```

---

### **STEP 7: Enable SSL (Recommended)**

Once everything works, enable SSL:

1. Go to cPanel → **SSL/TLS Status**
2. Enable **AutoSSL** for your domain
3. Wait for certificate to be issued (5-10 minutes)
4. Uncomment HTTPS redirect in `.htaccess`:
   ```apache
   RewriteCond %{HTTPS} off
   RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   ```

---

## 📋 **Quick Deployment Checklist**

### Before Deployment:
- [ ] Set `base: '/License/'` in `vite.config.ts`
- [ ] Run `npm run build`
- [ ] Have database credentials ready

### Upload to cPanel:
- [ ] Upload `dist/` contents to `public_html/License/`
- [ ] Upload `.htaccess` to `public_html/License/.htaccess`
- [ ] Upload `api/` folder to `public_html/License/api/`
- [ ] Set correct file permissions (644 for files, 755 for folders)

### Configure:
- [ ] Update database credentials in PHP files
- [ ] Verify `.htaccess` has `RewriteBase /License/`
- [ ] Test API endpoints directly
- [ ] Test React app in browser

### Verify:
- [ ] No 404 errors for API
- [ ] No "Unexpected token" errors
- [ ] Login works
- [ ] Data loads correctly
- [ ] All features work

---

## 🔍 **Debugging Commands**

### Check if mod_rewrite is enabled:
```php
<?php phpinfo(); ?>
```
Upload this to your server and access it. Search for "mod_rewrite" - it should be listed.

### Check API Response:
```bash
curl https://cybaemtech.net/License/api/licenses
```
Should return JSON, not HTML.

### Check PHP Errors:
1. Go to cPanel → **Errors** (under Metrics)
2. View recent PHP errors
3. Fix any issues shown

---

## 📞 **Still Having Issues?**

If you still have problems after following these steps:

1. **Check Error Logs:**
   - cPanel → Errors
   - Look for specific error messages
   
2. **Verify with Hosting Provider:**
   - Confirm mod_rewrite is enabled
   - Confirm .htaccess files are allowed
   - Confirm PHP version is 7.4+ or 8.x

3. **Test Individual Components:**
   - Test database connection in phpMyAdmin
   - Test API files directly
   - Check browser console for specific errors

---

## ✅ **Success Indicators**

You'll know it's working when:
- ✅ `https://cybaemtech.net/License/` shows login page
- ✅ `https://cybaemtech.net/License/api/licenses` returns JSON (not 404)
- ✅ No console errors in browser
- ✅ Login works and data loads
- ✅ All CRUD operations work

---

**Good luck with your deployment! 🚀**

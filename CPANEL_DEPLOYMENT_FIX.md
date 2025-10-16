# cPanel Deployment Fix - Complete Guide

## 🎯 Problem Solved
Fixed the API 404 error where frontend couldn't reach backend PHP files on cybaemtech.net

## 📁 Your Folder Structure on cPanel

```
public_html/
 └── License/
     ├── dist/               ← Frontend build (copy contents of dist/ folder here)
     │   ├── index.html
     │   ├── assets/
     │   └── ...
     ├── api/                ← Backend PHP APIs
     │   ├── .htaccess      ← Updated API routing
     │   ├── licenses.php
     │   ├── clients.php
     │   ├── login.php
     │   └── ...
     └── .htaccess          ← Main routing (use License.htaccess)
```

## ✅ What Has Been Fixed

### 1. **API Base URL Detection** (`src/config/index.ts`)
The frontend now automatically detects it's running in `/License` subdirectory and uses the correct API path:

```typescript
// Now correctly returns: https://cybaemtech.net/License/api
if (hostname.includes('cybaemtech.net')) {
  if (pathname.includes('/License')) {
    return 'https://cybaemtech.net/License/api';
  }
}
```

### 2. **CORS Headers** (All PHP files)
All PHP endpoints have proper CORS headers (wildcard origin without credentials):
```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
header('Access-Control-Max-Age: 86400');
header('Content-Type: application/json');
// Note: No Allow-Credentials header - using wildcard origin for simplicity
```

### 3. **API .htaccess** (`api/.htaccess`)
Updated to allow direct access to PHP files:
```apache
RewriteEngine On
Options -MultiViews

# CORS Headers
<IfModule mod_headers.c>
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With, Accept, Origin"
</IfModule>

# Allow direct access to PHP files
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule ^.*$ - [L]
```

### 4. **License Folder .htaccess** (`License.htaccess`)
Handles React Router while preserving API routes:
```apache
RewriteEngine On
RewriteBase /License/

# Don't rewrite API calls - let them pass through
RewriteCond %{REQUEST_URI} ^/License/api/ [NC]
RewriteRule ^.*$ - [L]

# Handle React Router - serve index.html for non-file routes
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.html [QSA,L]
```

## 📋 Deployment Steps for cPanel

### Step 1: Build the Project (Already Done ✅)
The latest build is in the `dist/` folder with the updated configuration.

### Step 2: Upload to cPanel

**Option A: Via File Manager**
1. Log into cPanel
2. Go to File Manager → public_html/License/
3. Delete old dist files (index.html, assets folder)
4. Upload NEW contents from `dist/` folder to `public_html/License/dist/`
5. Copy `dist/` contents to License root: `public_html/License/`
6. Upload `api/` folder (overwrite existing)
7. Upload `.htaccess` files:
   - `License.htaccess` → rename to `.htaccess` in `/License/`
   - `api/.htaccess` → already in correct location

**Option B: Via FTP**
1. Connect to your FTP
2. Navigate to `/public_html/License/`
3. Upload `dist/` contents to `/public_html/License/`
4. Upload `api/` folder (overwrite)
5. Upload `.htaccess` files (rename `License.htaccess` to `.htaccess`)

### Step 3: Verify .htaccess Files

**In `/public_html/License/.htaccess`:**
```apache
RewriteEngine On
RewriteBase /License/

# Don't rewrite API calls
RewriteCond %{REQUEST_URI} ^/License/api/ [NC]
RewriteRule ^.*$ - [L]

# React Router fallback
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.html [QSA,L]
```

**In `/public_html/License/api/.htaccess`:**
```apache
RewriteEngine On
Options -MultiViews

<IfModule mod_headers.c>
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With, Accept, Origin"
</IfModule>

RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

RewriteCond %{REQUEST_FILENAME} -f
RewriteRule ^.*$ - [L]
```

## 🧪 Testing Your Deployment

### Test 1: API Direct Access
Open these URLs in your browser - they should return JSON:

```
✅ Licenses API:
https://cybaemtech.net/License/api/licenses.php

✅ Clients API:
https://cybaemtech.net/License/api/clients.php

✅ Notification Settings:
https://cybaemtech.net/License/api/notification_settings.php
```

**Expected Response:**
```json
{
  "success": true,
  "data": [...],
  "total_count": X,
  "timestamp": "2025-10-15 12:00:00"
}
```

### Test 2: Frontend Access
```
✅ Main App:
https://cybaemtech.net/License/

Should load the React app without errors
```

### Test 3: Browser Console
Open DevTools (F12) → Console tab:

**✅ Good Signs:**
```
🔧 App Configuration: {API_BASE_URL: "https://cybaemtech.net/License/api", ...}
Fetching dashboard data...
Fetched licenses: [...]
```

**❌ Bad Signs (should NOT appear):**
```
Unexpected token '<'  ← Means HTML returned instead of JSON
CORS error           ← Means CORS headers missing
404 Not Found        ← Means wrong API path
```

## 📝 Corrected Fetch Code Examples

The frontend automatically uses the correct API URL. Here's how it works:

### Example 1: Fetch Licenses
```javascript
// In your React component
const response = await fetch(`${getApiBaseUrl()}/licenses`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
});

// On cybaemtech.net/License, this becomes:
// https://cybaemtech.net/License/api/licenses
```

### Example 2: Create New License
```javascript
const response = await fetch(`${getApiBaseUrl()}/licenses`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    tool_name: 'Adobe Photoshop',
    cost_per_user: 999,
    quantity: 5,
    expiration_date: '2025-12-31',
    // ... other fields
  })
});
```

## 🔧 Troubleshooting

### Issue 1: Still Getting 404
**Solution:** 
- Verify `.htaccess` files are in correct locations
- Check file permissions (644 for files, 755 for folders)
- Clear browser cache (Ctrl+Shift+Delete)

### Issue 2: CORS Errors
**Solution:**
- Verify `api/.htaccess` has CORS headers
- Check PHP files have CORS headers at the top (before any output)
- Ensure Apache `mod_headers` is enabled in cPanel

### Issue 3: "Unexpected token <" Error
**Solution:**
- This means PHP is returning HTML/error instead of JSON
- Check PHP error logs in cPanel
- Enable error display in PHP files temporarily:
  ```php
  ini_set('display_errors', 1);
  error_reporting(E_ALL);
  ```

### Issue 4: React Router 404s
**Solution:**
- Verify `License/.htaccess` has React Router fallback
- Make sure `RewriteBase /License/` is set correctly

## ✅ Final Checklist

- [ ] Build project: `npm run build` (✅ Already done)
- [ ] Upload `dist/` contents to `/public_html/License/`
- [ ] Upload `api/` folder to `/public_html/License/api/`
- [ ] Upload `License.htaccess` as `/public_html/License/.htaccess`
- [ ] Verify `api/.htaccess` exists and has CORS headers
- [ ] Test API URLs directly in browser (should return JSON)
- [ ] Test frontend at https://cybaemtech.net/License/
- [ ] Check browser console for errors
- [ ] Verify API calls work (no CORS errors, no 404s)

## 🎉 Success Indicators

When everything works correctly, you'll see:

1. **Browser Network Tab:**
   - ✅ `GET https://cybaemtech.net/License/api/licenses` → 200 OK
   - ✅ Response Type: `application/json`
   - ✅ Response contains `{"success": true, "data": [...]}`

2. **Browser Console:**
   - ✅ No CORS errors
   - ✅ No "Unexpected token <" errors  
   - ✅ API configuration shows correct base URL

3. **Application:**
   - ✅ Dashboard loads with data
   - ✅ Licenses page shows licenses
   - ✅ Can create/edit/delete licenses

## 📞 Need Help?

If you still encounter issues:
1. Check browser DevTools → Network tab → Click failed request → Preview response
2. Check cPanel → Error Logs
3. Verify database credentials in PHP files
4. Ensure Apache mod_rewrite is enabled

---

**Last Updated:** October 15, 2025
**Status:** ✅ All files updated and ready for deployment

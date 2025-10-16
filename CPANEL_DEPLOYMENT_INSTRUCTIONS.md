# 📦 cPanel Deployment Instructions - Ready to Deploy!

## ✅ Your Build is Ready!

I've fixed all the issues and prepared your project for cPanel deployment. Here's what was fixed:

### 🔧 **Issues Fixed:**
1. ✅ Corrected `.htaccess` configuration for `/License/` subdirectory
2. ✅ Fixed API routing (404 errors will be resolved)
3. ✅ Set correct base path in Vite configuration
4. ✅ Built production-ready files with proper settings

---

## 📁 **Files Ready for Upload**

Your deployment files are in the **`dist/`** folder. Here's what you need to upload:

```
dist/
├── .htaccess          ← Fixed .htaccess with correct routing
├── index.html         ← Your React app entry point
├── assets/
│   ├── index-CWgc2slf.js
│   ├── index-pfyobe_4.css
│   └── Logo-BJF_aLNG.png
```

---

## 🚀 **Step-by-Step Upload Instructions**

### **STEP 1: Access cPanel File Manager**

1. Log into your cPanel at: `https://cybaemtech.net:2083`
2. Click on **"File Manager"**
3. Navigate to: `public_html/License/`

### **STEP 2: Backup Existing Files (Important!)**

1. In `public_html/License/`, select all files
2. Click **"Compress"** → Create backup (e.g., `backup_[date].zip`)
3. This allows you to restore if needed

### **STEP 3: Remove Old Frontend Files**

**⚠️ DO NOT DELETE THE `api/` FOLDER!**

Delete only these:
- `index.html`
- `assets/` folder (old build)
- Old `.htaccess` (if exists)

**Keep these:**
- `api/` folder (your PHP backend)
- Any other PHP files
- Database-related files

### **STEP 4: Upload New Build Files**

#### **Option A: Direct Upload (Recommended)**

1. In cPanel File Manager, navigate to: `public_html/License/`
2. Click **"Upload"** button
3. Upload ALL files from your local `dist/` folder:
   - `index.html`
   - `.htaccess` ← **Very Important!**
   - `assets/` folder (drag the entire folder)
4. Wait for upload to complete

#### **Option B: Using ZIP (Faster for multiple files)**

1. On your local machine, compress the `dist/` folder contents:
   - Select everything **inside** `dist/` (not the folder itself)
   - Create a zip file: `license-app-build.zip`
2. Upload the zip to `public_html/License/`
3. In File Manager, right-click the zip → **"Extract"**
4. Delete the zip file after extraction

### **STEP 5: Verify File Structure**

After upload, your structure should be:

```
public_html/License/
├── .htaccess          ← NEW (very important!)
├── index.html         ← NEW
├── assets/            ← NEW
│   ├── index-CWgc2slf.js
│   ├── index-pfyobe_4.css
│   └── Logo-BJF_aLNG.png
└── api/               ← EXISTING (do not touch!)
    ├── licenses.php
    ├── clients.php
    ├── login.php
    └── config/
        └── database.php
```

### **STEP 6: Set Correct Permissions**

In cPanel File Manager:

1. Select `.htaccess` → Change Permissions → `644`
2. Select `index.html` → Change Permissions → `644`
3. Select `assets` folder → Change Permissions → `755`
4. Select all `.js` and `.css` files → Change Permissions → `644`

---

## 🧪 **Testing Your Deployment**

### **Test 1: Check Frontend**
1. Open browser: `https://cybaemtech.net/License/`
2. You should see the login page (no errors)
3. Press F12 to open Developer Tools → Console tab
4. Should see: "App Configuration" and "API Configuration" logs
5. **NO "Unexpected token" or 404 errors**

### **Test 2: Check API Endpoints**
1. Test Licenses API:
   ```
   https://cybaemtech.net/License/api/licenses
   ```
   Should return JSON data (not 404 error)

2. Test Login API:
   ```
   https://cybaemtech.net/License/api/login
   ```
   Should return JSON error message (it needs POST data)

### **Test 3: Try Logging In**
1. On the login page, enter credentials
2. If successful, you'll see the dashboard
3. Check if licenses, clients, and other data loads correctly

---

## 🔴 **If You Still Get Errors:**

### **Error: "Unexpected token '<', '<!DOCTYPE'... is not valid JSON"**

**This means the .htaccess is not working.**

**Fix:**
1. Verify `.htaccess` file exists in `public_html/License/` (NOT in `public_html/`)
2. Check `.htaccess` content starts with:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /License/
   ```
3. Verify file permissions: `.htaccess` should be `644`
4. Contact your hosting provider to confirm:
   - `mod_rewrite` is enabled
   - `.htaccess` files are allowed (AllowOverride)

### **Error: 404 for API endpoints**

**Fix:**
1. Verify `api/` folder exists in `public_html/License/api/`
2. Check that API files (licenses.php, etc.) are inside `api/` folder
3. Test API directly: `https://cybaemtech.net/License/api/licenses`
4. If 404 persists, check `.htaccess` API routing rules are correct

### **Error: Database connection failed**

**Fix:**
1. Go to `public_html/License/api/config/database.php`
2. Verify database credentials:
   ```php
   $host = 'localhost';  // or your DB host
   $dbname = 'cybaemtechnet_LMS_Project';
   $username = 'cybaemtechnet_LMS_Project';
   $password = 'your_password_here';
   ```
3. Test connection in cPanel → phpMyAdmin
4. Ensure database user has ALL PRIVILEGES

---

## 📋 **Quick Checklist**

Before testing:
- [ ] Backed up existing files
- [ ] Uploaded all files from `dist/` to `public_html/License/`
- [ ] `.htaccess` file is in `public_html/License/.htaccess`
- [ ] File permissions are correct (644 for files, 755 for folders)
- [ ] `api/` folder was NOT deleted or modified
- [ ] Database credentials are correct in PHP files

After upload:
- [ ] Frontend loads without errors
- [ ] API endpoints return JSON (not 404)
- [ ] Login works correctly
- [ ] Data loads on dashboard
- [ ] All features work as expected

---

## 🎯 **Expected Results**

### ✅ **Success Indicators:**
- Login page loads at `https://cybaemtech.net/License/`
- No console errors in browser
- API calls return data (check Network tab in DevTools)
- Login works and redirects to dashboard
- Licenses, clients, and other data displays correctly
- All CRUD operations work (Create, Read, Update, Delete)

---

## 📝 **Additional Notes**

### **SSL Certificate (Recommended)**
Once everything works:
1. Go to cPanel → **SSL/TLS Status**
2. Enable **AutoSSL** for your domain
3. Wait 5-10 minutes for certificate
4. Edit `.htaccess` and uncomment the HTTPS redirect:
   ```apache
   RewriteCond %{HTTPS} off
   RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   ```

### **Performance Optimization**
The build is already optimized with:
- Minified JavaScript and CSS
- GZIP compression enabled
- Browser caching for assets
- Optimized images

---

## 🆘 **Need More Help?**

Refer to the detailed troubleshooting guide:
- See: **`CPANEL_FIX_GUIDE.md`** for comprehensive solutions

Common issues and solutions are documented there.

---

## ✨ **You're All Set!**

Your License Management System is now ready for deployment. Follow the upload steps, test thoroughly, and you should have a fully working application on cPanel!

**Good luck! 🚀**

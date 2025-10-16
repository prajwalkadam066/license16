# 🔧 cPanel Deployment Fix - Data Fetching Issue Resolved

## ✅ Problem Identified and Fixed!

### **What Was Wrong:**
Your application worked perfectly on localhost but failed on cPanel because the `.htaccess` configuration was set up for root-level deployment (`/`) instead of the `/License/` subdirectory.

**Specific Issues:**
1. ❌ **RewriteBase was `/` instead of `/License/`** - This caused all routes to be resolved from the domain root
2. ❌ **API requests were being redirected to index.html** - The `.htaccess` only excluded `/api/` but your API is at `/License/api/`
3. ❌ **Data couldn't be fetched** - PHP endpoints never executed because Apache was serving `index.html` instead

### **What Was Fixed:**
1. ✅ **Updated RewriteBase to `/License/`** - Now routes resolve correctly in the subdirectory
2. ✅ **Fixed API exclusion** - Changed from `/api/` to `/License/api/` so API requests reach PHP backend
3. ✅ **Rebuilt production files** - All files in `dist/` folder now have correct configuration

---

## 📦 **Deploy the Fixed Files to cPanel**

### **STEP 1: Access cPanel File Manager**

1. Log into your cPanel at: `https://cybaemtech.net:2083`
2. Click on **"File Manager"**
3. Navigate to: `public_html/License/`

### **STEP 2: Backup Existing Files (IMPORTANT!)**

Before making any changes:
1. In `public_html/License/`, select all files
2. Click **"Compress"** → Create a zip (name it `backup_[today's date].zip`)
3. Download the backup to your computer for safety

### **STEP 3: Remove Old Frontend Files**

**⚠️ CRITICAL: DO NOT DELETE THE `api/` FOLDER!**

**Delete only these files/folders:**
- `index.html` (old version)
- `assets/` folder (old build)
- `.htaccess` (old configuration - this is the broken one)

**Keep these (DO NOT DELETE):**
- `api/` folder (your PHP backend)
- Any `.php` files
- Database-related files
- Any configuration files

### **STEP 4: Upload New Fixed Files**

#### **Option A: Upload Files Individually (Recommended)**

1. In cPanel File Manager, make sure you're in: `public_html/License/`
2. Click **"Upload"** button
3. Upload these files from your `dist/` folder:
   - **`.htaccess`** ← **CRITICAL: This is the fixed file!**
   - **`index.html`**
   - **`assets/`** folder (drag the entire folder or upload as zip)

#### **Option B: Upload as ZIP (Faster)**

1. On your computer, go to the `dist/` folder
2. Select ALL contents inside `dist/` (not the dist folder itself):
   - `.htaccess`
   - `index.html`
   - `assets/` folder
3. Create a ZIP file (name it: `fixed-license-app.zip`)
4. In cPanel File Manager, navigate to `public_html/License/`
5. Click **"Upload"** and upload the ZIP file
6. After upload completes, right-click the ZIP → **"Extract"**
7. Click **"Extract Files"** button
8. Delete the ZIP file after extraction

### **STEP 5: Verify File Structure**

Your `public_html/License/` should now look like this:

```
public_html/License/
├── .htaccess          ← NEW (with RewriteBase /License/)
├── index.html         ← NEW (updated)
├── assets/            ← NEW (updated React build)
│   ├── index-BHk0yVYG.js
│   ├── index-pfyobe_4.css
│   └── Logo-BJF_aLNG.png
├── api/               ← EXISTING (kept as is)
│   ├── .htaccess
│   ├── config/
│   ├── licenses.php
│   ├── clients.php
│   ├── vendors.php
│   └── (other PHP files)
```

### **STEP 6: Test Your Application**

1. **Clear your browser cache:**
   - Press `Ctrl + Shift + Delete` (Windows/Linux)
   - Press `Cmd + Shift + Delete` (Mac)
   - Select "Cached images and files" and clear

2. **Visit your application:**
   - Go to: `https://cybaemtech.net/License/`
   - You should see the login page

3. **Test data fetching:**
   - Log in with your credentials
   - Navigate to **Licenses** page
   - Navigate to **Clients** page
   - Navigate to **Vendors** page
   - **All data should now load correctly!** ✅

4. **Open browser DevTools (F12) and check:**
   - Go to **Network** tab
   - Filter by **XHR** or **Fetch**
   - You should see API requests to `/License/api/licenses.php`, `/License/api/clients.php`, etc.
   - They should return **200 OK** with actual data (not HTML)

---

## 🔍 **What Changed in the .htaccess File**

### **OLD (Broken) Configuration:**
```apache
RewriteBase /                           ← WRONG: Routes from root
RewriteCond %{REQUEST_URI} !^/api/      ← WRONG: Only excludes /api/
```

### **NEW (Fixed) Configuration:**
```apache
RewriteBase /License/                         ← CORRECT: Routes from /License/
RewriteCond %{REQUEST_URI} !^/License/api/    ← CORRECT: Excludes /License/api/
```

**Why this matters:**
- With the old config, requests to `/License/api/licenses.php` were rewritten to serve `index.html`
- With the new config, requests to `/License/api/licenses.php` are properly routed to the PHP backend
- This is why data couldn't be fetched before - the PHP files were never executed!

---

## ✅ **Verification Checklist**

After deployment, verify:

- [ ] Login page loads at `https://cybaemtech.net/License/`
- [ ] Can successfully log in
- [ ] Dashboard shows data (not "No licenses found")
- [ ] Licenses page loads and displays data
- [ ] Clients page loads and displays data
- [ ] Vendors page loads and displays data
- [ ] Navigation between pages works
- [ ] Browser DevTools shows API requests returning JSON data (not HTML)

---

## 🚨 **If You Still Have Issues**

1. **Clear browser cache completely** (try incognito/private mode)
2. **Check file permissions** in cPanel:
   - `.htaccess` should be `644`
   - `index.html` should be `644`
   - `assets/` folder should be `755`
   - Files inside `assets/` should be `644`

3. **Verify .htaccess was uploaded correctly:**
   - In cPanel File Manager, right-click `.htaccess` → **"Edit"**
   - Verify line 3 says: `RewriteBase /License/`
   - Verify line 11 says: `RewriteCond %{REQUEST_URI} !^/License/api/`

4. **Check for .htaccess conflicts:**
   - Make sure there's no `.htaccess` in `public_html/` that conflicts
   - The one in `public_html/License/.htaccess` should be the one we just uploaded

---

## 📋 **Summary**

**Problem:** Application worked on localhost but not on cPanel because `.htaccess` was configured for root deployment, causing API requests to fail.

**Solution:** Updated `.htaccess` with correct `RewriteBase /License/` and proper API path exclusion `/License/api/`.

**Result:** Data fetching now works correctly on cPanel! 🎉

---

## 📞 **Need Help?**

If you encounter any issues during deployment:
1. Check the browser console for errors (F12 → Console tab)
2. Check the Network tab to see if API requests are successful
3. Verify all files were uploaded to the correct location
4. Ensure `.htaccess` file has the correct content

Your application should now work perfectly on cPanel! 🚀

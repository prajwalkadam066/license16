# cPanel Vendor Page Fix - Deployment Instructions

## Problems Solved

### Issue 1: 404 Not Found Errors
The vendor page was showing 404 errors because the .htaccess configuration was trying to access individual PHP files (like `vendors.php`) that don't exist. The system uses a router pattern where all API requests go through `api/index.php`.

### Issue 2: Internal Server Error (500) - Path Handling
After fixing the 404 errors, the API was returning "Internal server error" because the `api/index.php` router wasn't properly handling the `/License/api/` URL path. It was only checking for `/lms/api/` and `/api/` paths.

### Issue 3: Internal Server Error (500) - JWT Check
ALL API endpoints were returning 500 errors on cPanel because `api/config/constants.php` was checking for a `JWT_SECRET` environment variable in production mode. When this variable wasn't set, it would exit with a 500 error. Since JWT authentication isn't actually used in this project (it uses session-based auth), this check was causing unnecessary failures.

## Fixed Files
1. ✅ `api/.htaccess` - Now routes all API requests through `index.php`
2. ✅ `cpanel.htaccess` - Updated to let the API folder handle its own routing
3. ✅ `api/index.php` - Added path handling for `/License/api/` URLs
4. ✅ `api/config/constants.php` - Removed JWT_SECRET check that was causing 500 errors

## Deployment Steps for cPanel

### Step 1: Upload the Updated Files

Upload these files to your cPanel:

1. **Main .htaccess file** (in `/License/` folder):
   - Upload `cpanel.htaccess` 
   - Rename it to `.htaccess` on the server
   - Location: `/public_html/License/.htaccess`

2. **API .htaccess file** (in `/License/api/` folder):
   - Upload `api/.htaccess` 
   - Keep the name as `.htaccess`
   - Location: `/public_html/License/api/.htaccess`

3. **API Router file** (in `/License/api/` folder):
   - Upload `api/index.php`
   - Keep the name as `index.php`
   - Location: `/public_html/License/api/index.php`
   - **Important:** This file now handles `/License/api/` paths correctly

4. **API Constants file** (in `/License/api/config/` folder):
   - Upload `api/config/constants.php`
   - Keep the name as `constants.php`
   - Location: `/public_html/License/api/config/constants.php`
   - **Critical:** This file was causing ALL 500 errors! The JWT check has been removed.

### Step 2: Verify the Files

Make sure you have these files on your server:
```
/public_html/License/.htaccess                (this is cpanel.htaccess renamed)
/public_html/License/api/.htaccess            (this is api/.htaccess)
/public_html/License/api/index.php            (updated with /License/api path handling)
/public_html/License/api/config/constants.php (JWT check removed - CRITICAL FIX)
```

### Step 3: Clear Browser Cache

After uploading:
1. Clear your browser cache
2. Do a hard refresh (Ctrl + Shift + R on Windows/Linux or Cmd + Shift + R on Mac)

### Step 4: Test the Vendor Page

1. Go to: `https://cybamtech.net/License/vendors`
2. The vendor page should now load without errors
3. You should be able to:
   - View the vendor list
   - Add new vendors
   - Edit existing vendors
   - Delete vendors

## What Was Fixed

### Fix 1: .htaccess Routing (404 Error Fix)

**Before (Old api/.htaccess):**
- Tried to add `.php` extension to files
- Example: `/api/vendors` → looked for `vendors.php` → 404 error

**After (New api/.htaccess):**
- Routes all non-existent requests through `index.php`
- Example: `/api/vendors` → `index.php` → VendorsController → Works! ✅

**Before (Old cpanel.htaccess):**
- Tried to route API requests to individual PHP files
- `RewriteRule ^api/([^/]+)/?$ api/$1.php` → This caused the 404 errors

**After (New cpanel.htaccess):**
- Lets the `api/.htaccess` handle all API routing
- API requests pass through to the api folder unchanged

### Fix 2: Path Handling (500 Error Fix)

**Before (Old api/index.php):**
- Only checked for `/lms/api` and `/api` paths
- When URL was `/License/api/vendors`, it couldn't parse it correctly
- Example: `/License/api/vendors` → Router couldn't find resource → 500 error

**After (New api/index.php):**
- Added checks for `/License/api/index.php` and `/License/api` paths
- Properly strips the `/License/api` prefix before routing
- Example: `/License/api/vendors` → strips `/License/api` → routes to `vendors` → VendorsController → Works! ✅

### Fix 3: JWT Secret Check (500 Error Fix - CRITICAL)

**Before (Old api/config/constants.php):**
- Checked for `JWT_SECRET` environment variable in production mode
- If missing, immediately exited with 500 error: `{"message":"Internal server error"}`
- This affected **ALL** API endpoints because every file includes constants.php
- JWT authentication isn't even used in this project (uses session-based auth instead)

**After (New api/config/constants.php):**
- Removed the production environment check that was blocking all API requests
- JWT_SECRET is set to `null` when not provided (safe default)
- Added `validateJwtConfig()` helper function that throws an exception if JWT code is used without proper configuration
- This ensures any future JWT code will fail explicitly with a clear error message
- All API endpoints work correctly with session-based authentication
- Security: If JWT support is added later, it will require JWT_SECRET to be properly set as an environment variable
- Example: `/License/api/vendors` → No unnecessary JWT check → Controller executes → Returns data → Works! ✅

## Troubleshooting

If the vendor page still doesn't work:

1. **Check .htaccess file permissions**:
   - Should be `644` (readable by web server)

2. **Verify mod_rewrite is enabled**:
   - Contact your hosting provider to confirm Apache mod_rewrite is enabled

3. **Check error logs**:
   - cPanel → Error Logs
   - Look for any .htaccess errors

4. **Test API directly**:
   - Visit: `https://cybamtech.net/License/api/vendors`
   - Should return JSON: `{"success":true,"data":[...]}`

## Important Notes

- Both .htaccess files work together
- The main .htaccess routes React app requests
- The api/.htaccess routes API requests to the correct controller
- This fix applies to ALL API endpoints (vendors, clients, licenses, etc.)

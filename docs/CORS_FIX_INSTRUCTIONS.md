# URGENT FIX REQUIRED - Client Dropdown Not Loading

## Problem Identified
The "Add New License" modal shows "Loading clients..." but never loads the client list due to a CORS configuration mismatch.

## Root Cause
- Frontend uses `credentials: 'include'` in fetch requests
- Server CORS headers currently set to:
  - `Access-Control-Allow-Origin: *` 
  - `Access-Control-Allow-Credentials: false`
- When using `credentials: 'include'`, origin cannot be `*` and credentials must be `true`

## Solution
Updated CORS headers in both `clients.php` and `licenses.php` to:
- `Access-Control-Allow-Origin: http://localhost:5013`
- `Access-Control-Allow-Credentials: true`

## Files That Need To Be Uploaded to cPanel

### 1. api/clients.php
**Updated CORS headers (lines 12-17):**
```php
// Set CORS headers before any output
header('Access-Control-Allow-Origin: http://localhost:5013');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
header('Access-Control-Max-Age: 86400');
header('Access-Control-Allow-Credentials: true');
```

### 2. api/licenses.php  
**Updated CORS headers (lines 14-19):**
```php
// Set CORS headers before any output
header('Access-Control-Allow-Origin: http://localhost:5013');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
header('Access-Control-Max-Age: 86400');
header('Access-Control-Allow-Credentials: true');
```

## Immediate Action Required
1. Upload the updated `clients.php` file to `cybaemtech.net/lms/api/clients.php`
2. Upload the updated `licenses.php` file to `cybaemtech.net/lms/api/licenses.php`
3. Test the "Add New License" modal - client dropdown should now load properly

## Verification
After uploading, test with:
- Open http://localhost:5013
- Go to Licenses page  
- Click "Add New License"
- Client dropdown should show: "Client (4 available)" with actual client names

## Current Status
✅ Local files updated with correct CORS headers
⏳ **PENDING**: Upload to server
❌ Client dropdown still showing "Loading clients..." until upload is complete
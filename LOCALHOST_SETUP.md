# 🚀 Localhost Setup Guide - Quick Fix

## ❌ Current Errors You Might Get

### Error 1: Windows PowerShell/CMD
```
'PORT' is not recognized as an internal or external command
```
**Status**: ✅ FIXED - Now using cross-env for Windows compatibility

### Error 2: Connection Refused
```
[vite] http proxy error: /api/licenses
Error: connect ECONNREFUSED ::1:8000
```
**Cause**: Backend server not running

## ✅ The Solution

You need to run **both frontend and backend** servers together!

### Step 1: Ensure Dependencies are Installed
```bash
npm install
```

### Step 2: Stop Any Running Process
Press `Ctrl + C` to stop current servers

### Step 3: Run Both Servers
```bash
npm run dev:full
```

This command runs (now **Windows compatible**):
- ✅ Backend API server on port 8000  
- ✅ Frontend React app on port 5000 (or 5001 if 5000 is in use)

### Step 3: Configure Database (if not done already)

1. **Create `.env` file** in the root directory:
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file** with your MySQL credentials:
   ```env
   MYSQL_HOST=localhost
   MYSQL_USER=root
   MYSQL_PASSWORD=your_mysql_password
   MYSQL_DATABASE=license_management_db
   PORT=8000
   ```

3. **Create MySQL Database**:
   ```sql
   CREATE DATABASE license_management_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

4. **Run the SQL Setup Script**:
   - Open MySQL Workbench or phpMyAdmin
   - Copy the complete SQL script from `DATABASE_SETUP_GUIDE.md`
   - Run it in your database

### Step 4: Access Application
- Open browser: http://localhost:5002/lms
- Login with:
  - Email: `rohan.bhosale@cybaemtech.com`
  - Password: `password`

---

## 📝 Quick Command Reference

```bash
# ✅ CORRECT - Run both servers
npm run dev:full

# ❌ WRONG - Only runs frontend (causes your error)
npm run dev

# Run backend only
npm run server

# Run frontend only  
npm run dev
```

---

## 🔍 Verify Everything is Working

After running `npm run dev:full`, you should see:

```
[0] 🚀 Server running on http://0.0.0.0:8000
[0] 📊 API endpoints available at http://0.0.0.0:8000/api
[1] ➜  Local:   http://localhost:5000/lms
```

If you see database warnings:
```
[0] ⚠️ MySQL credentials not set — DB routes will return 503
```

Then you need to configure your `.env` file with MySQL credentials (see Step 3 above).

---

## 🐛 Troubleshooting

### Backend port 8000 already in use
```bash
# Find and kill the process
lsof -ti:8000 | xargs kill -9
```

### Frontend port 5000 already in use
```bash
# Find and kill the process
lsof -ti:5000 | xargs kill -9
```

### MySQL connection errors
1. Verify MySQL is running: `sudo systemctl status mysql`
2. Check credentials in `.env` file
3. Test connection: `mysql -u root -p`

# ✅ Windows PowerShell/CMD Fix - SOLVED!

## 🐛 The Problem You Had

```
'PORT' is not recognized as an internal or external command
npm run server exited with code 1
```

**Root Cause**: Windows PowerShell and CMD don't support setting environment variables inline like Linux/macOS does.

## ✅ The Fix Applied

I've updated the project to use `cross-env` - a cross-platform solution that works on Windows, macOS, and Linux.

### What Changed:

**Before (broken on Windows):**
```json
"server": "PORT=8000 tsx server/index.ts"
```

**After (works everywhere):**
```json
"server": "cross-env PORT=8000 tsx server/index.ts"
```

---

## 🚀 How to Run on Windows Now

### Step 1: Make sure you have the latest dependencies
```powershell
npm install
```

### Step 2: Create your `.env` file

Create a file named `.env` in the project root with:

```env
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=license_management_db
```

### Step 3: Create MySQL Database

Open MySQL Workbench or phpMyAdmin and run:
```sql
CREATE DATABASE license_management_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 4: Run the SQL Setup Script

1. Open `DATABASE_SETUP_GUIDE.md`
2. Copy the **Complete SQL Setup Script**
3. Run it in your MySQL database

### Step 5: Start the Application

```powershell
npm run dev:full
```

You should see:
```
[0] ✅ Connected to MySQL database
[0] 🚀 Server running on http://0.0.0.0:8000
[1] ➜  Local:   http://localhost:5001/lms
```

### Step 6: Access the Application

Open your browser: `http://localhost:5001/lms`

Login with:
- Email: `rohan.bhosale@cybaemtech.com`
- Password: `password`

---

## 🎯 Why It Now Works

The `cross-env` package:
- ✅ Handles environment variables on Windows properly
- ✅ Works on Linux/macOS too (universal solution)
- ✅ Already installed as a project dependency

---

## 🔧 Troubleshooting

### Port 5000 is already in use?
No problem! Vite will automatically use port 5001 (as shown in your logs).

### Backend still not starting?
1. Check if port 8000 is free:
   ```powershell
   netstat -ano | findstr :8000
   ```
2. Kill the process if needed:
   ```powershell
   taskkill /PID <process_id> /F
   ```

### MySQL connection errors?
1. Make sure MySQL is running on your Windows machine
2. Verify credentials in `.env` file
3. Check MySQL is accepting connections on localhost

---

## ✅ Summary

Your Windows error is **completely fixed**! The backend server will now start properly on Windows, macOS, and Linux using the same command.

Just run:
```powershell
npm run dev:full
```

And you're good to go! 🚀

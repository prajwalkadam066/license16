# 🚀 LicenseHub - Enterprise License Management System

A comprehensive software license management platform for tracking, monitoring, and managing enterprise software licenses with automated expiry notifications and multi-currency support.

---

## ✅ Setup Status

### Replit (Current Environment)
- ✅ **Database Connected** - MySQL credentials configured
- ✅ **Backend Running** - Port 8000
- ✅ **Frontend Running** - Port 5000
- ⏳ **Database Tables** - Need to be created (see below)

### For Localhost Users
- 📝 See `LOCALHOST_SETUP.md` for complete local setup instructions

---

## 🎯 Quick Start

### 1. Create Database Tables

You need to run the SQL setup script to create all database tables:

1. Open your MySQL management tool (phpMyAdmin, MySQL Workbench, or cPanel)
2. Select your database
3. Open `DATABASE_SETUP_GUIDE.md`
4. Copy and run the **Complete SQL Setup Script**

This creates:
- ✅ All 10 database tables
- ✅ Default admin users
- ✅ Default currencies with exchange rates

### 2. Login to Application

**Default Credentials:**
- Email: `rohan.bhosale@cybaemtech.com`
- Password: `password`

⚠️ **Change password after first login!**

---

## 📁 Project Structure

```
├── src/                    # Frontend React application
│   ├── components/        # Reusable UI components
│   ├── pages/            # Page components
│   └── utils/            # Utility functions
├── server/                # Backend Node.js/Express server
│   └── index.ts          # Main server file
├── docs/                  # Technical documentation
├── DATABASE_SETUP_GUIDE.md   # Complete SQL setup
├── LOCALHOST_SETUP.md        # Localhost quick fix guide
├── SETUP_COMPLETE.md         # Setup completion guide
└── .env.example              # Environment variables template
```

---

## 🔧 Development Commands

### Replit (Current Environment)
```bash
# Application runs automatically
# Backend: http://0.0.0.0:8000
# Frontend: Replit webview
```

### Localhost (Windows/macOS/Linux)
```bash
# Install dependencies
npm install

# Run both frontend and backend (RECOMMENDED)
npm run dev:full

# Run backend only
npm run server

# Run frontend only
npm run dev
```

**Note for Windows users**: ✅ Now fully compatible! Uses `cross-env` for environment variables.

---

## 🌟 Key Features

- ✅ **License Tracking** - Comprehensive license purchase management
- ✅ **Multi-Currency Support** - INR, USD, EUR, GBP with automatic conversion
- ✅ **Client Management** - Track clients and their licenses
- ✅ **Vendor Management** - Complete vendor information with GST, PAN validation
- ✅ **Automated Notifications** - Email alerts for license expiry
- ✅ **Reports & Analytics** - Dashboard with license statistics
- ✅ **Role-based Access** - Admin, Accounts, and User roles

---

## 🗄️ Database Tables

1. **users** - User authentication and roles
2. **clients** - Customer/client information
3. **currencies** - Multi-currency support
4. **vendors** - Vendor/supplier details
5. **tools** - Software tools catalog
6. **license_purchases** - License tracking
7. **license_allocations** - License assignments
8. **email_notifications** - Notification history
9. **notification_settings** - User preferences
10. **license_usage_logs** - Usage tracking

---

## 🔐 Environment Variables

### Required (Already Configured in Replit):
- `MYSQL_HOST` - MySQL server address
- `MYSQL_USER` - MySQL username
- `MYSQL_PASSWORD` - MySQL password
- `MYSQL_DATABASE` - Database name

### Optional:
- `PORT` - Backend server port (default: 8000)
- `ADMIN_EMAIL` - Admin email for notifications

---

## 📚 Documentation

- **`DATABASE_SETUP_GUIDE.md`** - Complete database setup with SQL scripts
- **`LOCALHOST_SETUP.md`** - Fix localhost connection errors
- **`WINDOWS_FIX.md`** - Windows PowerShell/CMD compatibility guide ✅
- **`SETUP_COMPLETE.md`** - Setup completion checklist
- **`docs/`** - Technical documentation and fixes

---

## 🐛 Troubleshooting

### Error: 'PORT' is not recognized (Windows) ✅ FIXED
**Status**: Resolved using `cross-env` - see `WINDOWS_FIX.md`

### Error: "connect ECONNREFUSED" (Localhost)
**Fix**: Use `npm run dev:full` instead of `npm run dev`

### Error: "Database not available"
**Fix**: Configure MySQL credentials in `.env` file

### Error: "Failed to fetch" / Empty data
**Fix**: Run the SQL setup script to create database tables

### Error: Login fails
**Fix**: Ensure SQL script has been run and use default credentials

---

## 🚀 Next Steps

1. ✅ Database is connected (Replit) ✓
2. ⏳ Run SQL setup script to create tables
3. ⏳ Login with default credentials
4. ⏳ Change default passwords
5. ⏳ Start adding clients and licenses

---

## 📞 Support

For detailed setup instructions, see:
- `DATABASE_SETUP_GUIDE.md` - Database setup
- `LOCALHOST_SETUP.md` - Localhost guide  
- `SETUP_COMPLETE.md` - Completion checklist

---

## 🔒 Security Notes

- Default passwords are weak - **change immediately**
- Keep `.env` file secure and never commit to git
- Use strong passwords for production
- Enable HTTPS in production environments

---

**Built with:** React, TypeScript, Node.js, Express, MySQL, Tailwind CSS

# Email Notification System - Recent Updates

## ✅ What's New (October 13, 2025)

### 1. **7-Day Notification Support**
- Added full support for sending notifications **7 days before** license expiry
- Automatically enabled for all users (can be toggled in Settings)
- Backend, frontend, and database fully synchronized

### 2. **Email History Tracking**
- New **Email History** section in Settings page
- View all sent and failed email notifications
- Shows:
  - License details (tool name, client)
  - Notification type (45, 30, 15, 7, 5, 1, or 0 days before expiry)
  - Status (sent/failed)
  - Timestamp of when email was sent
  - Subject line

### 3. **Database Migration System**
- Automatic schema updates on server startup
- Added `notify_7_days` column to notification_settings table
- Legacy rows automatically updated with default values

### 4. **Enhanced Notification Settings UI**
All notification days are now available:
- 45 days before expiry
- 30 days before expiry
- 15 days before expiry
- **7 days before expiry** ⭐ NEW
- 5 days before expiry
- 1 day before expiry
- On expiry date (0 days)

## 🔧 How to Use

### Configure Email Notifications
1. Go to **Settings** page
2. Find **Notification Settings** section
3. Toggle **Email Notifications** ON
4. Select which notification days you want (check/uncheck boxes)
5. Set your preferred **Notification Time** (e.g., 09:00)
6. Choose your **Timezone**
7. Click **Save Settings**

### View Email History
1. Go to **Settings** page
2. Scroll to **Email History** section
3. Click to expand the history panel
4. View all sent and failed emails with details

### Test Email Sending
1. In Settings, click **Check & Send Emails Now** button
2. System will immediately check all licenses and send notifications
3. Check the Email History to see results

## ⚙️ Important Configuration

### Set Admin Email (Required)
The system needs an admin email to send notifications. Set it in your environment:

1. Go to Replit **Secrets** tab
2. Add a new secret:
   - Key: `ADMIN_EMAIL`
   - Value: your-admin-email@example.com

Without this, you'll see a warning: "Admin email not configured"

## 📊 How Automatic Emails Work

1. **Daily Scheduler** runs at your configured time (e.g., 09:00)
2. **Checks all licenses** in the database
3. **Calculates days until expiry** for each license
4. **Sends emails** if:
   - License matches a notification day you selected
   - Email hasn't been sent today for this license/day combination
5. **Logs results** in email_notifications table

## 🔄 Real-Time Updates

When you change notification settings:
- Email scheduler **automatically restarts** with new time
- New notification days are **immediately active**
- No manual restart required!

## 📝 Email Recipients

Each notification is sent to:
- **Admin** (configured via ADMIN_EMAIL)
- **Client email** (if available in license record)
- **Vendor email** (if available in vendor record)

## 🚀 Next Steps

1. ✅ Set ADMIN_EMAIL environment variable
2. ✅ Configure your notification schedule in Settings
3. ✅ Test the system with "Check & Send Emails Now"
4. ✅ Monitor Email History for delivery status

---

**Note:** The system is fully automated. Once configured, emails will send automatically at your chosen time every day. No manual button clicks required for daily operations!

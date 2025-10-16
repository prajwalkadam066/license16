# 📧 Automatic Email Notification System - Complete Guide

## ✅ System Status

Your automatic email notification system is now **FULLY OPERATIONAL**! 

### What's Working:

- ✅ **Automatic email sending** - No button clicking required!
- ✅ **Custom time configuration** - Admin sets the send time in Settings
- ✅ **Daily schedule** - Emails sent automatically every day
- ✅ **Immediate check on startup** - Emails sent when server starts
- ✅ **Both Admin & Client emails** - Everyone gets notified

---

## 🎯 How It Works

### 1. **Server Startup (Immediate Check)**
When your server starts:
- Waits 3 seconds for full startup
- Automatically checks all licenses for upcoming expiry
- Sends emails to admin and clients based on notification settings
- Example: "Checked 2 licenses, sent 2 emails"

### 2. **Daily Automatic Schedule**
Every day at your configured time:
- System automatically wakes up
- Checks all licenses for expiry dates
- Sends notifications based on your settings (45, 30, 15, 5, 1, or 0 days before)
- Tracks sent emails to prevent duplicates

### 3. **Smart Duplicate Prevention**
- Won't send the same notification twice in one day
- Logs all sent emails in `email_notifications` table
- Example: "Already sent 0_days notification for license XXX today"

---

## ⚙️ How to Configure Email Send Time

### Step-by-Step Instructions:

1. **Login to Your Application**
   - Use your admin credentials

2. **Navigate to Settings**
   - Click on "Settings" in the menu
   - Or go directly to `/lms/settings`

3. **Find "Notification Time" Section**
   - Scroll down to see the time picker
   - Default is set to 09:00 (9:00 AM)

4. **Select Your Preferred Time**
   - Click on the time input field
   - Choose your desired time (e.g., 10:00 AM, 2:00 PM, 8:00 PM)
   - You can set any time that works best for you!

5. **Click "Save Settings"**
   - The system will save your new time
   - **AUTOMATICALLY restarts the email scheduler** with your new time
   - You'll see a success message

6. **Verification**
   - Check the server logs to confirm
   - You'll see: `🔄 Restarting email scheduler with new time: XX:XX`
   - Followed by: `✅ Email scheduler restarted with time: XX:XX`

---

## 📊 Notification Settings Options

### Email Notifications Toggle
- **ON**: Enables automatic email sending
- **OFF**: Disables all email notifications

### Notification Days (When to Send)
Choose which days before expiry to receive notifications:
- ☑️ **45 days before** - Early warning
- ☑️ **30 days before** - Month notice
- ☑️ **15 days before** - Two weeks warning
- ☑️ **5 days before** - Urgent notice
- ☑️ **1 day before** - Final warning
- ☑️ **On expiry date** - Expiration day alert

### Notification Time
- **Default**: 09:00 (9:00 AM)
- **Customizable**: Any time of day
- **Applies**: To daily automatic checks

### Timezone
- **Default**: UTC
- **Configurable**: Set your local timezone

---

## 📬 Email Recipients

### Admin Emails (You)
- **Recipient**: Your configured `ADMIN_EMAIL` 
- **Content**: All expiring licenses information
- **Format**: Professional HTML email with license details

### Client Emails
- **Recipient**: Email from `clients` table
- **Content**: Their specific license information only
- **Format**: Professional HTML email with their license details

---

## 🔍 Email Content Details

Each email includes:
- 🔴 **Urgency indicator** (color-coded by days until expiry)
- 📋 **License details**: Tool name, client, expiry date, quantity
- ⏰ **Days until expiry**: Clear indication of time remaining
- 📊 **Action required**: Reminder to renew before expiration

### Email Subject Examples:
- `🔴 URGENT: License Expiring Today - Tool Name`
- `⏰ License Expiring in 5 days - Tool Name`
- `⏰ License Expiring in 30 days - Tool Name`

---

## 🚀 Testing the System

### Method 1: Manual Test (Button)
1. Go to Settings page
2. Click **"Check & Send Emails Now"** button
3. Emails will be sent immediately
4. Check your email inbox

### Method 2: Automatic Test (Time-based)
1. Set notification time to 2-3 minutes from now
2. Click "Save Settings"
3. Wait for the scheduled time
4. Check server logs and email inbox

### Method 3: Server Restart Test
1. Restart your server
2. Wait 3 seconds
3. Check server logs: "Running scheduled license expiry check"
4. Verify emails were sent

---

## 📝 Server Logs to Monitor

### On Startup:
```
📧 Email notification scheduler started
⏰ Daily checks will run at XX:XX
🚀 Running immediate license expiry check on startup...
📅 Next email check scheduled for: [DATE TIME]
📧 Email notification scheduler initialized with time: XX:XX
```

### During Email Check:
```
🔍 Running scheduled license expiry check at [DATE TIME]
✅ Email sent to admin@example.com for license XXX
✅ Email sent to client@example.com for license XXX
✅ Email check completed: Checked X licenses, sent X emails
   📧 Emails sent: X
```

### When Time Changes:
```
🔄 Restarting email scheduler with new time: XX:XX
✅ Email scheduler restarted with time: XX:XX
```

---

## ⚠️ Important Notes

### No Button Clicking Required!
- The system is **FULLY AUTOMATIC**
- The "Check & Send Emails Now" button is only for **manual testing**
- Regular daily emails happen automatically without any action

### Email Sending Times:
1. **On server startup** - Immediate check after 3 seconds
2. **Daily at configured time** - Your custom time from settings
3. **Manual button click** - Only when you test manually

### Database Tracking:
- All sent emails are logged in `email_notifications` table
- Includes: recipient, license, notification type, status, timestamp
- Used for duplicate prevention and audit trail

---

## 🎯 Example Usage Scenario

**Scenario**: You want emails sent every day at 10:00 AM

**Steps**:
1. Login to your application
2. Go to Settings → Notification Settings
3. Set notification time to `10:00`
4. Select notification days: `☑️ 30 days, ☑️ 15 days, ☑️ 5 days, ☑️ 1 day, ☑️ On expiry`
5. Click "Save Settings"

**Result**:
- Every day at 10:00 AM, the system automatically:
  - Checks all licenses
  - Finds licenses expiring in 30, 15, 5, 1, or 0 days
  - Sends emails to admin and respective clients
  - Logs all activities

**No further action needed!** 🎉

---

## 🔧 Technical Details

### Components:
- **EmailScheduler** (`server/emailScheduler.ts`) - Handles scheduling
- **API Endpoint** (`/api/notifications/check-expiring-licenses`) - Email logic
- **Database Table** (`notification_settings`) - Stores configuration
- **ReplitMail** - Email delivery service

### How Time Changes Work:
1. Admin changes time in Settings UI
2. Frontend sends new time to backend API
3. Backend saves to `notification_settings` table
4. Backend stops current scheduler
5. Backend creates new scheduler with new time
6. Scheduler starts with updated schedule

### Restart on Settings Change:
The system intelligently restarts the scheduler whenever you save settings with a new time, ensuring your changes take effect immediately!

---

## ✅ Success Checklist

Your automatic email system is working if you see:

- ✅ Server logs show scheduler initialization
- ✅ Emails sent on server startup (check logs)
- ✅ Time changes trigger scheduler restart
- ✅ Daily emails sent at configured time
- ✅ Admin receives all license notifications
- ✅ Clients receive their specific license notifications
- ✅ No duplicate emails sent in same day

---

## 🎉 Summary

**You now have a fully automatic email notification system!**

- **Set it once** in Settings
- **Forget about it** - runs automatically
- **Receive timely alerts** - never miss a license renewal
- **Keep clients informed** - they get notified too

**No manual button clicking required!** The system is truly automatic. 🚀

---

## 📞 Need Help?

Check the server logs for detailed information about email sending activities. All operations are logged with clear emoji indicators for easy monitoring.

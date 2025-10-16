# License Expiry Email Notifications System

## Overview
This system provides automated email notifications for license expirations in the LicenseHub Enterprise Management System.

## Features

### Notification Triggers
- **30 days before expiry**: Early warning notification
- **15 days before expiry**: Planning reminder
- **5 days before expiry**: Urgent reminder
- **1 day before expiry**: Critical reminder
- **Same day (0 days)**: Expires today notification
- **After expiry**: One-time expired notification

### Email Content
- Professional HTML email template
- License details (tool name, vendor, version)
- Expiration date in DD-MM-YYYY format
- Days remaining calculation
- Cost information in both INR (₹) and USD ($)
- "Renew Now" button linking to license management page
- Urgency-based styling and messaging

### Database Schema

#### email_notifications table
- `id`: UUID primary key
- `user_id`: Reference to auth.users
- `license_id`: Reference to license_purchases
- `notification_type`: Type of notification (30_days, 15_days, etc.)
- `email_sent_at`: Timestamp when email was sent
- `email_status`: Status (sent, failed, pending)
- `email_subject`: Email subject line
- `email_body`: Full email HTML content
- `created_at`: Record creation timestamp

#### notification_settings table
- `id`: UUID primary key
- `user_id`: Reference to auth.users (unique)
- `email_notifications_enabled`: Boolean toggle
- `notification_days`: Array of notification trigger days
- `notification_time`: Preferred notification time
- `timezone`: User's timezone
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp

## Implementation

### Edge Functions

#### license-expiry-notifications
Main notification processing function that:
1. Fetches licenses requiring notifications using `get_licenses_for_notification()`
2. Generates appropriate email content based on notification type
3. Sends emails (currently mocked, ready for email service integration)
4. Logs all notifications in the database

#### schedule-notifications
Cron job trigger function that:
1. Calls the main notification function daily
2. Designed to be triggered by external cron services
3. Returns execution status and results

### Database Functions

#### get_licenses_for_notification()
PostgreSQL function that:
1. Calculates days until expiration for all licenses
2. Identifies licenses requiring notifications
3. Prevents duplicate notifications on the same day
4. Returns comprehensive license and user information

#### days_until_expiration()
Utility function to calculate days between expiration date and current date.

### Frontend Components

#### NotificationSettings
React component providing:
- Toggle for email notifications
- Customizable notification schedule
- Time and timezone preferences
- Real-time settings management

#### Settings Page
New settings page accessible from the main navigation.

## Setup Instructions

### 1. Database Migration
Run the migration file to create the necessary tables and functions:
```sql
-- Execute: supabase/migrations/create_notifications_system.sql
```

### 2. Deploy Edge Functions
Deploy the notification functions to Supabase:
```bash
supabase functions deploy license-expiry-notifications
supabase functions deploy schedule-notifications
```

### 3. Configure Cron Job
Set up a daily cron job to trigger notifications at 9:00 AM:

**Option A: External Cron Service (Recommended)**
Use services like:
- GitHub Actions with scheduled workflows
- Vercel Cron Jobs
- AWS EventBridge
- Google Cloud Scheduler

**Option B: Server Cron Job**
```bash
# Add to crontab (crontab -e)
0 9 * * * curl -X POST "YOUR_SUPABASE_URL/functions/v1/schedule-notifications" -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

### 4. Email Service Integration
Replace the mock email function in `license-expiry-notifications/index.ts` with your preferred email service:

**SendGrid Example:**
```typescript
import sgMail from 'npm:@sendgrid/mail@7';

sgMail.setApiKey(Deno.env.get('SENDGRID_API_KEY') ?? '');

async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  try {
    await sgMail.send({
      to,
      from: 'noreply@yourdomain.com',
      subject,
      html: body,
    });
    return true;
  } catch (error) {
    console.error('SendGrid error:', error);
    return false;
  }
}
```

**Other Supported Services:**
- AWS SES
- Resend
- Postmark
- Mailgun

### 5. Environment Variables
Add to your Supabase project settings:
```
SENDGRID_API_KEY=your_sendgrid_api_key
# or other email service credentials
```

## Usage

### User Settings
1. Navigate to Settings page
2. Configure notification preferences:
   - Enable/disable email notifications
   - Select notification days (30, 15, 5, 1, 0 days before expiry)
   - Set preferred notification time
   - Choose timezone

### Automatic Operation
Once configured, the system will:
1. Run daily at the specified time
2. Check all licenses for expiry dates
3. Send appropriate notifications
4. Log all activities
5. Prevent duplicate notifications

### Monitoring
- Check `email_notifications` table for delivery logs
- Monitor edge function logs in Supabase dashboard
- Review notification settings for each user

## Customization

### Email Templates
Modify the `generateEmailContent()` function to customize:
- Email styling and branding
- Content structure
- Urgency levels and colors
- Call-to-action buttons

### Notification Schedule
Adjust trigger days in:
- Database default values
- Frontend component options
- User settings interface

### Timezone Support
The system supports multiple timezones through the `notification_settings` table.

## Security

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own notifications and settings
- System functions use SECURITY DEFINER for controlled access

### Data Privacy
- Email content is logged for debugging but can be disabled
- User preferences are encrypted in transit
- No sensitive license data is exposed in logs

## Troubleshooting

### Common Issues

1. **Notifications not sending**
   - Check edge function logs
   - Verify email service credentials
   - Confirm cron job is running

2. **Duplicate notifications**
   - Check `get_licenses_for_notification()` function
   - Verify date calculations
   - Review notification logs

3. **Missing notifications**
   - Confirm user has notification settings enabled
   - Check license expiration dates
   - Verify cron job schedule

### Debugging
- Enable detailed logging in edge functions
- Monitor Supabase function execution logs
- Check email service delivery reports

## Future Enhancements

### Planned Features
- SMS notifications
- Slack/Teams integration
- Custom notification templates
- Bulk license management
- Advanced reporting and analytics
- Multi-language support

### Integration Opportunities
- Calendar integration (Google Calendar, Outlook)
- Procurement system integration
- Budget management alerts
- Vendor communication automation

## Support
For technical support or feature requests, please refer to the main project documentation or contact the development team.
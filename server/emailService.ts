import { sendEmail } from '../src/utils/replitmail';
import fetch from 'node-fetch';

interface License {
  id: string;
  tool_name: string;
  vendor: string;
  serial_no: string;
  expiration_date: string;
  cost_per_user: string;
  quantity: number;
  total_cost: string;
  total_cost_inr: string;
  currency_code: string;
  client_name: string;
  client_email: string;
  purchase_date: string;
}

interface NotificationSettings {
  email_notifications_enabled: boolean;
  notification_days: number[];
  notification_time: string;
  timezone: string;
}

export class EmailService {
  private apiBaseUrl: string;
  private adminEmail: string;

  constructor(apiBaseUrl: string = 'http://localhost:8000', adminEmail: string = 'admin@company.com') {
    this.apiBaseUrl = apiBaseUrl;
    this.adminEmail = adminEmail;
  }

  async checkAndSendNotifications(): Promise<{
    success: boolean;
    emailsSent: number;
    errors: string[];
    message: string;
  }> {
    console.log('🔍 Checking for expiring licenses...');
    
    try {
      // Get notification settings
      const settings = await this.getNotificationSettings();
      
      if (!settings.email_notifications_enabled) {
        console.log('📧 Email notifications are disabled');
        return {
          success: true,
          emailsSent: 0,
          errors: [],
          message: 'Email notifications are disabled'
        };
      }

      // Get licenses
      const licenses = await this.getLicenses();
      
      if (!licenses || licenses.length === 0) {
        console.log('📝 No licenses found');
        return {
          success: true,
          emailsSent: 0,
          errors: [],
          message: 'No licenses to check'
        };
      }

      console.log(`📊 Found ${licenses.length} licenses to check`);

      // Check each license and send notifications
      let emailsSent = 0;
      const errors: string[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const license of licenses) {
        try {
          const expiryDate = new Date(license.expiration_date);
          expiryDate.setHours(0, 0, 0, 0);
          
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          // Check if we should send notification for this license
          if (settings.notification_days.includes(daysUntilExpiry)) {
            console.log(`📧 Sending notification for ${license.tool_name} (${daysUntilExpiry} days until expiry)`);
            
            // Check if already sent today
            const alreadySent = await this.checkIfNotificationSent(license.id, daysUntilExpiry);
            
            if (!alreadySent) {
              await this.sendExpiryNotification(license, daysUntilExpiry);
              emailsSent++;
            } else {
              console.log(`⏭️  Notification already sent for ${license.tool_name} today`);
            }
          }
        } catch (error) {
          const errorMsg = `Failed to process license ${license.tool_name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`❌ ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      console.log(`✅ Email check completed: Sent ${emailsSent} notifications`);

      return {
        success: true,
        emailsSent,
        errors,
        message: `Checked ${licenses.length} licenses, sent ${emailsSent} notifications`
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Email check failed: ${errorMsg}`);
      return {
        success: false,
        emailsSent: 0,
        errors: [errorMsg],
        message: 'Email check failed'
      };
    }
  }

  private async getNotificationSettings(): Promise<NotificationSettings> {
    const response = await fetch(`${this.apiBaseUrl}/api/notification-settings`);
    const data = await response.json() as any;
    
    if (data.success && data.data) {
      return data.data;
    }
    
    // Return defaults if settings not found
    return {
      email_notifications_enabled: true,
      notification_days: [30, 15, 7, 1, 0],
      notification_time: '09:00',
      timezone: 'UTC'
    };
  }

  private async getLicenses(): Promise<License[]> {
    const response = await fetch(`${this.apiBaseUrl}/api/licenses`);
    const data = await response.json() as any;
    
    if (data.success && data.data) {
      return data.data;
    }
    
    return [];
  }

  private async checkIfNotificationSent(licenseId: string, daysUntilExpiry: number): Promise<boolean> {
    try {
      const notificationType = this.getNotificationType(daysUntilExpiry);
      const today = new Date().toISOString().split('T')[0];
      
      const response = await fetch(
        `${this.apiBaseUrl}/api/notifications/check-sent?license_id=${licenseId}&notification_type=${notificationType}&date=${today}`
      );
      
      const data = await response.json() as any;
      return data.sent === true;
    } catch (error) {
      console.error('Error checking notification status:', error);
      return false; // If we can't check, allow sending to be safe
    }
  }

  private async sendExpiryNotification(license: License, daysUntilExpiry: number): Promise<void> {
    const urgencyLevel = this.getUrgencyLevel(daysUntilExpiry);
    const notificationType = this.getNotificationType(daysUntilExpiry);
    
    // Generate email content
    const subject = this.generateSubject(license, daysUntilExpiry);
    const htmlBody = this.generateHtmlEmail(license, daysUntilExpiry, urgencyLevel);
    const textBody = this.generateTextEmail(license, daysUntilExpiry);

    const recipients: string[] = [];
    
    // Add client email if available
    if (license.client_email && this.isValidEmail(license.client_email)) {
      recipients.push(license.client_email);
    }
    
    // Add admin email
    if (this.isValidEmail(this.adminEmail)) {
      recipients.push(this.adminEmail);
    }

    if (recipients.length === 0) {
      throw new Error('No valid email recipients found');
    }

    // Send email using Replit Mail
    const result = await sendEmail({
      to: recipients,
      subject: subject,
      html: htmlBody,
      text: textBody
    });

    console.log(`✅ Email sent successfully to ${recipients.join(', ')}`);
    console.log(`   Message ID: ${result.messageId}`);

    // Log notification in database
    await this.logNotification(license.id, notificationType, recipients, subject);
  }

  private async logNotification(licenseId: string, notificationType: string, recipients: string[], subject: string): Promise<void> {
    try {
      await fetch(`${this.apiBaseUrl}/api/notifications/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          license_id: licenseId,
          notification_type: notificationType,
          recipients: recipients.join(','),
          email_subject: subject,
          email_status: 'sent',
          email_sent_at: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to log notification:', error);
    }
  }

  private getNotificationType(days: number): string {
    if (days < 0) return 'expired';
    if (days === 0) return '0_days';
    if (days === 1) return '1_day';
    return `${days}_days`;
  }

  private getUrgencyLevel(days: number): string {
    if (days <= 0) return 'critical';
    if (days <= 5) return 'high';
    if (days <= 15) return 'medium';
    return 'low';
  }

  private generateSubject(license: License, daysUntilExpiry: number): string {
    if (daysUntilExpiry <= 0) {
      return `🚨 URGENT: ${license.tool_name} License Expired`;
    } else if (daysUntilExpiry === 1) {
      return `⚠️ CRITICAL: ${license.tool_name} License Expires Tomorrow`;
    } else {
      return `📋 ${license.tool_name} License Expires in ${daysUntilExpiry} Days`;
    }
  }

  private generateHtmlEmail(license: License, daysUntilExpiry: number, urgencyLevel: string): string {
    const urgencyColors = {
      critical: '#dc2626',
      high: '#ea580c',
      medium: '#f59e0b',
      low: '#3b82f6'
    };

    const color = urgencyColors[urgencyLevel as keyof typeof urgencyColors];
    const expiryDate = new Date(license.expiration_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: ${color}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">License Expiration Notice</h1>
  </div>
  
  <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h2 style="color: ${color}; margin-top: 0;">${daysUntilExpiry <= 0 ? '⚠️ License Has Expired' : `⏰ ${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'Day' : 'Days'} Until Expiration`}</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; width: 40%;">Software:</td>
          <td style="padding: 8px 0;">${license.tool_name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Vendor:</td>
          <td style="padding: 8px 0;">${license.vendor}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Serial Number:</td>
          <td style="padding: 8px 0;">${license.serial_no}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Client:</td>
          <td style="padding: 8px 0;">${license.client_name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Number of Licenses:</td>
          <td style="padding: 8px 0;">${license.quantity}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Expiration Date:</td>
          <td style="padding: 8px 0; color: ${color}; font-weight: bold;">${expiryDate}</td>
        </tr>
      </table>
    </div>

    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
      <p style="margin: 0; font-weight: bold;">⚠️ Action Required</p>
      <p style="margin: 10px 0 0 0;">Please renew this license to avoid service interruption.</p>
    </div>

    <div style="text-align: center; color: #6b7280; font-size: 14px;">
      <p>This is an automated notification from your License Management System.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  private generateTextEmail(license: License, daysUntilExpiry: number): string {
    const expiryDate = new Date(license.expiration_date).toLocaleDateString();
    
    return `
LICENSE EXPIRATION NOTICE

${daysUntilExpiry <= 0 ? 'LICENSE HAS EXPIRED' : `${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'DAY' : 'DAYS'} UNTIL EXPIRATION`}

Software: ${license.tool_name}
Vendor: ${license.vendor}
Serial Number: ${license.serial_no}
Client: ${license.client_name}
Number of Licenses: ${license.quantity}
Expiration Date: ${expiryDate}

ACTION REQUIRED:
Please renew this license to avoid service interruption.

---
This is an automated notification from your License Management System.
    `.trim();
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

import { Router, Request, Response } from 'express';
import { EmailService } from '../emailService';

const router = Router();

// Set admin email (can be configured via environment variable)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@company.com';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

// Create email service instance
const emailService = new EmailService(API_BASE_URL, ADMIN_EMAIL);

// POST /api/notifications/check-expiring-licenses
// Check for expiring licenses and send email notifications
router.post('/check-expiring-licenses', async (req: Request, res: Response) => {
  try {
    console.log('📧 Manual email notification check triggered');
    
    const result = await emailService.checkAndSendNotifications();
    
    res.json({
      success: result.success,
      message: result.message,
      emailsSent: result.emailsSent,
      errors: result.errors,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Email notification check failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to check and send email notifications',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/notifications/test-email
// Test email functionality (for debugging)
router.get('/test-email', async (req: Request, res: Response) => {
  try {
    const testEmail = (req.query.email as string) || ADMIN_EMAIL;
    
    if (!testEmail) {
      return res.status(400).json({
        success: false,
        error: 'No email address provided'
      });
    }

    const { sendEmail } = await import('../../src/utils/replitmail');
    
    const result = await sendEmail({
      to: testEmail,
      subject: 'Test Email from License Management System',
      html: `
        <h2>Test Email</h2>
        <p>This is a test email from your License Management System.</p>
        <p>If you received this, email notifications are working correctly! ✅</p>
      `,
      text: 'Test Email\n\nThis is a test email from your License Management System.\nIf you received this, email notifications are working correctly!'
    });

    res.json({
      success: true,
      message: 'Test email sent successfully',
      recipients: result.accepted,
      messageId: result.messageId
    });
  } catch (error) {
    console.error('Test email failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to send test email',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

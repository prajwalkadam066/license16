import fetch from 'node-fetch';

export class EmailScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly checkInterval: number = 24 * 60 * 60 * 1000;
  private readonly checkTime: string;
  private apiBaseUrl: string;

  constructor(checkTime: string = '09:00', apiBaseUrl: string = 'http://localhost:8000') {
    this.checkTime = checkTime;
    this.apiBaseUrl = apiBaseUrl;
  }

  start(runImmediately: boolean = false): void {
    if (this.intervalId) {
      console.log('⏰ Email scheduler is already running');
      return;
    }

    console.log(`📧 Email notification scheduler started`);
    console.log(`⏰ Daily checks will run at ${this.checkTime}`);
    
    // Run immediate check on startup if requested
    if (runImmediately) {
      console.log('🚀 Running immediate license expiry check on startup...');
      setTimeout(() => {
        this.checkExpiringLicenses();
      }, 3000); // Wait 3 seconds for server to be fully ready
    }
    
    this.scheduleNextCheck();

    const checkDaily = () => {
      this.scheduleNextCheck();
    };

    this.intervalId = setInterval(checkDaily, this.checkInterval);
  }

  private scheduleNextCheck(): void {
    const now = new Date();
    const [hours, minutes] = this.checkTime.split(':').map(Number);
    
    const scheduledTime = new Date(now);
    scheduledTime.setHours(hours, minutes, 0, 0);

    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const delay = scheduledTime.getTime() - now.getTime();

    setTimeout(() => {
      this.checkExpiringLicenses();
    }, delay);

    console.log(`📅 Next email check scheduled for: ${scheduledTime.toLocaleString()}`);
  }

  private async checkExpiringLicenses(): Promise<void> {
    console.log(`\n🔍 Running scheduled license expiry check at ${new Date().toLocaleString()}`);
    
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/notifications/check-expiring-licenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Email check failed: ${response.status} - ${errorText}`);
        return;
      }

      const result = await response.json() as any;
      
      if (result.success) {
        console.log(`✅ Email check completed: ${result.message}`);
        console.log(`   📧 Emails sent: ${result.emailsSent || 0}`);
        if (result.emailsFailed) {
          console.log(`   ❌ Emails failed: ${result.emailsFailed}`);
        }
      } else {
        console.error(`❌ Email check error: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error during scheduled email check:', error instanceof Error ? error.message : error);
    }
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏹️  Email scheduler stopped');
    }
  }

  async runManualCheck(): Promise<void> {
    console.log('🔍 Running manual license expiry check...');
    await this.checkExpiringLicenses();
  }
}

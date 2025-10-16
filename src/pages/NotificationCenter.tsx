import { useState, useEffect } from 'react';
import { Mail, Send, Clock, AlertCircle, CheckCircle, XCircle, Settings, Save } from 'lucide-react';
import { getApiBaseUrl } from '../utils/api';

interface NotificationResult {
  success: boolean;
  message: string;
  data?: {
    total_emails_sent: number;
    notifications_sent: number;
    errors_count: number;
    execution_time: string;
    notifications: Array<{
      license_id: string;
      serial_no: string;
      tool_name: string;
      days_until_expiry: number;
      emails_sent: number;
      recipients: Array<{
        email: string;
        name: string;
        type: string;
        status: string;
      }>;
    }>;
    errors: string[];
  };
  error?: string;
}

interface NotificationSettings {
  email_notifications_enabled: boolean;
  notification_days: number[];
  notification_time: string;
  timezone: string;
}

function NotificationCenter() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NotificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  
  // Notification settings state
  const [settings, setSettings] = useState<NotificationSettings>({
    email_notifications_enabled: true,
    notification_days: [30, 15, 7, 1, 0],
    notification_time: '09:00',
    timezone: 'Asia/Kolkata'
  });

  // Load notification settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/notification-settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setSettings({
            email_notifications_enabled: data.data.email_notifications_enabled ?? true,
            notification_days: (data.data.notification_days || [30, 15, 7, 1, 0]).filter((d: number) => d >= 0 && d <= 365),
            notification_time: data.data.notification_time || '09:00',
            timezone: data.data.timezone || 'Asia/Kolkata'
          });
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const saveSettings = async () => {
    setSettingsLoading(true);
    setError(null);
    setSettingsSaved(false);

    try {
      const response = await fetch(`${getApiBaseUrl()}/notification-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (data.success) {
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 3000);
      } else {
        setError(data.error || 'Failed to save settings');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSettingsLoading(false);
    }
  };

  const toggleNotificationDay = (day: number) => {
    setSettings(prev => ({
      ...prev,
      notification_days: prev.notification_days.includes(day)
        ? prev.notification_days.filter(d => d !== day)
        : [...prev.notification_days, day].sort((a, b) => b - a)
    }));
  };

  const checkAndSendNotifications = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${getApiBaseUrl()}/license_notifications.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setResult(data);

      if (!data.success) {
        setError(data.error || 'Failed to send notifications');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send notifications');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notification Center</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure automatic email notifications for license expiry
          </p>
        </div>
        
        <button
          onClick={checkAndSendNotifications}
          disabled={loading}
          className="flex items-center bg-blue-600 dark:bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              <Send className="h-5 w-5 mr-2" />
              Send Now (Manual)
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg flex items-start">
          <XCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold">Error</h3>
            <p>{error}</p>
          </div>
        </div>
      )}

      {settingsSaved && (
        <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-4 rounded-lg flex items-start">
          <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold">Settings Saved!</h3>
            <p>Email scheduler has been updated with new settings.</p>
          </div>
        </div>
      )}

      {/* Automatic Email Settings */}
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm overflow-hidden">
        <div 
          className="p-6 border-b border-gray-200 dark:border-dark-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700"
          onClick={() => setShowSettings(!showSettings)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Automatic Email Settings
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Configure when and how often emails are sent automatically
                </p>
              </div>
            </div>
            <div className="text-gray-400">
              {showSettings ? '▼' : '▶'}
            </div>
          </div>
        </div>

        {showSettings && (
          <div className="p-6 space-y-6">
            {/* Enable/Disable Email Notifications */}
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Enable Automatic Email Notifications
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Turn on to send emails automatically at the scheduled time
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.email_notifications_enabled}
                  onChange={(e) => setSettings({ ...settings, email_notifications_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Notification Days */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Send Notifications Before Expiry
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Select when to send reminder emails before license expiration
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[30, 15, 7, 1, 0].map((day) => (
                  <label
                    key={day}
                    className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      settings.notification_days.includes(day)
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-dark-600 hover:border-gray-300 dark:hover:border-dark-500'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={settings.notification_days.includes(day)}
                      onChange={() => toggleNotificationDay(day)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                      {day === 0 ? 'Today' : `${day} days`}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notification Time */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Daily Email Time
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Set what time emails should be sent automatically each day
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-gray-50 dark:bg-dark-700 p-3 rounded-lg flex-1 max-w-xs">
                  <Clock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <input
                    type="time"
                    value={settings.notification_time}
                    onChange={(e) => setSettings({ ...settings, notification_time: e.target.value })}
                    className="bg-transparent border-none text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({settings.timezone})
                  </span>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-dark-600">
              <button
                onClick={saveSettings}
                disabled={settingsLoading}
                className="flex items-center bg-green-600 dark:bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {settingsLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {result && (
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-dark-600">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Notification Results
              </h2>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Clock className="h-4 w-4 mr-1" />
                {result.data?.execution_time}
              </div>
            </div>
          </div>

          <div className="p-6">
            {result.success ? (
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center">
                      <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400 mr-3" />
                      <div>
                        <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                          {result.data?.total_emails_sent || 0}
                        </p>
                        <p className="text-green-700 dark:text-green-300">Emails Sent</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center">
                      <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
                      <div>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                          {result.data?.notifications_sent || 0}
                        </p>
                        <p className="text-blue-700 dark:text-blue-300">Notifications</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex items-center">
                      <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400 mr-3" />
                      <div>
                        <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                          {result.data?.errors_count || 0}
                        </p>
                        <p className="text-red-700 dark:text-red-300">Errors</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notifications Details */}
                {result.data?.notifications && result.data.notifications.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Sent Notifications
                    </h3>
                    <div className="space-y-4">
                      {result.data.notifications.map((notification, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-dark-700 p-4 rounded-lg border border-gray-200 dark:border-dark-600">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {notification.tool_name}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Serial: {notification.serial_no}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                notification.days_until_expiry <= 0 
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                  : notification.days_until_expiry <= 5
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                              }`}>
                                {notification.days_until_expiry <= 0 
                                  ? 'Expired' 
                                  : `${notification.days_until_expiry} days left`
                                }
                              </span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Emails Sent:</span>
                              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                {notification.emails_sent}
                              </span>
                            </div>
                          </div>

                          {notification.recipients && notification.recipients.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recipients:</p>
                              <div className="space-y-1">
                                {notification.recipients.map((recipient, recipientIndex) => (
                                  <div key={recipientIndex} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">
                                      {recipient.email} ({recipient.type})
                                    </span>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                      recipient.status === 'sent'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                    }`}>
                                      {recipient.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Errors */}
                {result.data?.errors && result.data.errors.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-4">
                      Errors
                    </h3>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <ul className="list-disc list-inside space-y-1">
                        {result.data.errors.map((error, index) => (
                          <li key={index} className="text-red-700 dark:text-red-400 text-sm">
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* No notifications case */}
                {(!result.data?.notifications || result.data.notifications.length === 0) && 
                 (!result.data?.errors || result.data.errors.length === 0) && (
                  <div className="text-center py-8">
                    <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No license expiration notifications needed at this time.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-600 dark:text-red-400">
                  {result.error || 'Failed to process notifications'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Information Panel */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          Automatic Email System Active
        </h3>
        <div className="space-y-2 text-green-800 dark:text-green-200">
          <p>✅ <strong>Emails are sent automatically</strong> every day at <strong>{settings.notification_time}</strong></p>
          <p>✅ Notifications are sent for licenses expiring in: <strong>{settings.notification_days.map(d => d === 0 ? 'Today' : `${d} days`).join(', ')}</strong></p>
          <p>✅ Both clients and admin receive notifications automatically</p>
          <p>✅ Each notification is sent only once per day to avoid spam</p>
          <p>✅ All notification activities are logged in the database</p>
          <p className="mt-4 text-sm italic">💡 The "Send Now (Manual)" button above is only for testing - you don't need to click it!</p>
        </div>
      </div>
    </div>
  );
}

export default NotificationCenter;

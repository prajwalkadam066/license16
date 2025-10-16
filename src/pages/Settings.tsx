import { Settings as SettingsIcon } from 'lucide-react';
import NotificationSettings from '../components/NotificationSettings';

function Settings() {
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <SettingsIcon className="h-8 w-8 text-blue-600 mr-3" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
      </div>

      <div className="grid gap-6">
        <NotificationSettings />
      </div>
    </div>
  );
}

export default Settings;
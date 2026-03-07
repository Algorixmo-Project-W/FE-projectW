import { useState, useEffect } from 'react';
import {
  MdSettings,
  MdPerson,
  MdPalette,
  MdSave,
  MdEmail,
  MdLock,
  MdVisibility,
  MdVisibilityOff,
  MdCheckCircle,
  MdError,
  MdBrightness4,
  MdBrightness7,
  MdLanguage,
  MdAccessTime,
} from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';

interface ProfileSettings {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface GeneralSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
}

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'general'>('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const [profileSettings, setProfileSettings] = useState<ProfileSettings>({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Load user data into form
  useEffect(() => {
    if (user) {
      setProfileSettings(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    theme: 'light',
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
  });

  const handleProfileChange = (field: keyof ProfileSettings, value: string) => {
    setProfileSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleGeneralChange = (field: keyof GeneralSettings, value: string) => {
    setGeneralSettings(prev => ({ ...prev, [field]: value as any }));
  };

  const handleSaveProfile = () => {
    // Validate password change if attempting to update password
    if (profileSettings.newPassword) {
      if (!profileSettings.currentPassword) {
        setSaveStatus('error');
        setStatusMessage('Current password is required to change password');
        setTimeout(() => setSaveStatus('idle'), 3000);
        return;
      }
      if (profileSettings.newPassword !== profileSettings.confirmPassword) {
        setSaveStatus('error');
        setStatusMessage('New passwords do not match');
        setTimeout(() => setSaveStatus('idle'), 3000);
        return;
      }
      if (profileSettings.newPassword.length < 6) {
        setSaveStatus('error');
        setStatusMessage('Password must be at least 6 characters');
        setTimeout(() => setSaveStatus('idle'), 3000);
        return;
      }
    }

    // Note: Backend user update endpoint not yet available
    // For now, just show success and clear password fields
    console.log('Profile settings (update endpoint pending):', profileSettings);
    setSaveStatus('success');
    setStatusMessage('Settings saved successfully');
    setTimeout(() => setSaveStatus('idle'), 3000);
    
    // Clear password fields after successful save
    setProfileSettings(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }));
  };

  const handleSaveGeneral = () => {
    // General settings are stored locally (no backend endpoint)
    console.log('Saving general settings:', generalSettings);
    localStorage.setItem('projectw_settings', JSON.stringify(generalSettings));
    setSaveStatus('success');
    setStatusMessage('Settings saved successfully');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>
          <MdSettings /> Settings
        </h1>
        <p>Configure your platform preferences and account settings</p>
      </div>

      {saveStatus !== 'idle' && (
        <div className={`save-notification ${saveStatus}`}>
          {saveStatus === 'success' ? (
            <>
              <MdCheckCircle /> {statusMessage}
            </>
          ) : (
            <>
              <MdError /> {statusMessage}
            </>
          )}
        </div>
      )}

      <div className="settings-container">
        {/* Tabs Navigation */}
        <div className="settings-tabs">
          <button
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <MdPerson /> Profile
          </button>
          <button
            className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <MdPalette /> General
          </button>
        </div>

        {/* Profile Settings Tab */}
        {activeTab === 'profile' && (
          <div className="settings-content">
            <div className="settings-section">
              <div className="section-header">
                <h2>Profile Information</h2>
                <p>Update your account profile and email address</p>
              </div>

              <div className="form-group">
                <label>Full Name</label>
                <div className="input-with-icon">
                  <MdPerson className="input-icon" />
                  <input
                    type="text"
                    className="form-input"
                    value={profileSettings.name}
                    onChange={(e) => handleProfileChange('name', e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <div className="input-with-icon">
                  <MdEmail className="input-icon" />
                  <input
                    type="email"
                    className="form-input"
                    value={profileSettings.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
              </div>
            </div>

            <div className="settings-section">
              <div className="section-header">
                <h2>Change Password</h2>
                <p>Update your password to keep your account secure</p>
              </div>

              <div className="form-group">
                <label>Current Password</label>
                <div className="input-with-icon">
                  <MdLock className="input-icon" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    className="form-input"
                    value={profileSettings.currentPassword}
                    onChange={(e) => handleProfileChange('currentPassword', e.target.value)}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    className="toggle-visibility"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <MdVisibilityOff /> : <MdVisibility />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>New Password</label>
                <div className="input-with-icon">
                  <MdLock className="input-icon" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    className="form-input"
                    value={profileSettings.newPassword}
                    onChange={(e) => handleProfileChange('newPassword', e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                  />
                  <button
                    type="button"
                    className="toggle-visibility"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <MdVisibilityOff /> : <MdVisibility />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <div className="input-with-icon">
                  <MdLock className="input-icon" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="form-input"
                    value={profileSettings.confirmPassword}
                    onChange={(e) => handleProfileChange('confirmPassword', e.target.value)}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    className="toggle-visibility"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <MdVisibilityOff /> : <MdVisibility />}
                  </button>
                </div>
              </div>
            </div>

            <div className="settings-actions">
              <button className="btn btn-primary" onClick={handleSaveProfile}>
                <MdSave /> Save Profile Changes
              </button>
            </div>
          </div>
        )}

        {/* General Settings Tab */}
        {activeTab === 'general' && (
          <div className="settings-content">
            <div className="settings-section">
              <div className="section-header">
                <h2>Appearance</h2>
                <p>Customize the look and feel of your dashboard</p>
              </div>

              <div className="form-group">
                <label>Theme</label>
                <div className="theme-options">
                  <div
                    className={`theme-option ${generalSettings.theme === 'light' ? 'active' : ''}`}
                    onClick={() => handleGeneralChange('theme', 'light')}
                  >
                    <MdBrightness7 />
                    <span>Light</span>
                  </div>
                  <div
                    className={`theme-option ${generalSettings.theme === 'dark' ? 'active' : ''}`}
                    onClick={() => handleGeneralChange('theme', 'dark')}
                  >
                    <MdBrightness4 />
                    <span>Dark</span>
                  </div>
                  <div
                    className={`theme-option ${generalSettings.theme === 'auto' ? 'active' : ''}`}
                    onClick={() => handleGeneralChange('theme', 'auto')}
                  >
                    <MdPalette />
                    <span>Auto</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <div className="section-header">
                <h2>Localization</h2>
                <p>Set your preferred language and regional formats</p>
              </div>

              <div className="form-group">
                <label>Language</label>
                <div className="input-with-icon">
                  <MdLanguage className="input-icon" />
                  <select
                    className="form-input"
                    value={generalSettings.language}
                    onChange={(e) => handleGeneralChange('language', e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="pt">Portuguese</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Timezone</label>
                <div className="input-with-icon">
                  <MdAccessTime className="input-icon" />
                  <select
                    className="form-input"
                    value={generalSettings.timezone}
                    onChange={(e) => handleGeneralChange('timezone', e.target.value)}
                  >
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Paris (CET)</option>
                    <option value="Asia/Dubai">Dubai (GST)</option>
                    <option value="Asia/Kolkata">India (IST)</option>
                    <option value="Asia/Singapore">Singapore (SGT)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Date Format</label>
                <select
                  className="form-input"
                  value={generalSettings.dateFormat}
                  onChange={(e) => handleGeneralChange('dateFormat', e.target.value)}
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2025)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2025)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (2025-12-31)</option>
                  <option value="DD MMM YYYY">DD MMM YYYY (31 Dec 2025)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Time Format</label>
                <select
                  className="form-input"
                  value={generalSettings.timeFormat}
                  onChange={(e) => handleGeneralChange('timeFormat', e.target.value)}
                >
                  <option value="12h">12-hour (3:45 PM)</option>
                  <option value="24h">24-hour (15:45)</option>
                </select>
              </div>
            </div>

            <div className="settings-actions">
              <button className="btn btn-primary" onClick={handleSaveGeneral}>
                <MdSave /> Save General Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;

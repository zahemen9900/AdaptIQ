import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './SettingsPage.css';
import Logo from '../assets/logo-white.png';
import { 
  IconCalendar, IconUser, IconBook, IconSettings, IconChartBar, 
  IconClipboard, IconUsers, IconMoon, IconSun, IconBell, 
  IconMail, IconVolume, IconLanguage, IconCheck, IconLetterA, IconSparkles
} from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const SettingsPage = () => {
  const { theme, toggleTheme, isDarkMode, settings, updateSetting } = useTheme();
  const [nickname, setNickname] = useState('');
  const [saveAnimation, setSaveAnimation] = useState(false);

  // Load user nickname from localStorage
  useEffect(() => {
    const onboardingData = localStorage.getItem('onboardingData');
    if (onboardingData) {
      const userData = JSON.parse(onboardingData);
      if (userData.nickname) setNickname(userData.nickname);
    }
  }, []);

  // Handle font size change
  const handleFontSizeChange = (size) => {
    updateSetting('fontSize', size);
    
    // Show save animation
    setSaveAnimation(true);
    setTimeout(() => setSaveAnimation(false), 1500);
  };

  // Handle language change
  const handleLanguageChange = (e) => {
    updateSetting('language', e.target.value);
    
    // Show save animation
    setSaveAnimation(true);
    setTimeout(() => setSaveAnimation(false), 1500);
  };

  // Handle toggle settings (notifications, email, autoplay)
  const handleToggleSetting = (key) => {
    updateSetting(key, !settings[key]);
    
    // Show save animation
    setSaveAnimation(true);
    setTimeout(() => setSaveAnimation(false), 1500);
  };

  return (
    <div className="dashboard-page">
      {/* Sidebar Navigation */}
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <img src={Logo} alt="AdaptIQ Logo" className="dashboard-logo" />
        </div>
        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-item">
            <IconChartBar size={24} />
            <span>Overview</span>
          </Link>
          <Link to="/dashboard/courses" className="nav-item">
            <IconBook size={24} />
            <span>Courses</span>
          </Link>
          <Link to="/dashboard/assignments" className="nav-item">
            <IconClipboard size={24} />
            <span>Assignments</span>
          </Link>
          <Link to="/dashboard/schedule" className="nav-item">
            <IconCalendar size={24} />
            <span>Schedule</span>
          </Link>
          <Link to="/dashboard/inspiration" className="nav-item">
            <IconSparkles size={24} />
            <span>Inspiration</span>
          </Link>
          <Link to="/dashboard/profile" className="nav-item">
            <IconUser size={24} />
            <span>Profile</span>
          </Link>
          <Link to="/dashboard/settings" className="nav-item active">
            <IconSettings size={24} />
            <span>Settings</span>
          </Link>
        </nav>
      </div>
      
      {/* Main Content */}
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Settings</h1>
          <div className="user-profile">
            <span className="user-name">{nickname || 'Guest'}</span>
            <div className="user-avatar">{nickname ? nickname.substring(0, 2).toUpperCase() : 'G'}</div>
          </div>
        </div>
        
        <div className="settings-container">
          {/* Appearance Section */}
          <div className="settings-section">
            <h2 className="settings-title">Appearance</h2>
            
            <div className="settings-card">
              <div className="settings-item">
                <div className="settings-item-label">
                  <h3>Theme</h3>
                  <p>Change the appearance of AdaptIQ</p>
                </div>
                <div className="theme-toggle-container">
                  <button 
                    className={`theme-toggle ${!isDarkMode ? 'active' : ''}`}
                    onClick={!isDarkMode ? undefined : toggleTheme}
                    aria-label="Light Mode"
                  >
                    <IconSun size={20} />
                    <span>Light</span>
                  </button>
                  <button 
                    className={`theme-toggle ${isDarkMode ? 'active' : ''}`}
                    onClick={isDarkMode ? undefined : toggleTheme}
                    aria-label="Dark Mode"
                  >
                    <IconMoon size={20} />
                    <span>Dark</span>
                  </button>
                </div>
              </div>
              
              <div className="settings-divider"></div>
              
              <div className="settings-item">
                <div className="settings-item-label">
                  <h3>Font Size</h3>
                  <p>Adjust the text size</p>
                </div>
                <div className="font-size-controls">
                  <button 
                    className={`font-size-button ${settings.fontSize === 'small' ? 'active' : ''}`}
                    onClick={() => handleFontSizeChange('small')}
                  >
                    <IconLetterA size={16} />
                    <span>Small</span>
                  </button>
                  <button 
                    className={`font-size-button ${settings.fontSize === 'medium' ? 'active' : ''}`}
                    onClick={() => handleFontSizeChange('medium')}
                  >
                    <IconLetterA size={20} />
                    <span>Medium</span>
                  </button>
                  <button 
                    className={`font-size-button ${settings.fontSize === 'large' ? 'active' : ''}`}
                    onClick={() => handleFontSizeChange('large')}
                  >
                    <IconLetterA size={24} />
                    <span>Large</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Notification Settings */}
          <div className="settings-section">
            <h2 className="settings-title">Notifications</h2>
            
            <div className="settings-card">
              <div className="settings-item">
                <div className="settings-item-label">
                  <h3>Push Notifications</h3>
                  <p>Receive notifications about your courses and assignments</p>
                </div>
                <div className="toggle-switch-container">
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={settings.notifications} 
                      onChange={() => handleToggleSetting('notifications')}
                    />
                    <span className="switch-slider"></span>
                  </label>
                </div>
              </div>
              
              <div className="settings-divider"></div>
              
              <div className="settings-item">
                <div className="settings-item-label">
                  <h3>Email Notifications</h3>
                  <p>Receive email updates about your progress</p>
                </div>
                <div className="toggle-switch-container">
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={settings.emailNotifications} 
                      onChange={() => handleToggleSetting('emailNotifications')}
                    />
                    <span className="switch-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Content Settings */}
          <div className="settings-section">
            <h2 className="settings-title">Content</h2>
            
            <div className="settings-card">
              <div className="settings-item">
                <div className="settings-item-label">
                  <h3>Autoplay Videos</h3>
                  <p>Automatically play tutorial videos</p>
                </div>
                <div className="toggle-switch-container">
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={settings.autoplay} 
                      onChange={() => handleToggleSetting('autoplay')}
                    />
                    <span className="switch-slider"></span>
                  </label>
                </div>
              </div>
              
              <div className="settings-divider"></div>
              
              <div className="settings-item">
                <div className="settings-item-label">
                  <h3>Language</h3>
                  <p>Change display language</p>
                </div>
                <div className="language-select-container">
                  <select 
                    value={settings.language} 
                    onChange={handleLanguageChange}
                    className="language-select"
                  >
                    <option value="english">English</option>
                    <option value="spanish">Spanish</option>
                    <option value="french">French</option>
                    <option value="german">German</option>
                    <option value="chinese">Chinese</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          {/* About Section */}
          <div className="settings-section">
            <h2 className="settings-title">About</h2>
            
            <div className="settings-card">
              <div className="about-content">
                <h3>AdaptIQ Learning Platform</h3>
                <p>Version 1.0.0</p>
                <p>© 2025 AdaptIQ Education Inc.</p>
                <p>
                  <a href="/terms" className="settings-link">Terms of Service</a> • 
                  <a href="/privacy" className="settings-link">Privacy Policy</a>
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Save Animation */}
        <AnimatePresence>
          {saveAnimation && (
            <motion.div 
              className="save-animation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <IconCheck size={20} />
              <span>Settings saved</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SettingsPage;
import { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../utils/firebase';
import { getUserSettings, saveUserSettings } from '../utils/firebase';

// Create theme context
export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Initialize theme from localStorage, default to light mode
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });
  
  // Initialize other settings
  const [settings, setSettings] = useState({
    notifications: true,
    emailNotifications: true,
    autoplay: false,
    fontSize: 'medium',
    language: 'english'
  });
  
  // Apply theme to root element
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove previous theme classes
    root.classList.remove('theme-light', 'theme-dark');
    
    // Add current theme class
    root.classList.add(`theme-${theme}`);
    
    // Update font size classes
    if (settings.fontSize) {
      // Remove existing font size classes
      root.classList.remove('font-small', 'font-medium', 'font-large');
      // Add new font size class to root
      root.classList.add(`font-${settings.fontSize}`);
    }
    
    // Save to localStorage for persistence
    localStorage.setItem('theme', theme);
    localStorage.setItem('fontSize', settings.fontSize);
    
    // If user is authenticated, save to Firebase
    const user = auth.currentUser;
    if (user) {
      saveUserSettings(user.uid, { ...settings, theme });
    }
  }, [theme, settings]);
  
  // Load user settings from Firebase when authenticated
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const result = await getUserSettings(user.uid);
          if (result.success && result.settings) {
            // Update theme from Firebase if available
            if (result.settings.theme) {
              setTheme(result.settings.theme);
            }
            
            // Update other settings
            setSettings(prevSettings => ({
              ...prevSettings,
              ...result.settings
            }));
          }
        } catch (error) {
          console.error('Error loading user settings:', error);
        }
      }
    });
    
    // Cleanup
    return () => unsubscribe();
  }, []);
  
  // Toggle theme between light and dark
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };
  
  // Update a specific setting
  const updateSetting = (key, value) => {
    setSettings(prevSettings => {
      const newSettings = { ...prevSettings, [key]: value };
      
      // Save to Firebase if user is authenticated
      const user = auth.currentUser;
      if (user) {
        saveUserSettings(user.uid, { ...newSettings, theme });
      }
      
      return newSettings;
    });
  };
  
  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme, 
      isDarkMode: theme === 'dark',
      settings,
      updateSetting
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for easier access to theme context
export const useTheme = () => useContext(ThemeContext);
/**
 * Settings Context - Global state management for app settings
 */

import React, {createContext, useState, useEffect, useContext} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsContext = createContext();

export const SettingsProvider = ({children}) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [strictMode, setStrictMode] = useState(false);
  const [customKeywords, setCustomKeywords] = useState([]);
  const [blockedDomains, setBlockedDomains] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsJson = await AsyncStorage.getItem('settings');
      if (settingsJson) {
        const settings = JSON.parse(settingsJson);
        setIsEnabled(settings.enabled !== false);
        setStrictMode(settings.strictMode || false);
        setCustomKeywords(settings.customKeywords || []);
        setBlockedDomains(settings.blockedDomains || []);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      const settings = {
        enabled: newSettings.enabled ?? isEnabled,
        strictMode: newSettings.strictMode ?? strictMode,
        customKeywords: newSettings.customKeywords ?? customKeywords,
        blockedDomains: newSettings.blockedDomains ?? blockedDomains,
        updatedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem('settings', JSON.stringify(settings));

      // Update state
      if (newSettings.enabled !== undefined) setIsEnabled(newSettings.enabled);
      if (newSettings.strictMode !== undefined)
        setStrictMode(newSettings.strictMode);
      if (newSettings.customKeywords !== undefined)
        setCustomKeywords(newSettings.customKeywords);
      if (newSettings.blockedDomains !== undefined)
        setBlockedDomains(newSettings.blockedDomains);

      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  };

  const resetSettings = async () => {
    try {
      await AsyncStorage.removeItem('settings');
      setIsEnabled(true);
      setStrictMode(false);
      setCustomKeywords([]);
      setBlockedDomains([]);
      return true;
    } catch (error) {
      console.error('Failed to reset settings:', error);
      return false;
    }
  };

  const value = {
    isEnabled,
    strictMode,
    customKeywords,
    blockedDomains,
    isLoading,
    saveSettings,
    resetSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

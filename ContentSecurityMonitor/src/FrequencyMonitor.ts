/**
 * FrequencyMonitor.ts
 * Service for monitoring and tracking domain access frequency patterns
 * Provides functions for checking access thresholds and generating notifications
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import StorageService from './StorageService';

export interface FrequencySettings {
  warningThreshold: number;
  blockingThreshold: number;
}

class FrequencyMonitor {
  private static instance: FrequencyMonitor;
  private FREQUENCY_SETTINGS_KEY = 'frequency_settings';

  private constructor() {}

  public static getInstance(): FrequencyMonitor {
    if (!FrequencyMonitor.instance) {
      FrequencyMonitor.instance = new FrequencyMonitor();
    }
    return FrequencyMonitor.instance;
  }

  /**
   * Get frequency settings from AsyncStorage
   */
  public async getFrequencySettings(): Promise<FrequencySettings> {
    try {
      const settingsStr = await AsyncStorage.getItem(this.FREQUENCY_SETTINGS_KEY);
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        return {
          warningThreshold: settings.warningThreshold || 3,
          blockingThreshold: settings.blockingThreshold || 5,
        };
      }
    } catch (error) {
      console.error('Error loading frequency settings:', error);
    }
    
    // Return default settings if none found or error occurred
    return {
      warningThreshold: 3,
      blockingThreshold: 5,
    };
  }

  /**
   * Save frequency settings to AsyncStorage
   */
  public async saveFrequencySettings(settings: FrequencySettings): Promise<void> {
    try {
      await AsyncStorage.setItem(this.FREQUENCY_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving frequency settings:', error);
      throw error;
    }
  }

  /**
   * Check if domain access should trigger a warning
   */
  public async shouldWarnForDomain(domain: string): Promise<boolean> {
    try {
      const settings = await this.getFrequencySettings();
      const dailyCount = await StorageService.getDailyDomainAccessCount(domain);
      return dailyCount >= settings.warningThreshold && dailyCount < settings.blockingThreshold;
    } catch (error) {
      console.error('Error checking domain warning threshold:', error);
      return false;
    }
  }

  /**
   * Check if domain access should be blocked
   */
  public async shouldBlockDomain(domain: string): Promise<boolean> {
    try {
      const settings = await this.getFrequencySettings();
      const dailyCount = await StorageService.getDailyDomainAccessCount(domain);
      return dailyCount >= settings.blockingThreshold && settings.blockingThreshold > 0;
    } catch (error) {
      console.error('Error checking domain blocking threshold:', error);
      return false;
    }
  }

  /**
   * Get current access count for a domain today
   */
  public async getDomainAccessCount(domain: string): Promise<number> {
    try {
      return await StorageService.getDailyDomainAccessCount(domain);
    } catch (error) {
      console.error('Error getting domain access count:', error);
      return 0;
    }
  }

  /**
   * Check if domain access is approaching thresholds and generate appropriate message
   */
  public async checkDomainAccessStatus(domain: string): Promise<{
    shouldWarn: boolean;
    shouldBlock: boolean;
    accessCount: number;
    message: string;
  }> {
    try {
      const settings = await this.getFrequencySettings();
      const accessCount = await StorageService.getDailyDomainAccessCount(domain);
      
      const shouldBlock = accessCount >= settings.blockingThreshold && settings.blockingThreshold > 0;
      const shouldWarn = accessCount >= settings.warningThreshold && accessCount < settings.blockingThreshold;
      
      let message = '';
      if (shouldBlock) {
        message = `You have accessed this domain (${domain}) too many times today. Access has been blocked to protect your browsing habits.`;
      } else if (shouldWarn) {
        message = `You have accessed ${domain} ${accessCount} times today. Consider taking a break from this content.`;
      }
      
      return {
        shouldWarn,
        shouldBlock,
        accessCount,
        message
      };
    } catch (error) {
      console.error('Error checking domain access status:', error);
      return {
        shouldWarn: false,
        shouldBlock: false,
        accessCount: 0,
        message: ''
      };
    }
  }

  /**
   * Reset frequency settings to defaults
   */
  public async resetToDefaults(): Promise<void> {
    const defaultSettings: FrequencySettings = {
      warningThreshold: 3,
      blockingThreshold: 5,
    };
    await this.saveFrequencySettings(defaultSettings);
  }
}

export default FrequencyMonitor.getInstance();
/**
 * StorageService.ts
 * Local storage service for the Content Security Monitor app
 * Handles user information, browsing statistics, and content access tracking
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Define TypeScript interfaces
export interface UserInfo {
  gender: string;
  age: string;
  education: string;
  occupation: string;
  browsingFrequency: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentAccessRecord {
  id: string;
  url: string;
  timestamp: string;
  contentType: 'inappropriate' | 'safe' | 'blocked' | 'warning_bypassed';
  keywordsDetected?: string[];
}

export interface StatisticsData {
  totalBlocked: number;
  totalWarnings: number;
  totalBypassed: number;
  totalSafe: number;
  dailyAccess: Record<string, number>; // Date as key, count as value
  hourlyDistribution: Record<number, number>; // Hour (0-23) as key, count as value
  contentTypeDistribution: Record<string, number>;
  // Frequency monitoring data
  dailyDomainAccess: Record<string, Record<string, number>>; // Date as key, domain:count as value
  weeklyAccessPattern: Record<string, number>; // Day of week as key, count as value
}

export interface ArticleNotification {
  id: string;
  title: string;
  content: string;
  category: 'anti_addiction' | 'cybersecurity' | 'parental_control';
  timestamp: string;
  read: boolean;
}

class StorageService {
  private static instance: StorageService;
  private USER_INFO_KEY = 'user_info';
  private CONTENT_ACCESS_KEY = 'content_access_records';
  private STATISTICS_KEY = 'statistics_data';
  private ARTICLES_KEY = 'article_notifications';

  private constructor() {}

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // User Information Methods
  public async saveUserInfo(userInfo: Omit<UserInfo, 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const userInfoWithTimestamps: UserInfo = {
        ...userInfo,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(this.USER_INFO_KEY, JSON.stringify(userInfoWithTimestamps));
    } catch (error) {
      console.error('Error saving user info:', error);
      throw error;
    }
  }

  public async getUserInfo(): Promise<UserInfo | null> {
    try {
      const userInfoStr = await AsyncStorage.getItem(this.USER_INFO_KEY);
      return userInfoStr ? JSON.parse(userInfoStr) : null;
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  }

  public async clearUserInfo(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.USER_INFO_KEY);
    } catch (error) {
      console.error('Error clearing user info:', error);
      throw error;
    }
  }

  // Content Access Methods
  public async recordContentAccess(record: Omit<ContentAccessRecord, 'id' | 'timestamp'>): Promise<void> {
    try {
      const contentAccessRecords = await this.getContentAccessRecords();
      const newRecord: ContentAccessRecord = {
        ...record,
        id: this.generateId(),
        timestamp: new Date().toISOString(),
      };
      contentAccessRecords.push(newRecord);
      await AsyncStorage.setItem(this.CONTENT_ACCESS_KEY, JSON.stringify(contentAccessRecords));
    } catch (error) {
      console.error('Error recording content access:', error);
      throw error;
    }
  }

  public async getContentAccessRecords(): Promise<ContentAccessRecord[]> {
    try {
      const recordsStr = await AsyncStorage.getItem(this.CONTENT_ACCESS_KEY);
      return recordsStr ? JSON.parse(recordsStr) : [];
    } catch (error) {
      console.error('Error getting content access records:', error);
      return [];
    }
  }

  public async clearContentAccessRecords(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.CONTENT_ACCESS_KEY);
    } catch (error) {
      console.error('Error clearing content access records:', error);
      throw error;
    }
  }

  // Statistics Methods
  public async updateStatistics(newRecord: ContentAccessRecord): Promise<void> {
    try {
      const stats = await this.getStatistics();
      
      // Update counters
      if (newRecord.contentType === 'blocked') {
        stats.totalBlocked += 1;
      } else if (newRecord.contentType === 'warning_bypassed') {
        stats.totalBypassed += 1;
      } else if (newRecord.contentType === 'safe') {
        stats.totalSafe += 1;
      }
      
      // Update daily access
      const date = new Date(newRecord.timestamp).toISOString().split('T')[0];
      stats.dailyAccess[date] = (stats.dailyAccess[date] || 0) + 1;
      
      // Update hourly distribution
      const hour = new Date(newRecord.timestamp).getHours();
      stats.hourlyDistribution[hour] = (stats.hourlyDistribution[hour] || 0) + 1;
      
      // Update content type distribution
      stats.contentTypeDistribution[newRecord.contentType] = 
        (stats.contentTypeDistribution[newRecord.contentType] || 0) + 1;
      
      // Update domain-based access tracking
      const domain = this.extractDomain(newRecord.url);
      if (!stats.dailyDomainAccess[date]) {
        stats.dailyDomainAccess[date] = {};
      }
      stats.dailyDomainAccess[date][domain] = (stats.dailyDomainAccess[date][domain] || 0) + 1;
      
      // Update weekly access pattern
      const dayOfWeek = new Date(newRecord.timestamp).getDay().toString(); // 0-6 (Sunday-Saturday)
      stats.weeklyAccessPattern[dayOfWeek] = (stats.weeklyAccessPattern[dayOfWeek] || 0) + 1;
      
      await AsyncStorage.setItem(this.STATISTICS_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('Error updating statistics:', error);
      throw error;
    }
  }
  
  // Helper method to extract domain from URL
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (e) {
      // If URL parsing fails, return the URL as is
      return url;
    }
  }
  
  // Get daily access count for a specific domain
  public async getDailyDomainAccessCount(domain: string): Promise<number> {
    try {
      const stats = await this.getStatistics();
      const today = new Date().toISOString().split('T')[0];
      
      if (stats.dailyDomainAccess[today] && stats.dailyDomainAccess[today][domain]) {
        return stats.dailyDomainAccess[today][domain];
      }
      return 0;
    } catch (error) {
      console.error('Error getting daily domain access count:', error);
      return 0;
    }
  }
  
  // Check if domain access should be blocked based on frequency
  public async shouldBlockDomain(domain: string, threshold: number = 5): Promise<boolean> {
    try {
      const dailyCount = await this.getDailyDomainAccessCount(domain);
      return dailyCount >= threshold && threshold > 0;
    } catch (error) {
      console.error('Error checking domain blocking:', error);
      return false;
    }
  }

  public async getStatistics(): Promise<StatisticsData> {
    try {
      const statsStr = await AsyncStorage.getItem(this.STATISTICS_KEY);
      const defaultStats: StatisticsData = {
        totalBlocked: 0,
        totalWarnings: 0,
        totalBypassed: 0,
        totalSafe: 0,
        dailyAccess: {},
        hourlyDistribution: {},
        contentTypeDistribution: {},
        dailyDomainAccess: {},
        weeklyAccessPattern: {},
      };
      return statsStr ? JSON.parse(statsStr) : defaultStats;
    } catch (error) {
      console.error('Error getting statistics:', error);
      return {
        totalBlocked: 0,
        totalWarnings: 0,
        totalBypassed: 0,
        totalSafe: 0,
        dailyAccess: {},
        hourlyDistribution: {},
        contentTypeDistribution: {},
        dailyDomainAccess: {},
        weeklyAccessPattern: {},
      };
    }
  }

  public async clearStatistics(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STATISTICS_KEY);
    } catch (error) {
      console.error('Error clearing statistics:', error);
      throw error;
    }
  }

  // Article Notification Methods
  public async saveArticleNotification(article: Omit<ArticleNotification, 'id' | 'timestamp' | 'read'>): Promise<void> {
    try {
      const articles = await this.getArticleNotifications();
      const newArticle: ArticleNotification = {
        ...article,
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        read: false,
      };
      articles.push(newArticle);
      await AsyncStorage.setItem(this.ARTICLES_KEY, JSON.stringify(articles));
    } catch (error) {
      console.error('Error saving article notification:', error);
      throw error;
    }
  }

  public async getArticleNotifications(): Promise<ArticleNotification[]> {
    try {
      const articlesStr = await AsyncStorage.getItem(this.ARTICLES_KEY);
      return articlesStr ? JSON.parse(articlesStr) : [];
    } catch (error) {
      console.error('Error getting article notifications:', error);
      return [];
    }
  }

  public async markArticleAsRead(articleId: string): Promise<void> {
    try {
      const articles = await this.getArticleNotifications();
      const updatedArticles = articles.map(article => 
        article.id === articleId ? {...article, read: true} : article
      );
      await AsyncStorage.setItem(this.ARTICLES_KEY, JSON.stringify(updatedArticles));
    } catch (error) {
      console.error('Error marking article as read:', error);
      throw error;
    }
  }

  public async clearArticleNotifications(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.ARTICLES_KEY);
    } catch (error) {
      console.error('Error clearing article notifications:', error);
      throw error;
    }
  }

  // Utility Methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Clear all data
  public async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.USER_INFO_KEY,
        this.CONTENT_ACCESS_KEY,
        this.STATISTICS_KEY,
        this.ARTICLES_KEY,
      ]);
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }
}

export default StorageService.getInstance();
/**
 * DataImportService.ts
 * Service for importing/exporting data between PC browser extension and Android app
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import StorageService, { 
  UserInfo, 
  ContentAccessRecord, 
  StatisticsData, 
  ArticleNotification 
} from './StorageService';

// Define the structure of browser extension data
export interface BrowserExtensionData {
  userInfo?: Partial<UserInfo>;
  contentAccessRecords?: ContentAccessRecord[];
  statistics?: Partial<StatisticsData>;
  articleNotifications?: ArticleNotification[];
  timestamp: string;
  version: string;
}

class DataImportService {
  private static instance: DataImportService;
  
  private USER_INFO_KEY = 'user_info';
  private CONTENT_ACCESS_KEY = 'content_access_records';
  private STATISTICS_KEY = 'statistics_data';
  private ARTICLES_KEY = 'article_notifications';

  private constructor() {}

  public static getInstance(): DataImportService {
    if (!DataImportService.instance) {
      DataImportService.instance = new DataImportService();
    }
    return DataImportService.instance;
  }

  /**
   * Import data from PC browser extension
   */
  public async importBrowserExtensionData(data: BrowserExtensionData): Promise<boolean> {
    try {
      // Import user info if provided
      if (data.userInfo) {
        await this.importUserInfo(data.userInfo);
      }

      // Import content access records if provided
      if (data.contentAccessRecords) {
        await this.importContentAccessRecords(data.contentAccessRecords);
      }

      // Import statistics if provided
      if (data.statistics) {
        await this.importStatistics(data.statistics);
      }

      // Import article notifications if provided
      if (data.articleNotifications) {
        await this.importArticleNotifications(data.articleNotifications);
      }

      return true;
    } catch (error) {
      console.error('Error importing browser extension data:', error);
      return false;
    }
  }

  /**
   * Export Android app data for use with PC browser extension
   */
  public async exportAndroidData(): Promise<BrowserExtensionData> {
    try {
      const userInfo = await StorageService.getUserInfo();
      const contentAccessRecords = await StorageService.getContentAccessRecords();
      const statistics = await StorageService.getStatistics();
      const articleNotifications = await StorageService.getArticleNotifications();

      return {
        userInfo: userInfo || undefined,
        contentAccessRecords,
        statistics,
        articleNotifications,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };
    } catch (error) {
      console.error('Error exporting Android data:', error);
      throw error;
    }
  }

  /**
   * Import user info, merging with existing data
   */
  private async importUserInfo(userInfo: Partial<UserInfo>): Promise<void> {
    try {
      const existingUserInfo = await StorageService.getUserInfo();
      
      // Merge user info, preferring imported data for fields that exist
      const mergedUserInfo: UserInfo = {
        gender: userInfo.gender || existingUserInfo?.gender || '',
        age: userInfo.age || existingUserInfo?.age || '',
        education: userInfo.education || existingUserInfo?.education || '',
        occupation: userInfo.occupation || existingUserInfo?.occupation || '',
        browsingFrequency: userInfo.browsingFrequency || existingUserInfo?.browsingFrequency || '',
        createdAt: existingUserInfo?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await StorageService.saveUserInfo(mergedUserInfo);
    } catch (error) {
      console.error('Error importing user info:', error);
      throw error;
    }
  }

  /**
   * Import content access records, merging with existing records
   */
  private async importContentAccessRecords(records: ContentAccessRecord[]): Promise<void> {
    try {
      const existingRecords = await StorageService.getContentAccessRecords();
      
      // Create a set of existing record IDs for deduplication
      const existingIds = new Set(existingRecords.map(record => record.id));
      
      // Filter out records that already exist
      const newRecords = records.filter(record => !existingIds.has(record.id));
      
      // Add new records to existing ones
      const mergedRecords = [...existingRecords, ...newRecords];
      
      // Save all records
      await AsyncStorage.setItem(this.CONTENT_ACCESS_KEY, JSON.stringify(mergedRecords));
    } catch (error) {
      console.error('Error importing content access records:', error);
      throw error;
    }
  }

  /**
   * Import statistics, merging with existing statistics
   */
  private async importStatistics(stats: Partial<StatisticsData>): Promise<void> {
    try {
      const existingStats = await StorageService.getStatistics();
      
      // Merge statistics, combining counts where appropriate
      const mergedStats: StatisticsData = {
        totalBlocked: (existingStats.totalBlocked || 0) + (stats.totalBlocked || 0),
        totalWarnings: (existingStats.totalWarnings || 0) + (stats.totalWarnings || 0),
        totalBypassed: (existingStats.totalBypassed || 0) + (stats.totalBypassed || 0),
        totalSafe: (existingStats.totalSafe || 0) + (stats.totalSafe || 0),
        dailyAccess: this.mergeRecordCounts(existingStats.dailyAccess, stats.dailyAccess || {}),
        hourlyDistribution: this.mergeRecordCounts(existingStats.hourlyDistribution, stats.hourlyDistribution || {}),
        contentTypeDistribution: this.mergeRecordCounts(existingStats.contentTypeDistribution, stats.contentTypeDistribution || {}),
        dailyDomainAccess: this.mergeDailyDomainAccess(existingStats.dailyDomainAccess, stats.dailyDomainAccess || {}),
        weeklyAccessPattern: this.mergeRecordCounts(existingStats.weeklyAccessPattern, stats.weeklyAccessPattern || {})
      };

      await AsyncStorage.setItem(this.STATISTICS_KEY, JSON.stringify(mergedStats));
    } catch (error) {
      console.error('Error importing statistics:', error);
      throw error;
    }
  }

  /**
   * Import article notifications, merging with existing notifications
   */
  private async importArticleNotifications(articles: ArticleNotification[]): Promise<void> {
    try {
      const existingArticles = await StorageService.getArticleNotifications();
      
      // Create a set of existing article IDs for deduplication
      const existingIds = new Set(existingArticles.map(article => article.id));
      
      // Filter out articles that already exist
      const newArticles = articles.filter(article => !existingIds.has(article.id));
      
      // Add new articles to existing ones
      const mergedArticles = [...existingArticles, ...newArticles];
      
      // Save all articles
      await AsyncStorage.setItem(this.ARTICLES_KEY, JSON.stringify(mergedArticles));
    } catch (error) {
      console.error('Error importing article notifications:', error);
      throw error;
    }
  }

  /**
   * Helper function to merge record counts (e.g., daily access counts)
   */
  private mergeRecordCounts(
    existing: Record<string, number>, 
    imported: Record<string, number>
  ): Record<string, number> {
    const merged: Record<string, number> = { ...existing };
    
    Object.entries(imported).forEach(([key, value]) => {
      merged[key] = (merged[key] || 0) + value;
    });
    
    return merged;
  }

  /**
   * Helper function to merge daily domain access records
   */
  private mergeDailyDomainAccess(
    existing: Record<string, Record<string, number>>, 
    imported: Record<string, Record<string, number>>
  ): Record<string, Record<string, number>> {
    const merged: Record<string, Record<string, number>> = { ...existing };
    
    Object.entries(imported).forEach(([date, domainAccess]) => {
      if (!merged[date]) {
        merged[date] = {};
      }
      
      Object.entries(domainAccess).forEach(([domain, count]) => {
        merged[date][domain] = (merged[date][domain] || 0) + count;
      });
    });
    
    return merged;
  }

  /**
   * Validate imported data format
   */
  public validateBrowserExtensionData(data: any): data is BrowserExtensionData {
    // Basic validation - check for required properties
    if (!data.timestamp || !data.version) {
      return false;
    }
    
    // Validate optional properties if they exist
    if (data.userInfo && typeof data.userInfo !== 'object') {
      return false;
    }
    
    if (data.contentAccessRecords && !Array.isArray(data.contentAccessRecords)) {
      return false;
    }
    
    if (data.statistics && typeof data.statistics !== 'object') {
      return false;
    }
    
    if (data.articleNotifications && !Array.isArray(data.articleNotifications)) {
      return false;
    }
    
    return true;
  }
}

export default DataImportService.getInstance();
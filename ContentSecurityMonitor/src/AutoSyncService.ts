/**
 * AutoSyncService.ts
 * 自动同步服务 - 实现PC浏览器扩展与Android应用之间的自动化数据同步
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import DataImportService, { BrowserExtensionData } from './DataImportService';

// 定义同步设置接口
export interface AutoSyncSettings {
  enabled: boolean; // 是否启用自动同步
  frequency: 'manual' | 'hourly' | 'daily' | 'weekly'; // 同步频率
  lastSync: string | null; // 上次同步时间
  pcEndpoint: string | null; // PC浏览器扩展API端点
  syncOnStart: boolean; // 应用启动时同步
  syncOnBackground: boolean; // 后台同步
}

// 定义同步状态接口
export interface SyncStatus {
  isSyncing: boolean; // 是否正在同步
  lastSyncAttempt: string | null; // 上次同步尝试时间
  lastSyncSuccess: string | null; // 上次同步成功时间
  error: string | null; // 错误信息
  recordsSynced: number; // 同步记录数
}

class AutoSyncService {
  private static instance: AutoSyncService;
  private SYNC_SETTINGS_KEY = 'auto_sync_settings';
  private SYNC_STATUS_KEY = 'sync_status';
  private syncInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): AutoSyncService {
    if (!AutoSyncService.instance) {
      AutoSyncService.instance = new AutoSyncService();
    }
    return AutoSyncService.instance;
  }

  /**
   * 初始化自动同步服务
   */
  public async initialize(): Promise<void> {
    try {
      const settings = await this.getSyncSettings();
      
      // 如果启用了自动同步且频率不为手动，则设置后台同步
      if (settings.enabled && settings.frequency !== 'manual') {
        this.setupBackgroundSync(settings.frequency);
      }
      
      // 如果设置了启动时同步，则执行同步
      if (settings.syncOnStart) {
        await this.syncWithPC();
      }
    } catch (error) {
      console.error('初始化自动同步服务失败:', error);
    }
  }

  /**
   * 获取当前同步设置
   */
  public async getSyncSettings(): Promise<AutoSyncSettings> {
    try {
      const settingsStr = await AsyncStorage.getItem(this.SYNC_SETTINGS_KEY);
      if (settingsStr) {
        return JSON.parse(settingsStr);
      }
    } catch (error) {
      console.error('加载同步设置失败:', error);
    }
    
    // 返回默认设置
    return {
      enabled: false,
      frequency: 'manual',
      lastSync: null,
      pcEndpoint: null,
      syncOnStart: false,
      syncOnBackground: false
    };
  }

  /**
   * 保存同步设置
   */
  public async saveSyncSettings(settings: AutoSyncSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(this.SYNC_SETTINGS_KEY, JSON.stringify(settings));
      
      // 如果同步已启用且频率不为手动，则更新后台同步
      if (settings.enabled && settings.frequency !== 'manual') {
        this.setupBackgroundSync(settings.frequency);
      } else if (!settings.enabled && this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }
    } catch (error) {
      console.error('保存同步设置失败:', error);
      throw error;
    }
  }

  /**
   * 获取当前同步状态
   */
  public async getSyncStatus(): Promise<SyncStatus> {
    try {
      const statusStr = await AsyncStorage.getItem(this.SYNC_STATUS_KEY);
      if (statusStr) {
        return JSON.parse(statusStr);
      }
    } catch (error) {
      console.error('加载同步状态失败:', error);
    }
    
    // 返回默认状态
    return {
      isSyncing: false,
      lastSyncAttempt: null,
      lastSyncSuccess: null,
      error: null,
      recordsSynced: 0
    };
  }

  /**
   * 更新同步状态
   */
  private async updateSyncStatus(status: Partial<SyncStatus>): Promise<void> {
    try {
      const currentStatus = await this.getSyncStatus();
      const newStatus = { ...currentStatus, ...status };
      await AsyncStorage.setItem(this.SYNC_STATUS_KEY, JSON.stringify(newStatus));
    } catch (error) {
      console.error('更新同步状态失败:', error);
    }
  }

  /**
   * 根据频率设置后台同步
   */
  private setupBackgroundSync(frequency: 'hourly' | 'daily' | 'weekly'): void {
    // 清除现有的定时器（如果有的话）
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    // 根据频率设置间隔时间
    let intervalMs: number;
    switch (frequency) {
      case 'hourly':
        intervalMs = 60 * 60 * 1000; // 1小时
        break;
      case 'daily':
        intervalMs = 24 * 60 * 60 * 1000; // 24小时
        break;
      case 'weekly':
        intervalMs = 7 * 24 * 60 * 60 * 1000; // 7天
        break;
      default:
        return;
    }
    
    // 设置定时器
    this.syncInterval = setInterval(() => {
      this.syncWithPC();
    }, intervalMs);
  }

  /**
   * 与PC浏览器扩展同步数据
   */
  public async syncWithPC(): Promise<boolean> {
    try {
      // 更新同步状态
      await this.updateSyncStatus({
        isSyncing: true,
        lastSyncAttempt: new Date().toISOString(),
        error: null
      });
      
      // 获取同步设置
      const settings = await this.getSyncSettings();
      
      // 检查是否启用了同步且配置了端点
      if (!settings.enabled || !settings.pcEndpoint) {
        await this.updateSyncStatus({
          isSyncing: false,
          error: '同步未启用或未配置端点'
        });
        return false;
      }
      
      // 从PC浏览器扩展获取数据
      const pcData = await this.fetchPCData(settings.pcEndpoint);
      
      if (!pcData) {
        await this.updateSyncStatus({
          isSyncing: false,
          error: '从PC获取数据失败'
        });
        return false;
      }
      
      // 导入数据到应用中
      const success = await DataImportService.importBrowserExtensionData(pcData);
      
      if (success) {
        // 更新同步状态
        const recordsCount = pcData.contentAccessRecords?.length || 0;
        await this.updateSyncStatus({
          isSyncing: false,
          lastSyncSuccess: new Date().toISOString(),
          recordsSynced: recordsCount,
          error: null
        });
        
        // 更新设置中的上次同步时间
        const updatedSettings = { ...settings, lastSync: new Date().toISOString() };
        await this.saveSyncSettings(updatedSettings);
        
        return true;
      } else {
        await this.updateSyncStatus({
          isSyncing: false,
          error: '导入PC数据失败'
        });
        return false;
      }
    } catch (error) {
      console.error('与PC同步失败:', error);
      await this.updateSyncStatus({
        isSyncing: false,
        error: (error as Error).message || '同步过程中发生未知错误'
      });
      return false;
    }
  }

  /**
   * 从PC浏览器扩展API获取数据
   */
  private async fetchPCData(endpoint: string): Promise<BrowserExtensionData | null> {
    try {
      // 添加时间戳防止缓存
      const url = endpoint.includes('?') 
        ? `${endpoint}&t=${Date.now()}` 
        : `${endpoint}?t=${Date.now()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000 // 10秒超时
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // 验证数据格式
      if (DataImportService.validateBrowserExtensionData(data)) {
        return data;
      } else {
        throw new Error('从PC接收到的数据格式无效');
      }
    } catch (error) {
      console.error('获取PC数据失败:', error);
      throw error;
    }
  }

  /**
   * 手动触发同步
   */
  public async manualSync(): Promise<boolean> {
    return await this.syncWithPC();
  }

  /**
   * 清理服务（应用关闭时调用）
   */
  public cleanup(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

export default AutoSyncService.getInstance();
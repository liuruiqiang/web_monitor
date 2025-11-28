// 后台服务脚本
class BackgroundService {
  constructor() {
    this.warningHistory = [];
    this.accessFrequency = {}; // Track access frequency by domain
    this.dailyAccessCount = {}; // Track daily access counts
    this.isEnabled = true;
    this.sleepSettings = {
      sleepReminderEnabled: false,
      sleepCutoff: '23:30',
      sleepNagIntervalMinutes: 30
    };
    this.sleepNotificationId = null;
    this.frequencySettings = {
      warningThreshold: 5, // Warn after 5 accesses per day
      blockingThreshold: 10 // Block after 10 accesses per day
    };
    
    this.init();
  }
  
  init() {
    // 监听来自内容脚本的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // 保持消息通道开放
    });
    
    // 监听标签页更新
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        this.checkTabUrl(tab);
      }
    });
    
    // 监听标签页激活
    chrome.tabs.onActivated.addListener((activeInfo) => {
      chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (tab.url) {
          this.checkTabUrl(tab);
        }
      });
    });
    
    // 初始化存储
    this.initializeStorage();

    // 监听闹钟
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm && alarm.name === 'sleep-check') {
        this.handleSleepAlarm();
      }
    });
  }
  
  handleMessage(request, sender, sendResponse) {
    switch (request.type) {
      case 'CONTENT_WARNING':
        this.handleContentWarning(request, sender);
        break;
      case 'DETECTION_DETAIL':
        this.handleDetectionDetail(request, sender);
        break;
      case 'GET_SETTINGS':
        this.getSettings(sendResponse);
        break;
      case 'UPDATE_SETTINGS':
        this.updateSettings(request.settings, sendResponse);
        break;
      case 'GET_HISTORY':
        this.getWarningHistory(sendResponse);
        break;
      case 'GET_STATISTICS':
        this.getDailyStatistics(sendResponse);
        break;
      case 'CHECK_DOMAIN_BLOCKING':
        this.checkDomainBlocking(request.url, sendResponse);
        break;
      case 'CLEAR_HISTORY':
        this.clearWarningHistory(sendResponse);
        break;
      default:
        sendResponse({error: 'Unknown message type'});
    }
  }
  
  handleContentWarning(request, sender) {
    const warning = {
      id: Date.now(),
      url: request.url,
      message: request.message,
      timestamp: request.timestamp,
      tabId: sender.tab?.id
    };
    
    this.warningHistory.push(warning);
    
    // Track access frequency
    this.trackAccessFrequency(request.url);
    
    // Check if we need to show a frequency-based warning
    const domain = this.extractDomain(request.url);
    const dailyCount = this.getDailyAccessCount(domain);
    
    if (dailyCount >= this.frequencySettings.warningThreshold && dailyCount < this.frequencySettings.blockingThreshold) {
      // Show frequency warning
      this.showFrequencyWarning(domain, dailyCount);
    } else if (dailyCount >= this.frequencySettings.blockingThreshold) {
      // Show blocking warning
      this.showBlockingWarning(domain, dailyCount);
    }
    
    // 保存到存储
    chrome.storage.local.set({
      warningHistory: this.warningHistory,
      accessFrequency: this.accessFrequency,
      dailyAccessCount: this.dailyAccessCount
    });
    
    // 显示通知
    this.showNotification(warning);
    
    // 记录到控制台
    console.log('Content Security Warning:', warning);
  }
  
  trackAccessFrequency(url) {
    const domain = this.extractDomain(url);
    const today = new Date().toDateString();
    
    // Update access frequency
    if (!this.accessFrequency[domain]) {
      this.accessFrequency[domain] = {};
    }
    
    if (!this.accessFrequency[domain][today]) {
      this.accessFrequency[domain][today] = 0;
    }
    
    this.accessFrequency[domain][today]++;
    
    // Update daily access count
    if (!this.dailyAccessCount[today]) {
      this.dailyAccessCount[today] = {};
    }
    
    if (!this.dailyAccessCount[today][domain]) {
      this.dailyAccessCount[today][domain] = 0;
    }
    
    this.dailyAccessCount[today][domain]++;
  }
  
  getDailyAccessCount(domain) {
    const today = new Date().toDateString();
    return this.dailyAccessCount[today]?.[domain] || 0;
  }
  
  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (e) {
      return url;
    }
  }
  
  showFrequencyWarning(domain, count) {
    const warningMessage = `您今天已经访问了 ${domain} ${count} 次不当内容网站。请注意控制浏览时间，避免过度沉迷。`;
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: '浏览频率警告',
      message: warningMessage,
      priority: 2
    });
  }
  
  showBlockingWarning(domain, count) {
    const warningMessage = `您今天已经访问了 ${domain} ${count} 次不当内容网站，已达到最大限制。网站访问已被阻止。`;
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: '访问限制警告',
      message: warningMessage,
      priority: 2
    });
  }
  
  checkDomainBlocking(url, sendResponse) {
    const domain = this.extractDomain(url);
    const dailyCount = this.getDailyAccessCount(domain);
    const shouldBlock = dailyCount >= this.frequencySettings.blockingThreshold && this.frequencySettings.blockingThreshold > 0;
    
    sendResponse({ shouldBlock: shouldBlock });
  }
  
  handleDetectionDetail(request, sender) {
    const detection = {
      id: Date.now(),
      ...request.detection,
      tabId: sender.tab?.id
    };
    
    // 保存检测详情到存储
    chrome.storage.local.get(['detectionDetails'], (result) => {
      const details = result.detectionDetails || [];
      details.push(detection);
      
      // 只保留最近100条记录
      if (details.length > 100) {
        details.splice(0, details.length - 100);
      }
      
      chrome.storage.local.set({
        detectionDetails: details
      });
    });
    
    // 记录到控制台
    console.log('🚨 检测详情:', detection);
  }
  
  showNotification(warning) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: '内容安全警告',
      message: `检测到可疑内容: ${warning.message}`,
      buttons: [
        { title: '查看详情' },
        { title: '忽略' }
      ]
    }, (notificationId) => {
      // 存储通知ID以便后续处理
      this.currentNotificationId = notificationId;
    });
  }
  
  checkTabUrl(tab) {
    if (!this.isEnabled) return;
    
    const url = tab.url.toLowerCase();
    const suspiciousDomains = [
      'pornhub', 'xvideos', 'redtube', 'youporn', 'tube8', 'beeg', 'xhamster',
      'adult', 'xxx', 'porn', 'sex', 'nude', 'erotic'
    ];
    
    const isSuspicious = suspiciousDomains.some(domain => url.includes(domain));
    
    if (isSuspicious) {
      // 更新标签页图标以显示警告
      chrome.action.setIcon({
        tabId: tab.id,
        path: {
          "16": "icons/icon16.png",
          "48": "icons/icon48.png",
          "128": "icons/icon128.png"
        }
      });
      
      chrome.action.setBadgeText({
        tabId: tab.id,
        text: "!"
      });
      
      chrome.action.setBadgeBackgroundColor({
        tabId: tab.id,
        color: "#ff4444"
      });
    } else {
      // 恢复正常图标
      chrome.action.setIcon({
        tabId: tab.id,
        path: {
          "16": "icons/icon16.png",
          "48": "icons/icon48.png",
          "128": "icons/icon128.png"
        }
      });
      
      chrome.action.setBadgeText({
        tabId: tab.id,
        text: ""
      });
    }
  }
  
  async initializeStorage() {
    try {
      const result = await chrome.storage.local.get(['warningHistory', 'accessFrequency', 'dailyAccessCount', 'settings', 'sleepLastNotifyAt', 'sleepSnoozeUntil']);
      
      if (result.warningHistory) {
        this.warningHistory = result.warningHistory;
      }
      
      if (result.accessFrequency) {
        this.accessFrequency = result.accessFrequency;
      }
      
      if (result.dailyAccessCount) {
        this.dailyAccessCount = result.dailyAccessCount;
      }
      
      if (result.settings) {
        this.isEnabled = result.settings.enabled !== false;
        this.sleepSettings.sleepReminderEnabled = !!result.settings.sleepReminderEnabled;
        this.sleepSettings.sleepCutoff = result.settings.sleepCutoff || this.sleepSettings.sleepCutoff;
        this.sleepSettings.sleepNagIntervalMinutes = result.settings.sleepNagIntervalMinutes || this.sleepSettings.sleepNagIntervalMinutes;
        if (result.settings.frequencySettings) {
          this.frequencySettings = { ...this.frequencySettings, ...result.settings.frequencySettings };
        }
      }

      // 启动或停止睡觉提醒闹钟
      this.configureSleepAlarm();
      
      // 每天重置访问计数器
      this.setupDailyReset();
    } catch (error) {
      console.error('Failed to initialize storage:', error);
    }
  }
  
  getSettings(sendResponse) {
    chrome.storage.local.get(['settings'], (result) => {
      const defaultSettings = {
        enabled: true,
        strictMode: false,
        customKeywords: [],
        blockedDomains: [],
        sleepReminderEnabled: false,
        sleepCutoff: '23:30',
        sleepNagIntervalMinutes: 30
      };
      
      sendResponse({
        settings: { ...defaultSettings, ...result.settings }
      });
    });
  }
  
  updateSettings(settings, sendResponse) {
    chrome.storage.local.set({ settings }, () => {
      this.isEnabled = settings.enabled !== false;
      this.sleepSettings.sleepReminderEnabled = !!settings.sleepReminderEnabled;
      this.sleepSettings.sleepCutoff = settings.sleepCutoff || this.sleepSettings.sleepCutoff;
      this.sleepSettings.sleepNagIntervalMinutes = settings.sleepNagIntervalMinutes || this.sleepSettings.sleepNagIntervalMinutes;
      if (settings.frequencySettings) {
        this.frequencySettings = { ...this.frequencySettings, ...settings.frequencySettings };
      }
      this.configureSleepAlarm();
      sendResponse({ success: true });
    });
  }

  configureSleepAlarm() {
    // 清理旧闹钟
    chrome.alarms.clear('sleep-check');
    if (this.sleepSettings.sleepReminderEnabled) {
      // 每分钟检查一次
      chrome.alarms.create('sleep-check', { periodInMinutes: 1 });
    }
  }
  
  setupDailyReset() {
    // 每天凌晨重置访问计数器
    chrome.alarms.clear('daily-reset');
    chrome.alarms.create('daily-reset', { 
      when: this.getNextMidnight(),
      periodInMinutes: 1440 // 24小时
    });
    
    // 监听每日重置闹钟
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'daily-reset') {
        this.resetDailyCounts();
      }
    });
  }
  
  getNextMidnight() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0); // 设置为明天凌晨
    return midnight.getTime();
  }
  
  resetDailyCounts() {
    this.dailyAccessCount = {};
    chrome.storage.local.set({ dailyAccessCount: {} });
    console.log('Daily access counts reset');
  }

  async handleSleepAlarm() {
    try {
      // 若未启用或监控未启用，直接返回
      if (!this.sleepSettings.sleepReminderEnabled || this.isEnabled === false) return;

      // 检查是否处于snooze期
      const { sleepLastNotifyAt, sleepSnoozeUntil } = await chrome.storage.local.get(['sleepLastNotifyAt', 'sleepSnoozeUntil']);
      const now = new Date();
      if (sleepSnoozeUntil && new Date(sleepSnoozeUntil) > now) {
        return;
      }

      // 仅在有活动标签且为http(s)时提醒
      const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      const activeTab = tabs && tabs[0];
      if (!activeTab || !activeTab.url || !/^https?:/i.test(activeTab.url)) return;

      // 是否超过设定时间
      if (!this.isPastCutoff(now, this.sleepSettings.sleepCutoff)) return;

      // 节流：按照提醒间隔控制频率
      if (sleepLastNotifyAt) {
        const last = new Date(sleepLastNotifyAt);
        const diffMinutes = (now - last) / 60000;
        if (diffMinutes < (this.sleepSettings.sleepNagIntervalMinutes || 30)) {
          return;
        }
      }

      await this.showSleepNotification();
      await chrome.storage.local.set({ sleepLastNotifyAt: now.toISOString() });
    } catch (e) {
      console.error('Sleep alarm error:', e);
    }
  }

  isPastCutoff(now, cutoffHHMM) {
    const [hh, mm] = (cutoffHHMM || '23:30').split(':').map(n => parseInt(n, 10));
    if (isNaN(hh) || isNaN(mm)) return false;
    const cutoff = new Date(now);
    cutoff.setHours(hh, mm, 0, 0);
    // 如果设定是晚上时间，过了当天该时间就提示；若用户设定清晨时间也允许跨日处理
    if (now >= cutoff) return true;
    return false;
  }

  showSleepNotification() {
    return new Promise((resolve) => {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: '作息提醒',
        message: '已经超过设定的睡觉时间了，建议尽快休息。',
        buttons: [
          { title: '知道了' },
          { title: '稍后提醒' }
        ]
      }, (notificationId) => {
        this.sleepNotificationId = notificationId;
        resolve();
      });
    });
  }
  
  getWarningHistory(sendResponse) {
    sendResponse({ history: this.warningHistory });
  }
  
  getDailyStatistics(sendResponse) {
    const today = new Date().toDateString();
    const todayStats = this.dailyAccessCount[today] || {};
    const totalDailyAccess = Object.values(todayStats).reduce((sum, count) => sum + count, 0);
    
    // Get weekly statistics
    const weeklyStats = this.getWeeklyStatistics();
    
    sendResponse({
      daily: {
        date: today,
        accessCount: todayStats,
        totalAccess: totalDailyAccess
      },
      weekly: weeklyStats,
      frequencySettings: this.frequencySettings
    });
  }
  
  getWeeklyStatistics() {
    const weeklyStats = {};
    const today = new Date();
    
    // Get stats for the last 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toDateString();
      const dayStats = this.dailyAccessCount[dateStr] || {};
      const totalAccess = Object.values(dayStats).reduce((sum, count) => sum + count, 0);
      
      weeklyStats[dateStr] = {
        accessCount: dayStats,
        totalAccess: totalAccess
      };
    }
    
    return weeklyStats;
  }
  
  clearWarningHistory(sendResponse) {
    this.warningHistory = [];
    chrome.storage.local.set({ warningHistory: [] }, () => {
      sendResponse({ success: true });
    });
  }
}

// 启动后台服务
globalThis.backgroundService = new BackgroundService();

// 监听通知点击
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId === this.currentNotificationId) {
    // 打开popup页面
    chrome.action.openPopup();
  } else if (notificationId === (globalThis.backgroundService?.sleepNotificationId || null)) {
    // 点击睡觉提醒时，默认视为确认
    chrome.notifications.clear(notificationId);
  }
});

// 监听通知按钮点击
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (notificationId === this.currentNotificationId) {
    if (buttonIndex === 0) {
      // 查看详情
      chrome.action.openPopup();
    } else if (buttonIndex === 1) {
      // 忽略
      chrome.notifications.clear(notificationId);
    }
  } else if (notificationId === (globalThis.backgroundService?.sleepNotificationId || null)) {
    if (buttonIndex === 0) {
      // 知道了
      chrome.notifications.clear(notificationId);
    } else if (buttonIndex === 1) {
      // 稍后提醒 -> 设置snooze直到间隔后
      const minutes = (globalThis.backgroundService?.sleepSettings?.sleepNagIntervalMinutes) || 30;
      const snoozeUntil = new Date(Date.now() + minutes * 60000).toISOString();
      chrome.storage.local.set({ sleepSnoozeUntil: snoozeUntil }, () => {
        chrome.notifications.clear(notificationId);
      });
    }
  }
});

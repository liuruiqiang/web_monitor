// 后台服务脚本
class BackgroundService {
  constructor() {
    this.warningHistory = [];
    this.isEnabled = true;
    
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
    
    // 保存到存储
    chrome.storage.local.set({
      warningHistory: this.warningHistory
    });
    
    // 显示通知
    this.showNotification(warning);
    
    // 记录到控制台
    console.log('Content Security Warning:', warning);
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
      const result = await chrome.storage.local.get(['warningHistory', 'settings']);
      
      if (result.warningHistory) {
        this.warningHistory = result.warningHistory;
      }
      
      if (result.settings) {
        this.isEnabled = result.settings.enabled !== false;
      }
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
        blockedDomains: []
      };
      
      sendResponse({
        settings: { ...defaultSettings, ...result.settings }
      });
    });
  }
  
  updateSettings(settings, sendResponse) {
    chrome.storage.local.set({ settings }, () => {
      this.isEnabled = settings.enabled !== false;
      sendResponse({ success: true });
    });
  }
  
  getWarningHistory(sendResponse) {
    sendResponse({ history: this.warningHistory });
  }
  
  clearWarningHistory(sendResponse) {
    this.warningHistory = [];
    chrome.storage.local.set({ warningHistory: [] }, () => {
      sendResponse({ success: true });
    });
  }
}

// 启动后台服务
new BackgroundService();

// 监听通知点击
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId === this.currentNotificationId) {
    // 打开popup页面
    chrome.action.openPopup();
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
  }
});

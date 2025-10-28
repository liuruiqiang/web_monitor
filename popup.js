// Popup 脚本
class PopupController {
  constructor() {
    this.settings = {
      enabled: true,
      strictMode: false,
      customKeywords: [],
      blockedDomains: []
    };
    
    this.warningHistory = [];
    
    this.init();
  }
  
  async init() {
    await this.loadSettings();
    await this.loadWarningHistory();
    await this.loadDetectionDetails();
    this.setupEventListeners();
    this.updateUI();
  }
  
  async loadSettings() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
        if (response && response.settings) {
          this.settings = response.settings;
        }
        resolve();
      });
    });
  }
  
  async loadWarningHistory() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_HISTORY' }, (response) => {
        if (response && response.history) {
          this.warningHistory = response.history;
        }
        resolve();
      });
    });
  }
  
  async loadDetectionDetails() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['detectionDetails'], (result) => {
        this.detectionDetails = result.detectionDetails || [];
        resolve();
      });
    });
  }
  
  setupEventListeners() {
    // 监控开关
    document.getElementById('monitorToggle').addEventListener('click', () => {
      this.toggleMonitoring();
    });
    
    // 设置按钮
    document.getElementById('settingsBtn').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
    
    // 历史按钮
    document.getElementById('historyBtn').addEventListener('click', () => {
      this.showHistory();
    });
    
    // 清除按钮
    document.getElementById('clearBtn').addEventListener('click', () => {
      this.clearHistory();
    });
    
    // 帮助链接
    document.getElementById('helpLink').addEventListener('click', (e) => {
      e.preventDefault();
      this.showHelp();
    });
    
    // 关于链接
    document.getElementById('aboutLink').addEventListener('click', (e) => {
      e.preventDefault();
      this.showAbout();
    });
  }
  
  toggleMonitoring() {
    this.settings.enabled = !this.settings.enabled;
    
    chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: this.settings
    }, (response) => {
      if (response && response.success) {
        this.updateUI();
        
        // 通知内容脚本
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
              type: 'TOGGLE_MONITORING',
              enabled: this.settings.enabled
            });
          }
        });
      }
    });
  }
  
  updateUI() {
    // 更新状态显示
    const statusElement = document.getElementById('status');
    const toggleElement = document.getElementById('monitorToggle');
    
    if (this.settings.enabled) {
      statusElement.textContent = '监控已启用';
      statusElement.className = 'status enabled';
      toggleElement.classList.add('active');
    } else {
      statusElement.textContent = '监控已禁用';
      statusElement.className = 'status disabled';
      toggleElement.classList.remove('active');
    }
    
    // 更新统计数据
    this.updateStats();
    
    // 更新最近警告
    this.updateRecentWarnings();
  }
  
  updateStats() {
    const totalWarnings = this.warningHistory.length;
    const today = new Date().toDateString();
    const todayWarnings = this.warningHistory.filter(warning => 
      new Date(warning.timestamp).toDateString() === today
    ).length;
    
    document.getElementById('totalWarnings').textContent = totalWarnings;
    document.getElementById('todayWarnings').textContent = todayWarnings;
  }
  
  updateRecentWarnings() {
    const container = document.getElementById('recentWarnings');
    const recentWarnings = this.warningHistory.slice(-5).reverse();
    
    if (recentWarnings.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: #999; padding: 20px;">
          暂无警告记录
        </div>
      `;
      return;
    }
    
    container.innerHTML = recentWarnings.map(warning => `
      <div class="warning-item">
        <div class="warning-time">
          ${this.formatTime(warning.timestamp)}
        </div>
        <div class="warning-message">
          ${warning.message}
        </div>
      </div>
    `).join('');
  }
  
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) { // 1分钟内
      return '刚刚';
    } else if (diff < 3600000) { // 1小时内
      return `${Math.floor(diff / 60000)}分钟前`;
    } else if (diff < 86400000) { // 24小时内
      return `${Math.floor(diff / 3600000)}小时前`;
    } else {
      return date.toLocaleDateString();
    }
  }
  
  showHistory() {
    // 创建历史记录弹窗
    const historyWindow = window.open('', '_blank', 'width=800,height=600');
    historyWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>警告历史记录</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .warning-item { 
            border: 1px solid #ddd; 
            padding: 15px; 
            margin-bottom: 10px; 
            border-radius: 5px; 
          }
          .warning-time { color: #666; font-size: 12px; }
          .warning-url { color: #0066cc; font-size: 12px; margin-top: 5px; }
          .warning-message { margin-top: 5px; }
          .detection-details {
            background: #f8f9fa;
            padding: 10px;
            margin-top: 10px;
            border-radius: 3px;
            font-size: 12px;
          }
          .detection-reason {
            color: #dc3545;
            font-weight: bold;
          }
          .detection-content {
            color: #666;
            margin-top: 5px;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <h2>警告历史记录</h2>
        ${this.warningHistory.map(warning => {
          const details = this.detectionDetails.filter(d => d.url === warning.url && d.timestamp === warning.timestamp);
          return `
            <div class="warning-item">
              <div class="warning-time">${new Date(warning.timestamp).toLocaleString()}</div>
              <div class="warning-message">${warning.message}</div>
              <div class="warning-url">${warning.url}</div>
              ${details.length > 0 ? `
                <div class="detection-details">
                  <div class="detection-reason">检测详情:</div>
                  ${details.map(detail => `
                    <div>
                      <strong>${detail.type}:</strong> ${detail.reason}
                      <div class="detection-content">内容: ${detail.content}</div>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </body>
      </html>
    `);
  }
  
  clearHistory() {
    if (confirm('确定要清除所有警告历史记录吗？')) {
      chrome.runtime.sendMessage({ type: 'CLEAR_HISTORY' }, (response) => {
        if (response && response.success) {
          this.warningHistory = [];
          this.updateUI();
        }
      });
    }
  }
  
  showHelp() {
    alert(`内容安全监控器使用帮助：

1. 监控功能：
   - 自动检测网页中的不当内容
   - 监控视频元素和网络请求
   - 实时警告可疑内容

2. 设置选项：
   - 启用/禁用监控
   - 自定义关键词
   - 添加屏蔽域名

3. 警告处理：
   - 点击"离开页面"跳转到安全页面
   - 点击"忽略警告"继续浏览

4. 历史记录：
   - 查看所有警告记录
   - 统计每日警告数量`);
  }
  
  showAbout() {
    alert(`内容安全监控器 v1.0.0

这是一个浏览器扩展插件，用于监控网页内容并检测不当信息。

功能特点：
- 实时内容监控
- 智能关键词检测
- 视频内容过滤
- 警告历史记录
- 可自定义设置

开发者：AI Assistant
版本：1.0.0
更新日期：${new Date().toLocaleDateString()}`);
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});


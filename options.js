// 设置页面脚本
class OptionsController {
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
  
  setupEventListeners() {
    // 启用开关
    document.getElementById('enableToggle').addEventListener('click', () => {
      this.toggleSetting('enabled');
    });
    
    // 严格模式开关
    document.getElementById('strictToggle').addEventListener('click', () => {
      this.toggleSetting('strictMode');
    });
    
    // 自定义关键词输入
    document.getElementById('customKeywords').addEventListener('input', () => {
      this.updateCustomKeywords();
    });
    
    // 屏蔽域名输入
    document.getElementById('blockedDomains').addEventListener('input', () => {
      this.updateBlockedDomains();
    });
    
    // 保存按钮
    document.getElementById('saveBtn').addEventListener('click', () => {
      this.saveSettings();
    });
    
    // 重置按钮
    document.getElementById('resetBtn').addEventListener('click', () => {
      this.resetSettings();
    });
    
    // 清除历史按钮
    document.getElementById('clearHistoryBtn').addEventListener('click', () => {
      this.clearHistory();
    });
  }
  
  toggleSetting(settingName) {
    this.settings[settingName] = !this.settings[settingName];
    this.updateToggleUI(settingName);
  }
  
  updateToggleUI(settingName) {
    const toggleElement = document.getElementById(settingName === 'enabled' ? 'enableToggle' : 'strictToggle');
    const statusElement = document.getElementById(settingName === 'enabled' ? 'enableStatus' : 'strictStatus');
    
    if (this.settings[settingName]) {
      toggleElement.classList.add('active');
      statusElement.textContent = settingName === 'enabled' ? '已启用' : '已启用';
    } else {
      toggleElement.classList.remove('active');
      statusElement.textContent = settingName === 'enabled' ? '已禁用' : '已禁用';
    }
  }
  
  updateCustomKeywords() {
    const textarea = document.getElementById('customKeywords');
    const keywords = textarea.value
      .split('\n')
      .map(keyword => keyword.trim())
      .filter(keyword => keyword.length > 0);
    
    this.settings.customKeywords = keywords;
    this.updateKeywordList();
  }
  
  updateKeywordList() {
    const container = document.getElementById('keywordList');
    
    if (this.settings.customKeywords.length === 0) {
      container.innerHTML = '<div style="color: #999; font-style: italic;">暂无自定义关键词</div>';
      return;
    }
    
    container.innerHTML = this.settings.customKeywords.map(keyword => `
      <div class="keyword-tag">
        ${keyword}
        <span class="remove" onclick="optionsController.removeKeyword('${keyword}')">×</span>
      </div>
    `).join('');
  }
  
  removeKeyword(keyword) {
    this.settings.customKeywords = this.settings.customKeywords.filter(k => k !== keyword);
    this.updateKeywordList();
    this.updateCustomKeywordsTextarea();
  }
  
  updateCustomKeywordsTextarea() {
    document.getElementById('customKeywords').value = this.settings.customKeywords.join('\n');
  }
  
  updateBlockedDomains() {
    const textarea = document.getElementById('blockedDomains');
    const domains = textarea.value
      .split('\n')
      .map(domain => domain.trim())
      .filter(domain => domain.length > 0);
    
    this.settings.blockedDomains = domains;
  }
  
  updateUI() {
    // 更新开关状态
    this.updateToggleUI('enabled');
    this.updateToggleUI('strictMode');
    
    // 更新自定义关键词
    this.updateCustomKeywordsTextarea();
    this.updateKeywordList();
    
    // 更新屏蔽域名
    document.getElementById('blockedDomains').value = this.settings.blockedDomains.join('\n');
    
    // 更新统计信息
    this.updateStats();
  }
  
  updateStats() {
    const totalWarnings = this.warningHistory.length;
    const today = new Date().toDateString();
    const todayWarnings = this.warningHistory.filter(warning => 
      new Date(warning.timestamp).toDateString() === today
    ).length;
    
    document.getElementById('totalWarnings').textContent = totalWarnings;
    document.getElementById('todayWarnings').textContent = todayWarnings;
    document.getElementById('blockedSites').textContent = this.settings.blockedDomains.length;
    document.getElementById('customKeywordsCount').textContent = this.settings.customKeywords.length;
  }
  
  async saveSettings() {
    try {
      await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: 'UPDATE_SETTINGS',
          settings: this.settings
        }, (response) => {
          if (response && response.success) {
            resolve();
          } else {
            reject(new Error('Failed to save settings'));
          }
        });
      });
      
      this.showSuccessMessage();
    } catch (error) {
      alert('保存设置失败，请重试');
      console.error('Save settings error:', error);
    }
  }
  
  showSuccessMessage() {
    const messageElement = document.getElementById('successMessage');
    messageElement.style.display = 'block';
    
    setTimeout(() => {
      messageElement.style.display = 'none';
    }, 3000);
  }
  
  resetSettings() {
    if (confirm('确定要重置所有设置为默认值吗？')) {
      this.settings = {
        enabled: true,
        strictMode: false,
        customKeywords: [],
        blockedDomains: []
      };
      
      this.updateUI();
    }
  }
  
  clearHistory() {
    if (confirm('确定要清除所有警告历史记录吗？此操作不可撤销。')) {
      chrome.runtime.sendMessage({ type: 'CLEAR_HISTORY' }, (response) => {
        if (response && response.success) {
          this.warningHistory = [];
          this.updateStats();
          alert('历史记录已清除');
        } else {
          alert('清除历史记录失败，请重试');
        }
      });
    }
  }
}

// 全局变量，供HTML中的onclick使用
let optionsController;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  optionsController = new OptionsController();
});



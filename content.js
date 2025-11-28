// 内容安全监控器 - 内容脚本
class ContentMonitor {
  constructor() {
    this.suspiciousKeywords = [
      // 中文关键词
      '色情', '黄色', '淫秽', '裸体', '性爱', '情色', '成人视频',
      '成人电影', '色情网站', '成人网站', '黄色网站', '成人内容', '色情内容',
      // 英文关键词 - 更精确的匹配
      'porn', 'pornography', 'nude', 'naked', 'erotic',
      'adult video', 'adult movie', 'adult content', 'adult site', 'porn site',
      'adultfilm', 'adultvideo', 'adultmovie', 'adultcontent'
    ];
    
    this.suspiciousDomains = [
      'pornhub', 'xvideos', 'redtube', 'youporn', 'tube8', 'beeg', 'xhamster',
      'adultfriendfinder', 'adultswim', 'adultcontent', 'adultvideo', 'adultmovie',
      'xxx.com', 'xxx.net', 'xxx.org', 'porn.com', 'porn.net', 'porn.org',
      'sex.com', 'sex.net', 'sex.org', 'nude.com', 'nude.net', 'nude.org',
      'erotic.com', 'erotic.net', 'erotic.org'
    ];
    
    this.isMonitoring = true;
    this.warningShown = false;
    this.debugMode = false; // 调试模式，设置为true可以看到检测过程
    
    // 白名单域名 - 这些网站不会被检测
    this.whitelistDomains = [
      // 'google.com', 'baidu.com', 'bing.com', 'yahoo.com',
      // 'wikipedia.org', 'github.com', 'stackoverflow.com',
      // 'microsoft.com', 'apple.com', 'adobe.com',
      // 'youtube.com', 'netflix.com', 'amazon.com',
      // 'facebook.com', 'twitter.com', 'linkedin.com',
      // 'adultswim.com', 'adultswim.net' // Adult Swim 是正常的动画频道
    ];
    
    this.init();
  }
  
  async init() {
    // 检查当前页面
    await this.checkCurrentPage();
    
    // 监听页面变化
    this.observePageChanges();
    
    // 监听视频元素
    this.monitorVideoElements();
    
    // 监听网络请求
    this.monitorNetworkRequests();
  }
  
  async checkCurrentPage() {
    const url = window.location.href.toLowerCase();
    const title = document.title.toLowerCase();
    const bodyText = document.body ? document.body.innerText.toLowerCase() : '';
    
    if (this.debugMode) {
      console.log('🔍 内容安全监控器 - 检查页面:', {
        url: window.location.href,
        title: document.title,
        bodyLength: bodyText.length
      });
    }
    
    // 首先检查白名单
    if (this.isWhitelisted(url)) {
      if (this.debugMode) {
        console.log('✅ 页面在白名单中，跳过检测');
      }
      return; // 白名单网站直接跳过检测
    }
    
    // 检查频率阻止
    const shouldBlock = await this.checkDomainBlocking(url);
    if (shouldBlock) {
      this.showWarning(`🚫 根据访问频率限制，此网站已被阻止\n原因: 今日访问次数已达到设定上限`);
      this.logDetection('频率阻止', '访问次数超限', window.location.href);
      return;
    }
    
    // 立即检查URL - 最高优先级
    const urlCheck = this.checkSuspiciousUrl(url);
    if (urlCheck.found) {
      this.showWarning(`🚫 检测到成人网站URL，页面已被阻止\n原因: ${urlCheck.reason}`);
      this.logDetection('URL检测', urlCheck.reason, window.location.href);
      return;
    }
    
    // 检查标题
    const titleCheck = this.checkSuspiciousContent(title);
    if (titleCheck.found) {
      this.showWarning(`🚫 检测到不当页面标题，页面已被阻止\n原因: ${titleCheck.reason}`);
      this.logDetection('标题检测', titleCheck.reason, document.title);
      return;
    }
    
    // 检查页面内容
    const contentCheck = this.checkSuspiciousContent(bodyText);
    if (contentCheck.found) {
      this.showWarning(`🚫 检测到不当页面内容，页面已被阻止\n原因: ${contentCheck.reason}`);
      this.logDetection('内容检测', contentCheck.reason, bodyText.substring(0, 200) + '...');
      return;
    }
    
    // 检查页面中的图片alt属性和src
    const images = document.querySelectorAll('img');
    for (let img of images) {
      const alt = (img.alt || '').toLowerCase();
      const src = (img.src || '').toLowerCase();
      
      const altCheck = this.checkSuspiciousContent(alt);
      if (altCheck.found) {
        this.showWarning(`🚫 检测到不当图片内容，页面已被阻止\n原因: ${altCheck.reason}`);
        this.logDetection('图片ALT检测', altCheck.reason, img.alt);
        return;
      }
      
      const srcCheck = this.checkSuspiciousUrl(src);
      if (srcCheck.found) {
        this.showWarning(`🚫 检测到不当图片内容，页面已被阻止\n原因: ${srcCheck.reason}`);
        this.logDetection('图片SRC检测', srcCheck.reason, img.src);
        return;
      }
    }
    
    // 检查所有链接
    const links = document.querySelectorAll('a');
    for (let link of links) {
      const href = (link.href || '').toLowerCase();
      const text = (link.textContent || '').toLowerCase();
      
      const hrefCheck = this.checkSuspiciousUrl(href);
      if (hrefCheck.found) {
        this.showWarning(`🚫 检测到不当链接内容，页面已被阻止\n原因: ${hrefCheck.reason}`);
        this.logDetection('链接HREF检测', hrefCheck.reason, link.href);
        return;
      }
      
      const textCheck = this.checkSuspiciousContent(text);
      if (textCheck.found) {
        this.showWarning(`🚫 检测到不当链接内容，页面已被阻止\n原因: ${textCheck.reason}`);
        this.logDetection('链接文本检测', textCheck.reason, link.textContent);
        return;
      }
    }
  }
  
  checkSuspiciousUrl(url) {
    for (let domain of this.suspiciousDomains) {
      if (url.includes(domain)) {
        return { 
          found: true, 
          reason: `检测到可疑域名: "${domain}"`,
          domain: domain
        };
      }
    }
    return { found: false, reason: null };
  }
  
  // Check if domain access should be blocked based on frequency
  async checkDomainBlocking(url) {
    return new Promise((resolve) => {
      // Send message to background script to check if domain should be blocked
      chrome.runtime.sendMessage({
        type: 'CHECK_DOMAIN_BLOCKING',
        url: url
      }, (response) => {
        resolve(response?.shouldBlock || false);
      });
    });
  }
  
  isWhitelisted(url) {
    return this.whitelistDomains.some(domain => url.includes(domain));
  }
  
  // 记录检测详情
  logDetection(type, reason, content) {
    const detection = {
      type: type,
      reason: reason,
      content: content,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };
    
    if (this.debugMode) {
      console.log('🚨 内容安全检测详情:', detection);
    }
    
    // 发送到后台脚本
    chrome.runtime.sendMessage({
      type: 'DETECTION_DETAIL',
      detection: detection
    });
  }
  
  checkSuspiciousContent(text) {
    if (!text || text.length < 3) return { found: false, reason: null };
    
    // 使用更精确的匹配，避免误报
    for (let keyword of this.suspiciousKeywords) {
      const lowerText = text.toLowerCase();
      const lowerKeyword = keyword.toLowerCase();
      
      let found = false;
      
      // 对于短关键词，使用单词边界匹配
      if (lowerKeyword.length <= 4) {
        const regex = new RegExp(`\\b${lowerKeyword}\\b`, 'i');
        found = regex.test(lowerText);
      } else {
        // 对于长关键词，使用包含匹配
        found = lowerText.includes(lowerKeyword);
      }
      
      if (found) {
        return { 
          found: true, 
          reason: `检测到关键词: "${keyword}"`,
          keyword: keyword
        };
      }
    }
    
    return { found: false, reason: null };
  }
  
  observePageChanges() {
    // 监听DOM变化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.checkNewContent(node);
            }
          });
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  checkNewContent(element) {
    if (!this.isMonitoring || this.warningShown) return;
    
    // 检查当前页面是否在白名单中
    if (this.isWhitelisted(window.location.href)) {
      return;
    }
    
    const text = element.innerText ? element.innerText.toLowerCase() : '';
    const src = element.src ? element.src.toLowerCase() : '';
    const href = element.href ? element.href.toLowerCase() : '';
    const alt = element.alt ? element.alt.toLowerCase() : '';
    
    // 立即检查所有可疑内容
    const textCheck = this.checkSuspiciousContent(text);
    if (textCheck.found) {
      this.showWarning(`🚫 检测到新加载的不当内容，页面已被阻止\n原因: ${textCheck.reason}`);
      this.logDetection('动态内容检测', textCheck.reason, text);
      return;
    }
    
    const srcCheck = this.checkSuspiciousUrl(src);
    if (srcCheck.found) {
      this.showWarning(`🚫 检测到新加载的不当内容，页面已被阻止\n原因: ${srcCheck.reason}`);
      this.logDetection('动态SRC检测', srcCheck.reason, src);
      return;
    }
    
    const hrefCheck = this.checkSuspiciousUrl(href);
    if (hrefCheck.found) {
      this.showWarning(`🚫 检测到新加载的不当内容，页面已被阻止\n原因: ${hrefCheck.reason}`);
      this.logDetection('动态HREF检测', hrefCheck.reason, href);
      return;
    }
    
    const altCheck = this.checkSuspiciousContent(alt);
    if (altCheck.found) {
      this.showWarning(`🚫 检测到新加载的不当内容，页面已被阻止\n原因: ${altCheck.reason}`);
      this.logDetection('动态ALT检测', altCheck.reason, alt);
      return;
    }
    
    // 检查子元素
    const children = element.querySelectorAll('*');
    for (let child of children) {
      const childText = child.innerText ? child.innerText.toLowerCase() : '';
      const childSrc = child.src ? child.src.toLowerCase() : '';
      const childHref = child.href ? child.href.toLowerCase() : '';
      const childAlt = child.alt ? child.alt.toLowerCase() : '';
      
      const childTextCheck = this.checkSuspiciousContent(childText);
      if (childTextCheck.found) {
        this.showWarning(`🚫 检测到子元素中的不当内容，页面已被阻止\n原因: ${childTextCheck.reason}`);
        this.logDetection('子元素文本检测', childTextCheck.reason, childText);
        return;
      }
      
      const childSrcCheck = this.checkSuspiciousUrl(childSrc);
      if (childSrcCheck.found) {
        this.showWarning(`🚫 检测到子元素中的不当内容，页面已被阻止\n原因: ${childSrcCheck.reason}`);
        this.logDetection('子元素SRC检测', childSrcCheck.reason, childSrc);
        return;
      }
      
      const childHrefCheck = this.checkSuspiciousUrl(childHref);
      if (childHrefCheck.found) {
        this.showWarning(`🚫 检测到子元素中的不当内容，页面已被阻止\n原因: ${childHrefCheck.reason}`);
        this.logDetection('子元素HREF检测', childHrefCheck.reason, childHref);
        return;
      }
      
      const childAltCheck = this.checkSuspiciousContent(childAlt);
      if (childAltCheck.found) {
        this.showWarning(`🚫 检测到子元素中的不当内容，页面已被阻止\n原因: ${childAltCheck.reason}`);
        this.logDetection('子元素ALT检测', childAltCheck.reason, childAlt);
        return;
      }
    }
  }
  
  monitorVideoElements() {
    // 检查现有视频元素
    const videos = document.querySelectorAll('video');
    videos.forEach(video => this.checkVideoElement(video));
    
    // 监听新添加的视频元素
    const videoObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'VIDEO') {
              this.checkVideoElement(node);
            }
            // 检查子元素中的视频
            const childVideos = node.querySelectorAll('video');
            childVideos.forEach(video => this.checkVideoElement(video));
          }
        });
      });
    });
    
    videoObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  checkVideoElement(video) {
    if (!this.isMonitoring || this.warningShown) return;
    
    // 检查当前页面是否在白名单中
    if (this.isWhitelisted(window.location.href)) {
      return;
    }
    
    const src = video.src ? video.src.toLowerCase() : '';
    const poster = video.poster ? video.poster.toLowerCase() : '';
    
    const srcCheck = this.checkSuspiciousUrl(src);
    if (srcCheck.found) {
      this.showWarning(`🚫 检测到不当视频内容，页面已被阻止\n原因: ${srcCheck.reason}`);
      this.logDetection('视频SRC检测', srcCheck.reason, video.src);
      // 立即暂停并隐藏视频
      video.pause();
      video.style.display = 'none';
      video.controls = false;
      return;
    }
    
    const posterCheck = this.checkSuspiciousUrl(poster);
    if (posterCheck.found) {
      this.showWarning(`🚫 检测到不当视频内容，页面已被阻止\n原因: ${posterCheck.reason}`);
      this.logDetection('视频POSTER检测', posterCheck.reason, video.poster);
      // 立即暂停并隐藏视频
      video.pause();
      video.style.display = 'none';
      video.controls = false;
      return;
    }
    
    // 检查视频标题和描述
    const title = video.title ? video.title.toLowerCase() : '';
    const titleCheck = this.checkSuspiciousContent(title);
    if (titleCheck.found) {
      this.showWarning(`🚫 检测到不当视频元数据，页面已被阻止\n原因: ${titleCheck.reason}`);
      this.logDetection('视频标题检测', titleCheck.reason, video.title);
      video.pause();
      video.style.display = 'none';
      video.controls = false;
      return;
    }
    
    const dataset = video.dataset;
    for (let key in dataset) {
      const datasetCheck = this.checkSuspiciousContent(dataset[key].toLowerCase());
      if (datasetCheck.found) {
        this.showWarning(`🚫 检测到不当视频元数据，页面已被阻止\n原因: ${datasetCheck.reason}`);
        this.logDetection('视频元数据检测', datasetCheck.reason, `${key}: ${dataset[key]}`);
        video.pause();
        video.style.display = 'none';
        video.controls = false;
        return;
      }
    }
  }
  
  monitorNetworkRequests() {
    // 监听fetch请求
    const originalFetch = window.fetch;
    window.fetch = (...args) => {
      const url = args[0];
      if (typeof url === 'string' && !this.isWhitelisted(url)) {
        const urlCheck = this.checkSuspiciousUrl(url.toLowerCase());
        if (urlCheck.found) {
          this.showWarning(`🚫 检测到不当网络请求，页面已被阻止\n原因: ${urlCheck.reason}`);
          this.logDetection('网络请求检测', urlCheck.reason, url);
          return Promise.reject(new Error('Request blocked by content security monitor'));
        }
      }
      return originalFetch.apply(this, args);
    };
    
    // 监听XMLHttpRequest
    const originalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
      const xhr = new originalXHR();
      const originalOpen = xhr.open;
      xhr.open = function(method, url) {
        if (typeof url === 'string' && !this.isWhitelisted(url)) {
          const urlCheck = this.checkSuspiciousUrl(url.toLowerCase());
          if (urlCheck.found) {
            this.showWarning(`🚫 检测到不当网络请求，页面已被阻止\n原因: ${urlCheck.reason}`);
            this.logDetection('XMLHttpRequest检测', urlCheck.reason, url);
            return;
          }
        }
        return originalOpen.apply(this, arguments);
      }.bind(this);
      return xhr;
    }.bind(this);
    
    // 监听图片加载
    const originalImage = window.Image;
    window.Image = function() {
      const img = new originalImage();
      const originalSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
      Object.defineProperty(img, 'src', {
        set: function(value) {
          if (!this.isWhitelisted(value)) {
            const urlCheck = this.checkSuspiciousUrl(value.toLowerCase());
            if (urlCheck.found) {
              this.showWarning(`🚫 检测到不当图片请求，页面已被阻止\n原因: ${urlCheck.reason}`);
              this.logDetection('图片请求检测', urlCheck.reason, value);
              return;
            }
          }
          originalSrc.set.call(this, value);
        }.bind(this),
        get: originalSrc.get
      });
      return img;
    }.bind(this);
  }
  
  showWarning(message) {
    if (this.warningShown) return;
    
    this.warningShown = true;
    
    // 立即阻止页面内容加载和交互
    this.blockPageContent();
    
    // 创建全屏阻止界面
    const warningDiv = document.createElement('div');
    warningDiv.id = 'content-security-warning';
    warningDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%);
        z-index: 999999;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: Arial, sans-serif;
        color: white;
      ">
        <div style="
          background: rgba(255, 255, 255, 0.95);
          padding: 40px;
          border-radius: 15px;
          text-align: center;
          max-width: 600px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          color: #333;
        ">
          <div style="
            font-size: 64px;
            color: #ff4444;
            margin-bottom: 20px;
          ">🚫</div>
          <h1 style="
            color: #d32f2f;
            margin-bottom: 20px;
            font-size: 28px;
            font-weight: bold;
          ">页面已被阻止</h1>
          <h2 style="
            color: #333;
            margin-bottom: 20px;
            font-size: 20px;
          ">检测到不当内容</h2>
          <p style="
            color: #666;
            margin-bottom: 25px;
            font-size: 16px;
            line-height: 1.6;
          ">${message}</p>
          <div style="
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 30px;
            font-size: 14px;
          ">
            <strong>⚠️ 安全提醒：</strong>此页面包含不当内容，已被自动阻止。为了您的安全，建议立即离开此页面。
          </div>
          <div style="
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
          ">
            <button id="leave-page-btn" style="
              background: #d32f2f;
              color: white;
              border: none;
              padding: 15px 30px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 16px;
              font-weight: bold;
              transition: background 0.3s;
            ">立即离开</button>
            <button id="go-home-btn" style="
              background: #1976d2;
              color: white;
              border: none;
              padding: 15px 30px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 16px;
              font-weight: bold;
              transition: background 0.3s;
            ">返回首页</button>
            <button id="emergency-btn" style="
              background: #f57c00;
              color: white;
              border: none;
              padding: 15px 30px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 16px;
              font-weight: bold;
              transition: background 0.3s;
            ">紧急退出</button>
          </div>
          <div style="
            margin-top: 20px;
            font-size: 12px;
            color: #999;
          ">
            页面已被内容安全监控器阻止 | 时间: ${new Date().toLocaleString()}
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(warningDiv);
    
    // 添加事件监听器
    document.getElementById('leave-page-btn').addEventListener('click', () => {
      window.location.href = 'https://www.google.com';
    });
    
    document.getElementById('go-home-btn').addEventListener('click', () => {
      window.location.href = 'https://www.baidu.com';
    });
    
    document.getElementById('emergency-btn').addEventListener('click', () => {
      // 尝试关闭当前标签页
      window.close();
      // 如果无法关闭，则跳转到安全页面
      setTimeout(() => {
        window.location.href = 'https://www.google.com';
      }, 100);
    });
    
    // 发送消息到后台脚本
    chrome.runtime.sendMessage({
      type: 'CONTENT_WARNING',
      url: window.location.href,
      message: message,
      timestamp: new Date().toISOString()
    });
  }
  
  // 阻止页面内容的新方法
  blockPageContent() {
    // 阻止所有脚本执行
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      if (script.src) {
        script.remove();
      } else {
        script.textContent = '// 脚本已被内容安全监控器阻止';
      }
    });
    
    // 阻止所有图片加载
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZmNDQ0NCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuKdpO+4jzwvdGV4dD48L3N2Zz4=';
      img.alt = '图片已被阻止';
    });
    
    // 阻止所有视频播放
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      video.pause();
      video.controls = false;
      video.style.display = 'none';
    });
    
    // 阻止所有音频播放
    const audios = document.querySelectorAll('audio');
    audios.forEach(audio => {
      audio.pause();
      audio.controls = false;
      audio.style.display = 'none';
    });
    
    // 阻止所有链接点击
    const links = document.querySelectorAll('a');
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      });
    });
    
    // 阻止所有表单提交
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      });
    });
    
    // 阻止页面滚动
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    // 阻止右键菜单
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });
    
    // 阻止键盘快捷键
    document.addEventListener('keydown', (e) => {
      // 允许F5刷新和Ctrl+R，其他都阻止
      if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      return false;
    });
    
    // 阻止拖拽
    document.addEventListener('dragstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });
    
    // 阻止选择文本
    document.addEventListener('selectstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });
  }
  
  // 暂停监控
  pauseMonitoring() {
    this.isMonitoring = false;
  }
  
  // 恢复监控
  resumeMonitoring() {
    this.isMonitoring = true;
    this.warningShown = false;
  }
}

// 等待页面加载完成后启动监控
async function initializeContentMonitor() {
  const monitor = new ContentMonitor();
  // 确保初始化完成
  await monitor.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeContentMonitor();
  });
} else {
  initializeContentMonitor();
}

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'TOGGLE_MONITORING') {
    if (request.enabled) {
      window.contentMonitor?.resumeMonitoring();
    } else {
      window.contentMonitor?.pauseMonitoring();
    }
    sendResponse({success: true});
  }
});

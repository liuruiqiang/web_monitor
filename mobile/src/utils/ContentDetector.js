/**
 * Content Detector Utility
 * Reused detection logic from browser extension
 */

export default class ContentDetector {
  constructor() {
    this.suspiciousKeywords = [
      // 中文关键词
      '色情', '黄色', '淫秽', '裸体', '性爱', '情色', 'AV', '成人视频',
      '成人电影', '色情网站', '成人网站', '黄色网站', '成人内容', '色情内容',
      // 英文关键词
      'porn', 'pornography', 'nude', 'naked', 'erotic',
      'adult video', 'adult movie', 'adult content', 'adult site', 'porn site',
    ];
    
    this.suspiciousDomains = [
      'pornhub', 'xvideos', 'redtube', 'youporn', 'tube8', 'beeg', 'xhamster',
      'xxx.com', 'xxx.net', 'porn.com', 'porn.net', 'sex.com', 'nude.com',
      'erotic.com', 'adult', 'nsfw',
    ];
  }

  checkUrl(url) {
    const lowerUrl = url.toLowerCase();
    
    for (let domain of this.suspiciousDomains) {
      if (lowerUrl.includes(domain)) {
        return {
          isSuspicious: true,
          reason: `检测到可疑域名: "${domain}"`,
          type: 'URL检测',
        };
      }
    }
    
    return {
      isSuspicious: false,
      reason: null,
    };
  }

  checkContent(text) {
    if (!text || text.length < 3) {
      return {
        isSuspicious: false,
        reason: null,
      };
    }
    
    const lowerText = text.toLowerCase();
    
    for (let keyword of this.suspiciousKeywords) {
      const lowerKeyword = keyword.toLowerCase();
      let found = false;
      
      if (lowerKeyword.length <= 4) {
        const regex = new RegExp(`\\b${lowerKeyword}\\b`, 'i');
        found = regex.test(lowerText);
      } else {
        found = lowerText.includes(lowerKeyword);
      }
      
      if (found) {
        return {
          isSuspicious: true,
          reason: `检测到关键词: "${keyword}"`,
          type: '内容检测',
        };
      }
    }
    
    return {
      isSuspicious: false,
      reason: null,
    };
  }

  checkMultiple(url, title, content) {
    // Check URL first (highest priority)
    const urlCheck = this.checkUrl(url);
    if (urlCheck.isSuspicious) {
      return urlCheck;
    }
    
    // Check title
    const titleCheck = this.checkContent(title);
    if (titleCheck.isSuspicious) {
      return { ...titleCheck, type: '标题检测' };
    }
    
    // Check content
    const contentCheck = this.checkContent(content);
    if (contentCheck.isSuspicious) {
      return { ...contentCheck, type: '内容检测' };
    }
    
    return {
      isSuspicious: false,
      reason: null,
    };
  }
}

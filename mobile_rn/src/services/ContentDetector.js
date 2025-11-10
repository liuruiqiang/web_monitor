/**
 * Content Detector Service
 * Reused detection logic from browser extension
 */

class ContentDetector {
  // Suspicious keywords (Chinese & English)
  static suspiciousKeywords = [
    // Chinese keywords
    '色情', '黄色', '淫秽', '裸体', '性爱', '情色', 'AV', '成人视频',
    '成人电影', '色情网站', '成人网站', '黄色网站', '成人内容', '色情内容',
    // English keywords
    'porn', 'pornography', 'nude', 'naked', 'erotic',
    'adult video', 'adult movie', 'adult content', 'adult site', 'porn site',
  ];

  // Suspicious domains
  static suspiciousDomains = [
    'pornhub', 'xvideos', 'redtube', 'youporn', 'tube8', 'beeg', 'xhamster',
    'xxx.com', 'xxx.net', 'porn.com', 'porn.net', 'sex.com', 'nude.com',
    'erotic.com', 'adult', 'nsfw',
  ];

  /**
   * Check if URL contains suspicious domains
   */
  static checkUrl(url) {
    const lowerUrl = url.toLowerCase();

    for (const domain of this.suspiciousDomains) {
      if (lowerUrl.includes(domain)) {
        return {
          isSuspicious: true,
          reason: `检测到可疑域名: "${domain}"`,
          type: 'URL检测',
          keyword: domain,
        };
      }
    }

    return {isSuspicious: false};
  }

  /**
   * Check if content contains suspicious keywords
   */
  static checkContent(text) {
    if (!text || text.length < 3) {
      return {isSuspicious: false};
    }

    const lowerText = text.toLowerCase();

    for (const keyword of this.suspiciousKeywords) {
      const lowerKeyword = keyword.toLowerCase();
      let found = false;

      // For short keywords, use word boundary matching
      if (lowerKeyword.length <= 4) {
        const regex = new RegExp(`\\b${lowerKeyword}\\b`, 'i');
        found = regex.test(lowerText);
      } else {
        // For longer keywords, use contains matching
        found = lowerText.includes(lowerKeyword);
      }

      if (found) {
        return {
          isSuspicious: true,
          reason: `检测到关键词: "${keyword}"`,
          type: '内容检测',
          keyword: keyword,
        };
      }
    }

    return {isSuspicious: false};
  }

  /**
   * Check multiple sources (URL, title, content)
   */
  static checkMultiple(url, title, content) {
    // Check URL first (highest priority)
    const urlCheck = this.checkUrl(url);
    if (urlCheck.isSuspicious) {
      return urlCheck;
    }

    // Check title
    if (title) {
      const titleCheck = this.checkContent(title);
      if (titleCheck.isSuspicious) {
        return {...titleCheck, type: '标题检测'};
      }
    }

    // Check content
    if (content) {
      const contentCheck = this.checkContent(content);
      if (contentCheck.isSuspicious) {
        return contentCheck;
      }
    }

    return {isSuspicious: false};
  }

  /**
   * Check with custom keywords
   */
  static checkWithCustomKeywords(text, customKeywords) {
    if (!text || !customKeywords || customKeywords.length === 0) {
      return {isSuspicious: false};
    }

    const lowerText = text.toLowerCase();

    for (const keyword of customKeywords) {
      if (!keyword) continue;

      if (lowerText.includes(keyword.toLowerCase())) {
        return {
          isSuspicious: true,
          reason: `检测到自定义关键词: "${keyword}"`,
          type: '自定义检测',
          keyword: keyword,
        };
      }
    }

    return {isSuspicious: false};
  }
}

export default ContentDetector;

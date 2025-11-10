/**
 * Injected JavaScript for WebView Content Monitoring
 */

export const createMonitoringScript = (keywords, domains) => {
  return `
    (function() {
      const suspiciousKeywords = ${JSON.stringify(keywords)};
      const suspiciousDomains = ${JSON.stringify(domains)};
      
      function checkContent(text) {
        if (!text || text.length < 3) return null;
        const lowerText = text.toLowerCase();
        
        for (const keyword of suspiciousKeywords) {
          const lowerKeyword = keyword.toLowerCase();
          let found = false;
          
          if (lowerKeyword.length <= 4) {
            const regex = new RegExp('\\\\b' + lowerKeyword + '\\\\b', 'i');
            found = regex.test(lowerText);
          } else {
            found = lowerText.includes(lowerKeyword);
          }
          
          if (found) {
            return { found: true, keyword: keyword };
          }
        }
        return null;
      }
      
      function checkPage() {
        try {
          const title = document.title || '';
          const bodyText = document.body ? document.body.innerText.substring(0, 5000) : '';
          
          // Check title
          const titleCheck = checkContent(title);
          if (titleCheck) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'CONTENT_WARNING',
              detectionType: '标题检测',
              reason: '检测到关键词: "' + titleCheck.keyword + '"',
              content: title,
              url: window.location.href,
            }));
            return;
          }
          
          // Check content
          const contentCheck = checkContent(bodyText);
          if (contentCheck) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'CONTENT_WARNING',
              detectionType: '内容检测',
              reason: '检测到关键词: "' + contentCheck.keyword + '"',
              content: bodyText.substring(0, 200),
              url: window.location.href,
            }));
          }
        } catch (error) {
          console.error('Monitoring error:', error);
        }
      }
      
      // Run checks after page load
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkPage);
      } else {
        setTimeout(checkPage, 500);
      }
      
      // Monitor DOM changes
      const observer = new MutationObserver(() => {
        try {
          const bodyText = document.body ? document.body.innerText.substring(0, 1000) : '';
          const check = checkContent(bodyText);
          if (check) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'CONTENT_WARNING',
              detectionType: '动态内容检测',
              reason: '检测到关键词: "' + check.keyword + '"',
              content: bodyText.substring(0, 200),
              url: window.location.href,
            }));
          }
        } catch (error) {
          console.error('Observer error:', error);
        }
      });
      
      if (document.body) {
        observer.observe(document.body, { 
          childList: true, 
          subtree: true 
        });
      }
      
      // Notify page loaded
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'PAGE_LOADED',
        url: window.location.href,
        title: document.title,
      }));
    })();
    true;
  `;
};

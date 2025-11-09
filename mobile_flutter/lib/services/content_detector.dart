/// Content Detector Service
/// Reused detection logic from browser extension
class ContentDetector {
  // Suspicious keywords (Chinese & English)
  static const List<String> suspiciousKeywords = [
    // Chinese keywords
    '色情', '黄色', '淫秽', '裸体', '性爱', '情色', 'AV', '成人视频',
    '成人电影', '色情网站', '成人网站', '黄色网站', '成人内容', '色情内容',
    // English keywords
    'porn', 'pornography', 'nude', 'naked', 'erotic',
    'adult video', 'adult movie', 'adult content', 'adult site', 'porn site',
  ];

  // Suspicious domains
  static const List<String> suspiciousDomains = [
    'pornhub', 'xvideos', 'redtube', 'youporn', 'tube8', 'beeg', 'xhamster',
    'xxx.com', 'xxx.net', 'porn.com', 'porn.net', 'sex.com', 'nude.com',
    'erotic.com', 'adult', 'nsfw',
  ];

  /// Check if URL contains suspicious domains
  static DetectionResult checkUrl(String url) {
    final lowerUrl = url.toLowerCase();
    
    for (final domain in suspiciousDomains) {
      if (lowerUrl.contains(domain)) {
        return DetectionResult(
          isSuspicious: true,
          reason: '检测到可疑域名: "$domain"',
          type: DetectionType.url,
          keyword: domain,
        );
      }
    }
    
    return DetectionResult(isSuspicious: false);
  }

  /// Check if content contains suspicious keywords
  static DetectionResult checkContent(String text) {
    if (text.isEmpty || text.length < 3) {
      return DetectionResult(isSuspicious: false);
    }
    
    final lowerText = text.toLowerCase();
    
    for (final keyword in suspiciousKeywords) {
      final lowerKeyword = keyword.toLowerCase();
      bool found = false;
      
      // For short keywords, use word boundary matching
      if (lowerKeyword.length <= 4) {
        final regex = RegExp(r'\b' + RegExp.escape(lowerKeyword) + r'\b', caseSensitive: false);
        found = regex.hasMatch(lowerText);
      } else {
        // For longer keywords, use contains matching
        found = lowerText.contains(lowerKeyword);
      }
      
      if (found) {
        return DetectionResult(
          isSuspicious: true,
          reason: '检测到关键词: "$keyword"',
          type: DetectionType.content,
          keyword: keyword,
        );
      }
    }
    
    return DetectionResult(isSuspicious: false);
  }

  /// Check multiple sources (URL, title, content)
  static DetectionResult checkMultiple({
    required String url,
    String? title,
    String? content,
  }) {
    // Check URL first (highest priority)
    final urlCheck = checkUrl(url);
    if (urlCheck.isSuspicious) {
      return urlCheck;
    }
    
    // Check title
    if (title != null && title.isNotEmpty) {
      final titleCheck = checkContent(title);
      if (titleCheck.isSuspicious) {
        return DetectionResult(
          isSuspicious: true,
          reason: titleCheck.reason,
          type: DetectionType.title,
          keyword: titleCheck.keyword,
        );
      }
    }
    
    // Check content
    if (content != null && content.isNotEmpty) {
      final contentCheck = checkContent(content);
      if (contentCheck.isSuspicious) {
        return contentCheck;
      }
    }
    
    return DetectionResult(isSuspicious: false);
  }

  /// Add custom keywords to detection
  static DetectionResult checkWithCustomKeywords({
    required String text,
    required List<String> customKeywords,
  }) {
    final lowerText = text.toLowerCase();
    
    for (final keyword in customKeywords) {
      if (keyword.isEmpty) continue;
      
      if (lowerText.contains(keyword.toLowerCase())) {
        return DetectionResult(
          isSuspicious: true,
          reason: '检测到自定义关键词: "$keyword"',
          type: DetectionType.custom,
          keyword: keyword,
        );
      }
    }
    
    return DetectionResult(isSuspicious: false);
  }
}

/// Detection result model
class DetectionResult {
  final bool isSuspicious;
  final String? reason;
  final DetectionType? type;
  final String? keyword;

  DetectionResult({
    required this.isSuspicious,
    this.reason,
    this.type,
    this.keyword,
  });

  Map<String, dynamic> toJson() {
    return {
      'isSuspicious': isSuspicious,
      'reason': reason,
      'type': type?.name,
      'keyword': keyword,
    };
  }
}

/// Detection types
enum DetectionType {
  url,
  title,
  content,
  custom,
  dynamic,
}

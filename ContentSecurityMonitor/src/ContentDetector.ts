/**
 * ContentDetector.ts
 * Content detection and filtering logic for the Content Security Monitor app
 */

export class ContentDetector {
  // Prohibited keywords for content filtering
  private static prohibitedKeywords: string[] = [
    'porn',
    'sex',
    'adult',
    'nude',
    'xxx',
    '色情',
    '成人',
    '裸',
    '淫',
    'av',
    'hentai',
    'erotic',
    'sexy',
    'nsfw',
  ];

  // Prohibited patterns (regex) for more advanced filtering
  private static prohibitedPatterns: RegExp[] = [
    /\b(?:porn|sex|adult|nude)\w*\b/i,
    /\b(?:色情|成人|裸(?:体)?|淫(?:乱|秽)?)\b/i,
    /\b\d{1,3}\s*(?:p|清纯|唯美|性感|诱惑|爆乳|丝袜|制服|诱惑|巨乳)\b/i,
  ];

  /**
   * Check if the content contains prohibited keywords
   * @param content The text content to check
   * @returns True if prohibited content is detected, false otherwise
   */
  public static checkContent(content: string): boolean {
    if (!content || typeof content !== 'string') {
      return false;
    }

    const lowerContent = content.toLowerCase();

    // Check for prohibited keywords
    const hasProhibitedKeyword = this.prohibitedKeywords.some(keyword =>
      lowerContent.includes(keyword.toLowerCase()),
    );

    if (hasProhibitedKeyword) {
      return true;
    }

    // Check for prohibited patterns
    const hasProhibitedPattern = this.prohibitedPatterns.some(pattern =>
      pattern.test(content),
    );

    return hasProhibitedPattern;
  }

  /**
   * Check if a URL is potentially problematic
   * @param url The URL to check
   * @returns True if the URL is potentially problematic, false otherwise
   */
  public static checkUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    const lowerUrl = url.toLowerCase();

    // Check URL for prohibited keywords
    return this.prohibitedKeywords.some(keyword =>
      lowerUrl.includes(keyword.toLowerCase()),
    );
  }

  /**
   * Get the list of prohibited keywords
   * @returns Array of prohibited keywords
   */
  public static getProhibitedKeywords(): string[] {
    return [...this.prohibitedKeywords];
  }

  /**
   * Add a new keyword to the prohibited list
   * @param keyword The keyword to add
   */
  public static addProhibitedKeyword(keyword: string): void {
    if (keyword && typeof keyword === 'string' && !this.prohibitedKeywords.includes(keyword.toLowerCase())) {
      this.prohibitedKeywords.push(keyword.toLowerCase());
    }
  }

  /**
   * Remove a keyword from the prohibited list
   * @param keyword The keyword to remove
   */
  public static removeProhibitedKeyword(keyword: string): void {
    const index = this.prohibitedKeywords.indexOf(keyword.toLowerCase());
    if (index > -1) {
      this.prohibitedKeywords.splice(index, 1);
    }
  }
}
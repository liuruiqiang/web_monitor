import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:provider/provider.dart';
import '../services/content_detector.dart';
import '../services/settings_service.dart';
import '../services/history_service.dart';
import '../models/warning_record.dart';

class BrowserScreen extends StatefulWidget {
  const BrowserScreen({super.key});

  @override
  State<BrowserScreen> createState() => _BrowserScreenState();
}

class _BrowserScreenState extends State<BrowserScreen> {
  final TextEditingController _urlController = TextEditingController(text: 'https://www.google.com');
  InAppWebViewController? _webViewController;
  String _currentUrl = '';
  double _progress = 0;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _currentUrl = _urlController.text;
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  /// Injected JavaScript for content monitoring
  String get _monitoringScript => '''
    (function() {
      const suspiciousKeywords = ${_getKeywordsJson()};
      const suspiciousDomains = ${_getDomainsJson()};
      
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
      
      // Check page content
      function checkPage() {
        const title = document.title;
        const bodyText = document.body ? document.body.innerText.substring(0, 5000) : '';
        
        // Check title
        const titleCheck = checkContent(title);
        if (titleCheck) {
          window.flutter_inappwebview.callHandler('contentWarning', {
            type: 'title',
            reason: '检测到关键词: "' + titleCheck.keyword + '"',
            content: title,
          });
          return;
        }
        
        // Check content
        const contentCheck = checkContent(bodyText);
        if (contentCheck) {
          window.flutter_inappwebview.callHandler('contentWarning', {
            type: 'content',
            reason: '检测到关键词: "' + contentCheck.keyword + '"',
            content: bodyText.substring(0, 200),
          });
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
        const bodyText = document.body ? document.body.innerText.substring(0, 1000) : '';
        const check = checkContent(bodyText);
        if (check) {
          window.flutter_inappwebview.callHandler('contentWarning', {
            type: 'dynamic',
            reason: '检测到关键词: "' + check.keyword + '"',
            content: bodyText.substring(0, 200),
          });
        }
      });
      
      if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
      }
    })();
  ''';

  String _getKeywordsJson() {
    final settings = context.read<SettingsService>();
    final allKeywords = [...ContentDetector.suspiciousKeywords, ...settings.customKeywords];
    return allKeywords.map((k) => '"$k"').join(',');
  }

  String _getDomainsJson() {
    final settings = context.read<SettingsService>();
    final allDomains = [...ContentDetector.suspiciousDomains, ...settings.blockedDomains];
    return allDomains.map((d) => '"$d"').join(',');
  }

  void _loadUrl() {
    final settings = context.read<SettingsService>();
    String url = _urlController.text.trim();
    
    if (url.isEmpty) return;
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://$url';
    }

    // Pre-check URL
    if (settings.isEnabled) {
      final urlCheck = ContentDetector.checkUrl(url);
      if (urlCheck.isSuspicious) {
        _showWarningDialog(url, urlCheck.reason!, urlCheck.type!.name);
        return;
      }
    }

    _webViewController?.loadUrl(urlRequest: URLRequest(url: WebUri(url)));
  }

  void _showWarningDialog(String url, String reason, String type) {
    final historyService = context.read<HistoryService>();
    
    // Save to history
    historyService.addWarning(WarningRecord(
      url: url,
      reason: reason,
      detectionType: type,
    ));

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        icon: const Icon(Icons.block, color: Colors.red, size: 64),
        title: const Text('页面已被阻止'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '检测到不当内容',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Text(reason),
            const SizedBox(height: 8),
            Text(
              'URL: $url',
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.orange.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.orange.shade200),
              ),
              child: const Row(
                children: [
                  Icon(Icons.warning_amber, color: Colors.orange, size: 20),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      '此页面包含不当内容，已被自动阻止。',
                      style: TextStyle(fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              Navigator.pushNamed(context, '/history');
            },
            child: const Text('查看历史'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.of(context).pop();
              _urlController.text = 'https://www.google.com';
              _loadUrl();
            },
            child: const Text('返回安全页面'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final settings = context.watch<SettingsService>();
    final history = context.watch<HistoryService>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('安全浏览器'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () => Navigator.pushNamed(context, '/settings'),
          ),
          IconButton(
            icon: Badge(
              label: Text('${history.count}'),
              isLabelVisible: history.count > 0,
              child: const Icon(Icons.history),
            ),
            onPressed: () => Navigator.pushNamed(context, '/history'),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(4),
          child: _isLoading
              ? LinearProgressIndicator(value: _progress)
              : const SizedBox(height: 4),
        ),
      ),
      body: Column(
        children: [
          // Address bar
          Container(
            padding: const EdgeInsets.all(8),
            color: Theme.of(context).colorScheme.surfaceVariant,
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _urlController,
                    decoration: InputDecoration(
                      hintText: '输入网址或搜索...',
                      prefixIcon: const Icon(Icons.search),
                      filled: true,
                      fillColor: Theme.of(context).colorScheme.surface,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide.none,
                      ),
                    ),
                    onSubmitted: (_) => _loadUrl(),
                  ),
                ),
                const SizedBox(width: 8),
                FilledButton.icon(
                  onPressed: _loadUrl,
                  icon: const Icon(Icons.arrow_forward),
                  label: const Text('GO'),
                ),
              ],
            ),
          ),

          // Status bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: settings.isEnabled ? Colors.green.shade50 : Colors.grey.shade200,
            child: Row(
              children: [
                Icon(
                  settings.isEnabled ? Icons.shield : Icons.shield_outlined,
                  size: 16,
                  color: settings.isEnabled ? Colors.green : Colors.grey,
                ),
                const SizedBox(width: 8),
                Text(
                  settings.isEnabled ? '🛡️ 监控已启用' : '⚠️ 监控已禁用',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Text(
                    _currentUrl.isEmpty ? '未加载' : _currentUrl,
                    style: const TextStyle(fontSize: 11, color: Colors.grey),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),

          // WebView
          Expanded(
            child: InAppWebView(
              initialUrlRequest: URLRequest(url: WebUri(_urlController.text)),
              initialSettings: InAppWebViewSettings(
                javaScriptEnabled: true,
                domStorageEnabled: true,
                useShouldOverrideUrlLoading: true,
              ),
              onWebViewCreated: (controller) {
                _webViewController = controller;
                
                // Register handler for content warnings
                controller.addJavaScriptHandler(
                  handlerName: 'contentWarning',
                  callback: (args) {
                    if (args.isEmpty) return;
                    final data = args[0] as Map<String, dynamic>;
                    _showWarningDialog(
                      _currentUrl,
                      data['reason'] as String,
                      data['type'] as String,
                    );
                  },
                );
              },
              onLoadStart: (controller, url) {
                setState(() {
                  _isLoading = true;
                  _currentUrl = url?.toString() ?? '';
                });
              },
              onLoadStop: (controller, url) async {
                setState(() {
                  _isLoading = false;
                  _currentUrl = url?.toString() ?? '';
                });
                
                // Inject monitoring script if enabled
                if (settings.isEnabled) {
                  await controller.evaluateJavascript(source: _monitoringScript);
                }
              },
              onProgressChanged: (controller, progress) {
                setState(() => _progress = progress / 100);
              },
              shouldOverrideUrlLoading: (controller, navigationAction) async {
                final url = navigationAction.request.url?.toString() ?? '';
                
                // Check URL before loading
                if (settings.isEnabled) {
                  final check = ContentDetector.checkUrl(url);
                  if (check.isSuspicious) {
                    _showWarningDialog(url, check.reason!, check.type!.name);
                    return NavigationActionPolicy.CANCEL;
                  }
                }
                
                return NavigationActionPolicy.ALLOW;
              },
            ),
          ),

          // Control buttons
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surfaceVariant,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 4,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                IconButton(
                  icon: const Icon(Icons.arrow_back),
                  onPressed: () => _webViewController?.goBack(),
                ),
                IconButton(
                  icon: const Icon(Icons.arrow_forward),
                  onPressed: () => _webViewController?.goForward(),
                ),
                IconButton(
                  icon: const Icon(Icons.refresh),
                  onPressed: () => _webViewController?.reload(),
                ),
                IconButton(
                  icon: const Icon(Icons.home),
                  onPressed: () {
                    _urlController.text = 'https://www.google.com';
                    _loadUrl();
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

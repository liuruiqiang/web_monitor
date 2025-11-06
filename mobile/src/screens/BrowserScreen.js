/**
 * Browser Screen - Main WebView with Content Monitoring
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ContentDetector from '../utils/ContentDetector';

export default function BrowserScreen({ navigation }) {
  const webViewRef = useRef(null);
  const [url, setUrl] = useState('https://www.google.com');
  const [currentUrl, setCurrentUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [warningVisible, setWarningVisible] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [blockedUrl, setBlockedUrl] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setIsEnabled(parsed.enabled !== false);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  // Injected JavaScript - Core Content Monitoring Logic
  const injectedJavaScript = `
    (function() {
      // Content Monitor Class (Simplified from content.js)
      class MobileContentMonitor {
        constructor() {
          this.suspiciousKeywords = [
            '色情', '黄色', '淫秽', '裸体', '性爱', '情色', 'AV', '成人视频',
            'porn', 'pornography', 'nude', 'naked', 'erotic',
            'adult video', 'adult movie', 'adult content'
          ];
          
          this.suspiciousDomains = [
            'pornhub', 'xvideos', 'redtube', 'youporn', 'tube8', 'beeg',
            'xxx.com', 'porn.com', 'sex.com', 'nude.com', 'erotic.com'
          ];
          
          this.init();
        }
        
        init() {
          this.checkCurrentPage();
          this.observePageChanges();
        }
        
        checkCurrentPage() {
          const url = window.location.href.toLowerCase();
          const title = document.title.toLowerCase();
          
          // Check URL
          const urlCheck = this.checkSuspiciousUrl(url);
          if (urlCheck.found) {
            this.sendWarning('URL检测', urlCheck.reason, url);
            return;
          }
          
          // Check title
          const titleCheck = this.checkSuspiciousContent(title);
          if (titleCheck.found) {
            this.sendWarning('标题检测', titleCheck.reason, title);
            return;
          }
          
          // Check page content after load
          setTimeout(() => {
            const bodyText = document.body ? document.body.innerText.toLowerCase() : '';
            const contentCheck = this.checkSuspiciousContent(bodyText.substring(0, 5000));
            if (contentCheck.found) {
              this.sendWarning('内容检测', contentCheck.reason, bodyText.substring(0, 200));
            }
          }, 500);
        }
        
        checkSuspiciousUrl(url) {
          for (let domain of this.suspiciousDomains) {
            if (url.includes(domain)) {
              return { 
                found: true, 
                reason: \`检测到可疑域名: "\${domain}"\`
              };
            }
          }
          return { found: false };
        }
        
        checkSuspiciousContent(text) {
          if (!text || text.length < 3) return { found: false };
          
          for (let keyword of this.suspiciousKeywords) {
            const lowerText = text.toLowerCase();
            const lowerKeyword = keyword.toLowerCase();
            
            let found = false;
            if (lowerKeyword.length <= 4) {
              const regex = new RegExp(\`\\\\b\${lowerKeyword}\\\\b\`, 'i');
              found = regex.test(lowerText);
            } else {
              found = lowerText.includes(lowerKeyword);
            }
            
            if (found) {
              return { 
                found: true, 
                reason: \`检测到关键词: "\${keyword}"\`
              };
            }
          }
          return { found: false };
        }
        
        observePageChanges() {
          const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  const text = node.innerText ? node.innerText.toLowerCase() : '';
                  const check = this.checkSuspiciousContent(text.substring(0, 1000));
                  if (check.found) {
                    this.sendWarning('动态内容检测', check.reason, text.substring(0, 200));
                  }
                }
              });
            });
          });
          
          if (document.body) {
            observer.observe(document.body, {
              childList: true,
              subtree: true
            });
          }
        }
        
        sendWarning(type, reason, content) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'CONTENT_WARNING',
            detectionType: type,
            reason: reason,
            content: content,
            url: window.location.href,
            timestamp: new Date().toISOString()
          }));
        }
      }
      
      // Initialize monitor
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          new MobileContentMonitor();
        });
      } else {
        new MobileContentMonitor();
      }
      
      // Send page load notification
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'PAGE_LOADED',
        url: window.location.href,
        title: document.title
      }));
    })();
    true; // Required for iOS
  `;

  // Handle messages from WebView
  const handleWebViewMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'CONTENT_WARNING') {
        // Stop loading immediately
        webViewRef.current?.stopLoading();
        
        // Save to history
        await saveWarningToHistory(data);
        
        // Show warning
        setWarningMessage(`🚫 ${data.detectionType}

${data.reason}

URL: ${data.url}`);
        setBlockedUrl(data.url);
        setWarningVisible(true);
        
        // Navigate back to safe page
        setTimeout(() => {
          webViewRef.current?.stopLoading();
          setUrl('https://www.google.com');
        }, 100);
        
      } else if (data.type === 'PAGE_LOADED') {
        setCurrentUrl(data.url);
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  };

  const saveWarningToHistory = async (warning) => {
    try {
      const historyJson = await AsyncStorage.getItem('warningHistory');
      const history = historyJson ? JSON.parse(historyJson) : [];
      
      history.unshift({
        id: Date.now(),
        ...warning,
      });
      
      // Keep only last 100 records
      if (history.length > 100) {
        history.splice(100);
      }
      
      await AsyncStorage.setItem('warningHistory', JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save warning history:', error);
    }
  };

  const handleNavigate = () => {
    if (!isEnabled) {
      Alert.alert('提示', '监控已禁用，将直接访问网页');
    }
    
    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }
    
    // Pre-check URL before loading
    const detector = new ContentDetector();
    const urlCheck = detector.checkUrl(finalUrl);
    
    if (urlCheck.isSuspicious && isEnabled) {
      setWarningMessage(`🚫 URL检测

${urlCheck.reason}

URL: ${finalUrl}`);
      setBlockedUrl(finalUrl);
      setWarningVisible(true);
      return;
    }
    
    setUrl(finalUrl);
    setCurrentUrl(finalUrl);
  };

  const handleCloseWarning = () => {
    setWarningVisible(false);
    setWarningMessage('');
    setBlockedUrl('');
  };

  const handleGoBack = () => {
    webViewRef.current?.goBack();
  };

  const handleGoForward = () => {
    webViewRef.current?.goForward();
  };

  const handleRefresh = () => {
    webViewRef.current?.reload();
  };

  return (
    <View style={styles.container}>
      {/* Navigation Bar */}
      <View style={styles.navbar}>
        <View style={styles.addressBar}>
          <TextInput
            style={styles.urlInput}
            value={url}
            onChangeText={setUrl}
            onSubmitEditing={handleNavigate}
            placeholder="输入网址或搜索..."
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <TouchableOpacity style={styles.goButton} onPress={handleNavigate}>
            <Text style={styles.goButtonText}>GO</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={handleGoBack}>
            <Text style={styles.controlButtonText}>◀</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={handleGoForward}>
            <Text style={styles.controlButtonText}>▶</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={handleRefresh}>
            <Text style={styles.controlButtonText}>⟳</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.controlButtonText}>⚙</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={() => navigation.navigate('History')}
          >
            <Text style={styles.controlButtonText}>📋</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Status Indicator */}
      <View style={styles.statusBar}>
        <View style={[styles.statusDot, { backgroundColor: isEnabled ? '#4caf50' : '#9e9e9e' }]} />
        <Text style={styles.statusText}>
          {isEnabled ? '🛡️ 监控已启用' : '⚠️ 监控已禁用'}
        </Text>
        <Text style={styles.currentUrl} numberOfLines={1}>
          {currentUrl || '未加载'}
        </Text>
      </View>

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={styles.webview}
        injectedJavaScript={isEnabled ? injectedJavaScript : ''}
        onMessage={handleWebViewMessage}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error:', nativeEvent);
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1976d2" />
            <Text style={styles.loadingText}>加载中...</Text>
          </View>
        )}
      />

      {/* Warning Modal */}
      <Modal
        visible={warningVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseWarning}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalIcon}>🚫</Text>
            <Text style={styles.modalTitle}>页面已被阻止</Text>
            <Text style={styles.modalMessage}>{warningMessage}</Text>
            
            <View style={styles.warningBox}>
              <Text style={styles.warningBoxText}>
                <Text style={styles.warningBoxBold}>⚠️ 安全提醒：</Text>
                此页面包含不当内容，已被自动阻止。为了您的安全，建议立即离开。
              </Text>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.closeButton]}
                onPress={handleCloseWarning}
              >
                <Text style={styles.modalButtonText}>知道了</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.historyButton]}
                onPress={() => {
                  handleCloseWarning();
                  navigation.navigate('History');
                }}
              >
                <Text style={styles.modalButtonText}>查看历史</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalTimestamp}>
              时间: {new Date().toLocaleString('zh-CN')}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  navbar: {
    backgroundColor: '#fff',
    paddingTop: 10,
    paddingBottom: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  addressBar: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  urlInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    fontSize: 14,
  },
  goButton: {
    marginLeft: 8,
    backgroundColor: '#1976d2',
    paddingHorizontal: 20,
    borderRadius: 20,
    justifyContent: 'center',
  },
  goButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 5,
  },
  controlButton: {
    padding: 8,
  },
  controlButtonText: {
    fontSize: 20,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 10,
  },
  currentUrl: {
    flex: 1,
    fontSize: 11,
    color: '#666',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 30,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalIcon: {
    fontSize: 64,
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 15,
  },
  modalMessage: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffeaa7',
    borderRadius: 8,
    padding: 15,
    marginBottom: 25,
  },
  warningBoxText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 20,
  },
  warningBoxBold: {
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: '#d32f2f',
  },
  historyButton: {
    backgroundColor: '#1976d2',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  modalTimestamp: {
    marginTop: 15,
    fontSize: 11,
    color: '#999',
  },
});

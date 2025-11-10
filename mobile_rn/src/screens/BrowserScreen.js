/**
 * Browser Screen - Main WebView with Content Monitoring
 */

import React, {useRef, useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {WebView} from 'react-native-webview';
import {useSettings} from '../context/SettingsContext';
import {useHistory} from '../context/HistoryContext';
import ContentDetector from '../services/ContentDetector';
import {createMonitoringScript} from '../utils/injectedScript';

export default function BrowserScreen({navigation}) {
  const webViewRef = useRef(null);
  const [url, setUrl] = useState('https://www.google.com');
  const [currentUrl, setCurrentUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [warningVisible, setWarningVisible] = useState(false);
  const [warningData, setWarningData] = useState(null);

  const {isEnabled, customKeywords, blockedDomains} = useSettings();
  const {addWarning, history} = useHistory();

  const allKeywords = [
    ...ContentDetector.suspiciousKeywords,
    ...customKeywords,
  ];
  const allDomains = [...ContentDetector.suspiciousDomains, ...blockedDomains];

  const injectedScript = createMonitoringScript(allKeywords, allDomains);

  const handleNavigate = () => {
    if (!url.trim()) return;

    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    // Pre-check URL
    if (isEnabled) {
      const urlCheck = ContentDetector.checkUrl(finalUrl);
      if (urlCheck.isSuspicious) {
        showWarning({
          url: finalUrl,
          reason: urlCheck.reason,
          detectionType: urlCheck.type,
        });
        return;
      }
    }

    setCurrentUrl(finalUrl);
    webViewRef.current?.stopLoading();
  };

  const showWarning = async (data) => {
    setWarningData(data);
    setWarningVisible(true);

    // Save to history
    await addWarning({
      url: data.url,
      reason: data.reason,
      detectionType: data.detectionType || 'URL检测',
      content: data.content || '',
    });

    // Stop loading
    webViewRef.current?.stopLoading();
  };

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'CONTENT_WARNING') {
        showWarning({
          url: data.url,
          reason: data.reason,
          detectionType: data.detectionType,
          content: data.content,
        });
      } else if (data.type === 'PAGE_LOADED') {
        setCurrentUrl(data.url);
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  };

  const closeWarning = () => {
    setWarningVisible(false);
    setWarningData(null);
    setUrl('https://www.google.com');
    setCurrentUrl('https://www.google.com');
  };

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
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
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => webViewRef.current?.goBack()}>
            <Text style={styles.controlButtonText}>◀</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => webViewRef.current?.goForward()}>
            <Text style={styles.controlButtonText}>▶</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => webViewRef.current?.reload()}>
            <Text style={styles.controlButtonText}>⟳</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.controlButtonText}>⚙</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => navigation.navigate('History')}>
            <Text style={styles.controlButtonText}>📋</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Status Bar */}
      <View
        style={[
          styles.statusBar,
          {backgroundColor: isEnabled ? '#e8f5e9' : '#f5f5f5'},
        ]}>
        <View
          style={[
            styles.statusDot,
            {backgroundColor: isEnabled ? '#4caf50' : '#9e9e9e'},
          ]}
        />
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
        source={{uri: currentUrl || url}}
        style={styles.webview}
        injectedJavaScript={isEnabled ? injectedScript : ''}
        onMessage={handleWebViewMessage}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={(syntheticEvent) => {
          const {nativeEvent} = syntheticEvent;
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
        onRequestClose={closeWarning}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalIcon}>🚫</Text>
            <Text style={styles.modalTitle}>页面已被阻止</Text>
            <Text style={styles.modalSubtitle}>检测到不当内容</Text>

            {warningData && (
              <View style={styles.warningDetails}>
                <Text style={styles.warningReason}>{warningData.reason}</Text>
                <Text style={styles.warningUrl}>URL: {warningData.url}</Text>
              </View>
            )}

            <View style={styles.warningBox}>
              <Text style={styles.warningBoxText}>
                <Text style={styles.warningBoxBold}>⚠️ 安全提醒：</Text>
                此页面包含不当内容，已被自动阻止。为了您的安全，建议立即离开。
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.closeButton]}
                onPress={closeWarning}>
                <Text style={styles.modalButtonText}>返回安全页面</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.historyButton]}
                onPress={() => {
                  closeWarning();
                  navigation.navigate('History');
                }}>
                <Text style={styles.modalButtonText}>查看历史</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalTimestamp}>
              {new Date().toLocaleString('zh-CN')}
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
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 18,
    color: '#333',
    marginBottom: 15,
  },
  warningDetails: {
    width: '100%',
    marginBottom: 15,
  },
  warningReason: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  warningUrl: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
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
    marginBottom: 15,
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
    fontSize: 11,
    color: '#999',
  },
});

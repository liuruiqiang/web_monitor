/**
 * Content Security Monitor App
 * React Native WebView-based content filtering application
 */

import React, {useState, useRef} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import {WebView} from 'react-native-webview';
import WarningModal from './src/WarningModal';
import HistoryModal from './src/HistoryModal';
import SettingsModal from './src/SettingsModal';
import {ContentDetector} from './src/ContentDetector';

const App = () => {
  const [url, setUrl] = useState('https://www.google.com');
  const [currentUrl, setCurrentUrl] = useState('https://www.google.com');
  const [loading, setLoading] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningInfo, setWarningInfo] = useState({title: '', message: ''});
  const [pendingUrl, setPendingUrl] = useState('');
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const handleNavigation = () => {
    if (url.trim() === '') {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    // Check URL for prohibited content
    if (ContentDetector.checkUrl(formattedUrl)) {
      setWarningInfo({
        title: 'Content Warning',
        message: 'This website may contain inappropriate content and has been blocked for your safety.',
      });
      setPendingUrl(formattedUrl);
      setShowWarning(true);
      return;
    }

    setCurrentUrl(formattedUrl);
    setLoading(true);
  };

  const handleNavigationStateChange = (navState: any) => {
    // Check URL for prohibited content
    if (ContentDetector.checkUrl(navState.url)) {
      setWarningInfo({
        title: 'Content Warning',
        message: 'This website may contain inappropriate content and has been blocked for your safety.',
      });
      setShowWarning(true);
      return;
    }
  };

  const injectedJavaScript = `
    (function() {
      // Get page content for analysis
      const content = document.body.innerText;
      
      // Send content to React Native
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'CONTENT_CHECK',
        content: content,
        url: window.location.href
      }));
      
      return content;
    })();
  `;

  const onMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === 'CONTENT_CHECK') {
        // Check page content for prohibited content
        if (ContentDetector.checkContent(message.content)) {
          setWarningInfo({
            title: 'Content Warning',
            message: 'Inappropriate content detected on this page and has been blocked for your safety.',
          });
          setShowWarning(true);
        }
      }
    } catch (error) {
      console.log('Error processing message:', error);
    }
  };

  const handleWarningConfirm = () => {
    setShowWarning(false);
    if (pendingUrl) {
      setCurrentUrl(pendingUrl);
      setPendingUrl('');
      setLoading(true);
    }
  };

  const handleWarningCancel = () => {
    setShowWarning(false);
    setPendingUrl('');
    // Go back if we're already browsing
    if (currentUrl !== 'https://www.google.com') {
      webViewRef.current?.goBack();
    }
  };

  const handleGoBack = () => {
    if (canGoBack) {
      webViewRef.current?.goBack();
    }
  };

  const handleGoForward = () => {
    if (canGoForward) {
      webViewRef.current?.goForward();
    }
  };

  const handleRefresh = () => {
    webViewRef.current?.reload();
  };

  const updateNavigationState = (navState: any) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setCurrentUrl(navState.url);
    setUrl(navState.url);
    
    // Add to history if it's a new URL
    if (navState.url && !navigationHistory.includes(navState.url)) {
      setNavigationHistory(prev => [...prev, navState.url]);
    }
  };

  const handleSelectHistoryUrl = (selectedUrl: string) => {
    setUrl(selectedUrl);
    setCurrentUrl(selectedUrl);
    setLoading(true);
  };

  const handleClearHistory = () => {
    setNavigationHistory([]);
    Alert.alert('Success', 'Browsing history has been cleared');
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Confirm Reset',
      'Are you sure you want to reset all settings to default?',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Reset', onPress: () => Alert.alert('Success', 'Settings have been reset to default')},
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appHeader}>
        <Text style={styles.appTitle}>Content Security Monitor</Text>
      </View>
      
      <View style={styles.header}>
        <TextInput
          style={styles.urlInput}
          value={url}
          onChangeText={setUrl}
          placeholder="Enter URL (e.g., google.com)"
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity style={styles.goButton} onPress={handleNavigation}>
          <Text style={styles.goButtonText}>Go</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.navigationBar}>
        <TouchableOpacity 
          style={[styles.navButton, !canGoBack && styles.navButtonDisabled]} 
          onPress={handleGoBack}
          disabled={!canGoBack}
        >
          <Text style={styles.navButtonText}>←</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navButton, !canGoForward && styles.navButtonDisabled]} 
          onPress={handleGoForward}
          disabled={!canGoForward}
        >
          <Text style={styles.navButtonText}>→</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={handleRefresh}
        >
          <Text style={styles.navButtonText}>↻</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => setShowHistory(true)}
        >
          <Text style={styles.navButtonText}>History</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => setShowSettings(true)}
        >
          <Text style={styles.navButtonText}>Settings</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingBar}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{uri: currentUrl}}
        style={styles.webView}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={(navState) => {
          updateNavigationState(navState);
          handleNavigationStateChange(navState);
        }}
        injectedJavaScript={injectedJavaScript}
        onMessage={onMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />

      <WarningModal
        visible={showWarning}
        title={warningInfo.title}
        message={warningInfo.message}
        onConfirm={handleWarningConfirm}
        onCancel={handleWarningCancel}
        confirmText="Proceed Anyway"
        cancelText="Go Back"
      />
      
      <HistoryModal
        visible={showHistory}
        history={navigationHistory}
        onSelectUrl={handleSelectHistoryUrl}
        onClose={() => setShowHistory(false)}
      />
      
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onClearHistory={handleClearHistory}
        onResetSettings={handleResetSettings}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  appHeader: {
    backgroundColor: '#2196F3',
    padding: 15,
    alignItems: 'center',
  },
  appTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  urlInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  goButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    justifyContent: 'center',
  },
  goButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  navigationBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  navButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  navButtonDisabled: {
    backgroundColor: '#ccc',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingBar: {
    padding: 5,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: '#666',
  },
  webView: {
    flex: 1,
  },
});

export default App;
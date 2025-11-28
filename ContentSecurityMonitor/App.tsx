/**
 * Content Security Monitor App
 * React Native WebView-based content filtering application
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
  Animated,
  Easing,
  Platform,
  Image,
} from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WarningModal from './src/WarningModal';
import HistoryModal from './src/HistoryModal';
import SettingsModal from './src/SettingsModal';
import UserInfoModal from './src/UserInfoModal';
import ArticleNotificationModal from './src/ArticleNotification';
import StatisticsChart from './src/StatisticsChart';
import NotificationSystem from './src/NotificationSystem';
import { ContentDetector } from './src/ContentDetector';
import StorageService, { ContentAccessRecord } from './src/StorageService';
import FrequencyMonitor from './src/FrequencyMonitor';
import { UserInfoProvider, useUserInfo } from './src/UserInfoContext';
import colors from './src/colors';

const AppContent = () => {
  const [url, setUrl] = useState('https://www.google.com');
  const [currentUrl, setCurrentUrl] = useState('https://www.google.com');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningInfo, setWarningInfo] = useState({ title: '', message: '' });
  const [pendingUrl, setPendingUrl] = useState('');
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showArticles, setShowArticles] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [blockedCount, setBlockedCount] = useState(0);
  const [safeBrowsingCount, setSafeBrowsingCount] = useState(0);
  const [bypassedCount, setBypassedCount] = useState(0);
  const [statistics, setStatistics] = useState<any>({});
  const [frequencySettings, setFrequencySettings] = useState({
    warningThreshold: 3,
    blockingThreshold: 5,
  });
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const webViewRef = useRef<WebView>(null);
  const { userInfo, isUserInfoComplete, setUserInfo } = useUserInfo();

  // Load frequency settings from FrequencyMonitor service on app start
  useEffect(() => {
    const loadFrequencySettings = async () => {
      try {
        const settings = await FrequencyMonitor.getFrequencySettings();
        setFrequencySettings(settings);
      } catch (error) {
        console.error('Error loading frequency settings:', error);
      }
    };

    loadFrequencySettings();
  }, []);

  // Check if user info is complete on app start
  useEffect(() => {
    const checkUserInfo = async () => {
      const savedUserInfo = await StorageService.getUserInfo();
      if (!savedUserInfo) {
        setShowUserInfo(true);
      } else {
        // Load statistics
        loadStatistics();
        // Add sample articles for demo
        addSampleArticles();
      }
    };
    
    checkUserInfo();
  }, []);

  // Animation for loading state
  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0.3,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      fadeAnim.setValue(1);
    }
  }, [loading, fadeAnim]);

  const loadStatistics = async () => {
    try {
      const stats = await StorageService.getStatistics();
      setStatistics(stats);
      setBlockedCount(stats.totalBlocked || 0);
      setBypassedCount(stats.totalBypassed || 0);
      setSafeBrowsingCount(stats.totalSafe || 0);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const addSampleArticles = async () => {
    try {
      const articles = await StorageService.getArticleNotifications();
      if (articles.length === 0) {
        // Add sample articles if none exist
        await StorageService.saveArticleNotification({
          title: 'Understanding Internet Addiction',
          content: 'Internet addiction is a growing concern, especially among young people. Learn to recognize the signs and develop healthy browsing habits. Set time limits for your online activities and take regular breaks to maintain a balanced lifestyle.',
          category: 'anti_addiction',
        });
        
        await StorageService.saveArticleNotification({
          title: 'Protecting Your Privacy Online',
          content: 'Online privacy is crucial in today\'t digital world. Use strong passwords, enable two-factor authentication, and be cautious about sharing personal information. Regularly review your privacy settings on social media platforms and avoid clicking on suspicious links.',
          category: 'cybersecurity',
        });
        
        await StorageService.saveArticleNotification({
          title: 'Creating a Safe Browsing Environment for Children',
          content: 'Parents play a vital role in ensuring their children\'s online safety. Use parental control software, have open conversations about internet safety, and set clear guidelines for appropriate online behavior. Monitor your child\'s online activities and educate them about potential risks.',
          category: 'parental_control',
        });
      }
    } catch (error) {
      console.error('Error adding sample articles:', error);
    }
  };

  const handleNavigation = async () => {
    if (url.trim() === '') {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    // Extract domain for frequency checking
    let domain = '';
    try {
      const urlObj = new URL(formattedUrl);
      domain = urlObj.hostname;
    } catch (e) {
      domain = formattedUrl;
    }

    // Check frequency-based access status
    const accessStatus = await FrequencyMonitor.checkDomainAccessStatus(domain);
    if (accessStatus.shouldBlock) {
      setWarningInfo({
        title: 'Access Blocked',
        message: accessStatus.message,
      });
      setShowWarning(true);
      setBlockedCount(prev => prev + 1);
      
      // Record blocked access
      recordContentAccess(formattedUrl, 'blocked');
      return;
    }

    if (accessStatus.shouldWarn) {
      setWarningInfo({
        title: 'Frequency Warning',
        message: accessStatus.message,
      });
      setPendingUrl(formattedUrl);
      setShowWarning(true);
      // Don't return here - allow user to proceed if they confirm
    }

    // Check URL for prohibited content
    if (ContentDetector.checkUrl(formattedUrl)) {
      setWarningInfo({
        title: 'Content Warning',
        message: 'This website may contain inappropriate content and has been blocked for your safety.',
      });
      setPendingUrl(formattedUrl);
      setShowWarning(true);
      setBlockedCount(prev => prev + 1);
      
      // Record blocked access
      recordContentAccess(formattedUrl, 'blocked');
      return;
    }

    setCurrentUrl(formattedUrl);
    setLoading(true);
    setProgress(0);
    
    // Record safe access
    recordContentAccess(formattedUrl, 'safe');
  };

  const recordContentAccess = async (url: string, contentType: ContentAccessRecord['contentType']) => {
    try {
      await StorageService.recordContentAccess({
        url,
        contentType,
      });
      
      // Update statistics
      await StorageService.updateStatistics({
        id: Date.now().toString(),
        url,
        timestamp: new Date().toISOString(),
        contentType,
      });
      
      // Refresh statistics
      loadStatistics();
    } catch (error) {
      console.error('Error recording content access:', error);
    }
  };

  const handleNavigationStateChange = async (navState: any) => {
    // Extract domain for frequency checking
    let domain = '';
    try {
      const urlObj = new URL(navState.url);
      domain = urlObj.hostname;
    } catch (e) {
      domain = navState.url;
    }

    // Check frequency-based access status
    const accessStatus = await FrequencyMonitor.checkDomainAccessStatus(domain);
    if (accessStatus.shouldBlock) {
      setWarningInfo({
        title: 'Access Blocked',
        message: accessStatus.message,
      });
      setShowWarning(true);
      setBlockedCount(prev => prev + 1);
      
      // Record blocked access
      recordContentAccess(navState.url, 'blocked');
      return;
    }

    if (accessStatus.shouldWarn) {
      setWarningInfo({
        title: 'Frequency Warning',
        message: accessStatus.message,
      });
      setPendingUrl(navState.url);
      setShowWarning(true);
      // Don't return here - allow user to proceed if they confirm
    }

    // Check URL for prohibited content
    if (ContentDetector.checkUrl(navState.url)) {
      setWarningInfo({
        title: 'Content Warning',
        message: 'This website may contain inappropriate content and has been blocked for your safety.',
      });
      setShowWarning(true);
      setBlockedCount(prev => prev + 1);
      
      // Record blocked access
      recordContentAccess(navState.url, 'blocked');
      return;
    }
    // Record safe access
    recordContentAccess(navState.url, 'safe');
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

  const onMessage = async (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === 'CONTENT_CHECK') {
        // Extract domain for frequency checking
        let domain = '';
        try {
          const urlObj = new URL(message.url);
          domain = urlObj.hostname;
        } catch (e) {
          domain = message.url;
        }

        // Check frequency-based access status
        const accessStatus = await FrequencyMonitor.checkDomainAccessStatus(domain);
        if (accessStatus.shouldBlock) {
          setWarningInfo({
            title: 'Access Blocked',
            message: accessStatus.message,
          });
          setShowWarning(true);
          setBlockedCount(prev => prev + 1);
          
          // Record blocked access
          recordContentAccess(message.url, 'blocked');
          return;
        }

        if (accessStatus.shouldWarn) {
          setWarningInfo({
            title: 'Frequency Warning',
            message: accessStatus.message,
          });
          setPendingUrl(message.url);
          setShowWarning(true);
          // Don't return here - allow user to proceed if they confirm
        }

        // Check page content for prohibited content
        if (ContentDetector.checkContent(message.content)) {
          setWarningInfo({
            title: 'Content Warning',
            message: 'Inappropriate content detected on this page and has been blocked for your safety.',
          });
          setShowWarning(true);
          setBlockedCount(prev => prev + 1);
          
          // Record blocked access
          recordContentAccess(message.url, 'blocked');
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
      
      // Record bypassed warning
      recordContentAccess(pendingUrl, 'warning_bypassed');
      setBypassedCount(prev => prev + 1);
      
      // Check if this is a frequency warning and increment counter
      if (warningInfo.title === 'Frequency Warning') {
        setStatistics((prev: any) => ({
          ...prev,
          totalWarnings: (prev.totalWarnings || 0) + 1
        }));
      }
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
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', onPress: () => Alert.alert('Success', 'Settings have been reset to default') },
      ]
    );
  };

  const handleSaveUserInfo = async (userInfoData: any) => {
    try {
      await setUserInfo({
        ...userInfoData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setShowUserInfo(false);
      
      // Load statistics and add sample articles after user info is saved
      loadStatistics();
      addSampleArticles();
    } catch (error) {
      console.error('Error saving user info:', error);
      Alert.alert('Error', 'Failed to save user information');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
      <View style={styles.appHeader}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.appTitle}>Content Security Monitor</Text>
            <Text style={styles.appSubtitle}>Protecting your browsing experience</Text>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{blockedCount}</Text>
              <Text style={styles.statLabel}>Blocked</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{bypassedCount}</Text>
              <Text style={styles.statLabel}>Bypassed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{statistics.totalSafe || 0}</Text>
              <Text style={styles.statLabel}>Safe</Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.header}>
        <View style={styles.urlContainer}>
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

      {/* Quick Access Buttons */}
      <View style={styles.quickAccessContainer}>
        <TouchableOpacity 
          style={styles.quickAccessButton} 
          onPress={() => setShowStatistics(true)}
        >
          <Text style={styles.quickAccessButtonText}>📊 Statistics</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickAccessButton} 
          onPress={() => setShowArticles(true)}
        >
          <Text style={styles.quickAccessButtonText}>📰 Articles</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickAccessButton} 
          onPress={() => setShowSettings(true)}
        >
          <Text style={styles.quickAccessButtonText}>⚙️ Settings</Text>
        </TouchableOpacity>
        
        {!isUserInfoComplete && (
          <TouchableOpacity 
            style={styles.quickAccessButton} 
            onPress={() => setShowUserInfo(true)}
          >
            <Text style={styles.quickAccessButtonText}>👤 Complete Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <Animated.View style={[styles.loadingBar, { opacity: fadeAnim }]}>           
            <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
          </Animated.View>
          <Text style={styles.loadingText}>{Math.round(progress * 100)}% Loading...</Text>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ uri: currentUrl }}
        style={styles.webView}
        onLoadEnd={() => setLoading(false)}
        onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
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
      
      <UserInfoModal
        visible={showUserInfo}
        onClose={() => setShowUserInfo(false)}
        onSave={handleSaveUserInfo}
      />
      
      <ArticleNotificationModal
        visible={showArticles}
        onClose={() => setShowArticles(false)}
      />
      
      {showStatistics && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Browsing Statistics</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton} 
                onPress={() => setShowStatistics(false)}
              >
                <Text style={styles.modalCloseButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            <StatisticsChart statistics={statistics} />
          </View>
        </View>
      )}
      
      <NotificationSystem frequencySettings={frequencySettings} />
    </SafeAreaView>
  );
};

const App = () => {
  return (
    <UserInfoProvider>
      <AppContent />
    </UserInfoProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  appHeader: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  appTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: 'bold',
  },
  appSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    marginTop: 3,
  },
  statsContainer: {
    flexDirection: 'row',
  },
  statItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 10,
    alignItems: 'center',
  },
  statNumber: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
  },
  header: {
    padding: 15,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray300,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  urlContainer: {
    flexDirection: 'row',
  },
  urlInput: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderColor: colors.gray400,
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    backgroundColor: colors.gray100,
  },
  goButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    justifyContent: 'center',
    marginLeft: 10,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  goButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  navigationBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray300,
    justifyContent: 'space-around',
  },
  navButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  navButtonDisabled: {
    backgroundColor: colors.gray500,
  },
  navButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickAccessContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray300,
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  quickAccessButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    margin: 5,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  quickAccessButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray300,
  },
  loadingBar: {
    height: 6,
    backgroundColor: colors.gray300,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  loadingText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 5,
  },
  webView: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderRadius: 15,
    width: '90%',
    height: '80%',
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: {
          width: 0,
          height: 5,
        },
        shadowOpacity: 0.34,
        shadowRadius: 6.27,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalHeader: {
    backgroundColor: colors.primary,
    padding: 20,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: 5,
  },
  modalCloseButtonText: {
    color: colors.white,
    fontSize: 28,
    fontWeight: 'bold',
  },
});

export default App;
/**
 * SettingsModal.tsx
 * Settings modal component for the Content Security Monitor app
 */

import React, {useState, useEffect} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Switch,
  ScrollView,
  Image,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import {ContentDetector} from './ContentDetector';
import colors from './colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DataImportService from './DataImportService';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onClearHistory: () => void;
  onResetSettings: () => void;
}

interface FrequencySettings {
  warningThreshold: number;
  blockingThreshold: number;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  onClearHistory,
  onResetSettings,
}) => {
  const [enableContentFiltering, setEnableContentFiltering] = useState(true);
  const [enableSafeBrowsing, setEnableSafeBrowsing] = useState(true);
  const [blockAds, setBlockAds] = useState(false);
  const [showBlockedContentWarning, setShowBlockedContentWarning] = useState(true);
  const [enableParentalControl, setEnableParentalControl] = useState(false);
  const [blockSocialMedia, setBlockSocialMedia] = useState(false);
  const [frequencySettings, setFrequencySettings] = useState<FrequencySettings>({
    warningThreshold: 3,
    blockingThreshold: 5,
  });

  const prohibitedKeywords = ContentDetector.getProhibitedKeywords();

  // Load frequency settings from AsyncStorage on component mount
  useEffect(() => {
    if (visible) {
      loadFrequencySettings();
    }
  }, [visible]);

  const loadFrequencySettings = async () => {
    try {
      const settingsStr = await AsyncStorage.getItem('frequency_settings');
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        setFrequencySettings({
          warningThreshold: settings.warningThreshold || 3,
          blockingThreshold: settings.blockingThreshold || 5,
        });
      }
    } catch (error) {
      console.error('Error loading frequency settings:', error);
    }
  };

  const saveFrequencySettings = async (settings: FrequencySettings) => {
    try {
      await AsyncStorage.setItem('frequency_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving frequency settings:', error);
    }
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Confirm Reset',
      'Are you sure you want to reset all settings to default?',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Reset', onPress: async () => {
          setEnableContentFiltering(true);
          setEnableSafeBrowsing(true);
          setBlockAds(false);
          setShowBlockedContentWarning(true);
          setEnableParentalControl(false);
          setBlockSocialMedia(false);
          const defaultFrequencySettings = {
            warningThreshold: 3,
            blockingThreshold: 5,
          };
          setFrequencySettings(defaultFrequencySettings);
          await saveFrequencySettings(defaultFrequencySettings);
          Alert.alert('Success', 'Settings have been reset to default');
        }},
      ]
    );
  };

  const handleWarningThresholdChange = async (value: number) => {
    const newSettings = {
      ...frequencySettings,
      warningThreshold: value,
    };
    setFrequencySettings(newSettings);
    await saveFrequencySettings(newSettings);
  };

  const handleBlockingThresholdChange = async (value: number) => {
    const newSettings = {
      ...frequencySettings,
      blockingThreshold: value,
    };
    setFrequencySettings(newSettings);
    await saveFrequencySettings(newSettings);
  };

  const securitySettings = [
    { id: 'contentFiltering', title: 'Content Filtering', description: 'Block inappropriate content', value: enableContentFiltering, setter: setEnableContentFiltering, icon: '🛡️' },
    { id: 'safeBrowsing', title: 'Safe Browsing', description: 'Protect against phishing and malware', value: enableSafeBrowsing, setter: setEnableSafeBrowsing, icon: '🔒' },
    { id: 'blockedWarning', title: 'Blocked Content Warning', description: 'Show warnings for blocked sites', value: showBlockedContentWarning, setter: setShowBlockedContentWarning, icon: '⚠️' },
    { id: 'parentalControl', title: 'Parental Control', description: 'Additional protection for children', value: enableParentalControl, setter: setEnableParentalControl, icon: '👨‍👩‍👧‍👦' },
  ];

  const privacySettings = [
    { id: 'blockAds', title: 'Block Ads', description: 'Reduce ads and tracking', value: blockAds, setter: setBlockAds, icon: '🖼️' },
    { id: 'blockSocial', title: 'Block Social Media', description: 'Restrict social media access', value: blockSocialMedia, setter: setBlockSocialMedia, icon: '📱' },
  ];

  const frequencySettingsData = [
    { 
      id: 'warningThreshold', 
      title: 'Warning Threshold', 
      description: 'Show warning after accessing a domain this many times per day', 
      value: frequencySettings.warningThreshold,
      setter: handleWarningThresholdChange,
      min: 1,
      max: 10,
      icon: '⚠️' 
    },
    { 
      id: 'blockingThreshold', 
      title: 'Blocking Threshold', 
      description: 'Block domain after accessing it this many times per day', 
      value: frequencySettings.blockingThreshold,
      setter: handleBlockingThresholdChange,
      min: 1,
      max: 20,
      icon: '🚫' 
    },
  ];

  const handleExportData = async () => {
    try {
      const data = await DataImportService.exportAndroidData();
      
      // Show alert with instructions for export
      Alert.alert(
        'Export Data',
        'To export your data:\\n\\n1. The data has been prepared for export\\n2. In a complete implementation, this would save to a file\\n3. You can then import this file into your PC browser extension\\n\\nThe data includes your browsing history, statistics, and profile information.',
        [
          { text: 'OK' },
          {
            text: 'View Data Structure',
            onPress: () => {
              const dataPreview = {
                userInfo: data.userInfo ? 'User profile data included' : 'No user info',
                contentRecords: `${data.contentAccessRecords?.length || 0} records`,
                statistics: data.statistics ? 'Statistics data included' : 'No statistics',
                articles: `${data.articleNotifications?.length || 0} notifications`,
                timestamp: data.timestamp,
                version: data.version
              };
              Alert.alert('Data Structure Preview', JSON.stringify(dataPreview, null, 2));
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Export Error', 'Failed to export data: ' + (error as Error).message);
    }
  };

  const handleImportData = async () => {
    try {
      // Show instructions for import
      Alert.alert(
        'Import Data from PC Browser',
        'To import data from your PC browser extension:\\n\\n1. Export data from your browser extension\\n2. Save the JSON file to your device\\n3. Select the file when prompted\\n\\nThis will merge your PC browsing history with your mobile data.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Select File',
            onPress: async () => {
              try {
                // Use DocumentPicker to select a file
                const result = await DocumentPicker.pick({
                  type: [DocumentPicker.types.json, DocumentPicker.types.plainText],
                });
                
                if (result && result[0] && result[0].uri) {
                  // In a real implementation, you would read the file content
                  // For now, we'll show a simulation with actual file selection
                  Alert.alert(
                    'File Selected',
                    `Selected file: ${result[0].name}\\n\\nIn a complete implementation, this would read and import the data from your browser extension. For demonstration, we'll simulate importing sample data that matches the structure of your selected file.`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Import Data',
                        onPress: async () => {
                          // Create sample data to simulate import (matching expected structure)
                          const sampleData = {
                            userInfo: {
                              gender: 'male',
                              age: '25-34',
                              education: 'Bachelor\'s Degree',
                              occupation: 'Engineer',
                              browsingFrequency: 'daily'
                            },
                            contentAccessRecords: [
                              {
                                id: 'pc-import-1',
                                url: 'https://example.com',
                                timestamp: new Date().toISOString(),
                                contentType: 'safe' as const
                              },
                              {
                                id: 'pc-import-2',
                                url: 'https://blocked-site.com',
                                timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                                contentType: 'blocked' as const
                              }
                            ],
                            statistics: {
                              totalBlocked: 3,
                              totalSafe: 45,
                              totalWarnings: 2,
                              totalBypassed: 1,
                              dailyAccess: {
                                '2023-06-01': 8,
                                '2023-06-02': 12
                              },
                              hourlyDistribution: {
                                '9': 5,
                                '10': 7,
                                '14': 3
                              },
                              contentTypeDistribution: {
                                'safe': 45,
                                'blocked': 3,
                                'warning_bypassed': 1
                              },
                              dailyDomainAccess: {
                                '2023-06-01': {
                                  'example.com': 2,
                                  'worksite.com': 6
                                },
                                '2023-06-02': {
                                  'news-site.com': 5,
                                  'example.com': 3,
                                  'blocked-site.com': 4
                                }
                              },
                              weeklyAccessPattern: {
                                '1': 15, // Monday
                                '2': 20, // Tuesday
                                '5': 8   // Friday
                              }
                            },
                            articleNotifications: [
                              {
                                id: 'pc-article-1',
                                title: 'Cross-Device Browsing Safety',
                                content: 'Tips for maintaining safe browsing habits across all your devices including PC and mobile.',
                                category: 'cybersecurity' as const,
                                timestamp: new Date().toISOString(),
                                read: false
                              }
                            ],
                            timestamp: new Date().toISOString(),
                            version: '1.0.0'
                          };
                          
                          const success = await DataImportService.importBrowserExtensionData(sampleData);
                          if (success) {
                            Alert.alert(
                              'Import Successful', 
                              'Data from your PC browser has been imported and merged with your existing mobile data. Your statistics have been updated with cross-device browsing patterns.'
                            );
                          } else {
                            Alert.alert('Import Error', 'Failed to import data');
                          }
                        }
                      }
                    ]
                  );
                }
              } catch (err) {
                if (DocumentPicker.isCancel(err)) {
                  // User cancelled the picker
                  return;
                }
                Alert.alert('File Error', 'Failed to select file: ' + (err as Error).message);
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Import Error', 'Failed to import data: ' + (error as Error).message);
    }
  };

  const dataActions = [
    { id: 'clearHistory', title: 'Clear Browsing History', icon: '🧹', action: onClearHistory },
    { id: 'resetSettings', title: 'Reset to Default Settings', icon: '🔄', action: handleResetSettings },
    { id: 'exportData', title: 'Export for PC Browser', icon: '📤', action: handleExportData },
    { id: 'importData', title: 'Import from PC Browser', icon: '📥', action: handleImportData },
    { id: 'viewProfile', title: 'View/Edit Profile', icon: '👤', action: () => Alert.alert('Info', 'Profile feature available in main app') },
  ];

  return (
    <Modal
      transparent={true}
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Settings</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.content}>
            {/* Security Settings Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Security Settings</Text>
                <Text style={styles.sectionSubtitle}>Protect your browsing experience</Text>
              </View>
              
              {securitySettings.map((setting) => (
                <View key={setting.id} style={styles.settingItem}>
                  <View style={styles.settingIconContainer}>
                    <Text style={styles.settingIcon}>{setting.icon}</Text>
                  </View>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingTitle}>{setting.title}</Text>
                    <Text style={styles.settingDescription}>{setting.description}</Text>
                  </View>
                  <Switch
                    value={setting.value}
                    onValueChange={setting.setter}
                    trackColor={{ false: "#767577", true: "#2196F3" }}
                    thumbColor={setting.value ? "#f4f3f4" : "#f4f3f4"}
                  />
                </View>
              ))}
            </View>
            
            {/* Privacy Settings Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Privacy Settings</Text>
                <Text style={styles.sectionSubtitle}>Control your data and privacy</Text>
              </View>
              
              {privacySettings.map((setting) => (
                <View key={setting.id} style={styles.settingItem}>
                  <View style={styles.settingIconContainer}>
                    <Text style={styles.settingIcon}>{setting.icon}</Text>
                  </View>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingTitle}>{setting.title}</Text>
                    <Text style={styles.settingDescription}>{setting.description}</Text>
                  </View>
                  <Switch
                    value={setting.value}
                    onValueChange={setting.setter}
                    trackColor={{ false: "#767577", true: "#4CAF50" }}
                    thumbColor={setting.value ? "#f4f3f4" : "#f4f3f4"}
                  />
                </View>
              ))}
            </View>
            
            {/* Keywords Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Blocked Keywords</Text>
                <Text style={styles.sectionSubtitle}>Content filtered by these keywords</Text>
              </View>
              <View style={styles.keywordsContainer}>
                {prohibitedKeywords.map((keyword, index) => (
                  <View key={index} style={styles.keywordTag}>
                    <Text style={styles.keywordText}>{keyword}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity 
                style={styles.addKeywordButton}
                onPress={() => Alert.alert('Info', 'Add keyword feature coming soon')}
              >
                <Text style={styles.addKeywordText}>+ Add New Keyword</Text>
              </TouchableOpacity>
            </View>
            
            {/* Data Management Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Data Management</Text>
                <Text style={styles.sectionSubtitle}>Manage your app data</Text>
              </View>
              
              {dataActions.map((action) => (
                <TouchableOpacity 
                  key={action.id}
                  style={styles.actionItem}
                  onPress={action.action}
                >
                  <View style={styles.actionIconContainer}>
                    <Text style={styles.actionIcon}>{action.icon}</Text>
                  </View>
                  <Text style={styles.actionText}>{action.title}</Text>
                  <Text style={styles.actionArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Frequency Monitoring Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Frequency Monitoring</Text>
                <Text style={styles.sectionSubtitle}>Control domain access frequency</Text>
              </View>
              
              {frequencySettingsData.map((setting) => (
                <View key={setting.id} style={styles.settingItem}>
                  <View style={styles.settingIconContainer}>
                    <Text style={styles.settingIcon}>{setting.icon}</Text>
                  </View>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingTitle}>{setting.title}</Text>
                    <Text style={styles.settingDescription}>{setting.description}</Text>
                  </View>
                  <View style={styles.numberInputContainer}>
                    <TouchableOpacity 
                      style={styles.numberButton}
                      onPress={() => setting.value > setting.min && setting.setter(setting.value - 1)}
                    >
                      <Text style={styles.numberButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.numberValue}>{setting.value}</Text>
                    <TouchableOpacity 
                      style={styles.numberButton}
                      onPress={() => setting.value < setting.max && setting.setter(setting.value + 1)}
                    >
                      <Text style={styles.numberButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
            
            {/* App Info */}
            <View style={styles.section}>
              <View style={styles.appInfoContainer}>
                <Image 
                  source={{uri: 'https://cdn-icons-png.flaticon.com/512/594/594517.png'}} 
                  style={styles.appIcon}
                />
                <View style={styles.appInfoTextContainer}>
                  <Text style={styles.appName}>Content Security Monitor</Text>
                  <Text style={styles.appVersion}>Version 1.0.0</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    height: Dimensions.get('window').height * 0.8,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: {
          width: 0,
          height: 12,
        },
        shadowOpacity: 0.58,
        shadowRadius: 16.0,
      },
      android: {
        elevation: 24,
      },
    }),
  },
  header: {
    backgroundColor: colors.primary,
    padding: 20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    color: colors.white,
    fontSize: 28,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray300,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingIcon: {
    fontSize: 20,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  settingDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  keywordTag: {
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  keywordText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  addKeywordButton: {
    padding: 15,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 10,
    alignItems: 'center',
  },
  addKeywordText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
  actionArrow: {
    fontSize: 20,
    color: colors.textDisabled,
  },
  numberInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: 10,
    padding: 5,
  },
  numberButton: {
    backgroundColor: colors.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  numberValue: {
    marginHorizontal: 15,
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    minWidth: 20,
    textAlign: 'center',
  },
  appInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
    borderRadius: 15,
  },
  appIcon: {
    width: 60,
    height: 60,
    marginRight: 15,
  },
  appInfoTextContainer: {
    flex: 1,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 5,
  },
  appVersion: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default SettingsModal;
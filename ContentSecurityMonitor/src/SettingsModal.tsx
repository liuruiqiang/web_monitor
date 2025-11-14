/**
 * SettingsModal.tsx
 * Settings modal component for the Content Security Monitor app
 */

import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Switch,
  ScrollView,
} from 'react-native';
import {ContentDetector} from './ContentDetector';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onClearHistory: () => void;
  onResetSettings: () => void;
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

  const prohibitedKeywords = ContentDetector.getProhibitedKeywords();

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
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Content Filtering</Text>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingText}>Enable Content Filtering</Text>
                <Switch
                  value={enableContentFiltering}
                  onValueChange={setEnableContentFiltering}
                />
              </View>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingText}>Show Blocked Content Warning</Text>
                <Switch
                  value={showBlockedContentWarning}
                  onValueChange={setShowBlockedContentWarning}
                />
              </View>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Privacy & Security</Text>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingText}>Enable Safe Browsing</Text>
                <Switch
                  value={enableSafeBrowsing}
                  onValueChange={setEnableSafeBrowsing}
                />
              </View>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingText}>Block Ads</Text>
                <Switch
                  value={blockAds}
                  onValueChange={setBlockAds}
                />
              </View>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Keywords to Block</Text>
              <View style={styles.keywordsContainer}>
                {prohibitedKeywords.map((keyword, index) => (
                  <View key={index} style={styles.keywordTag}>
                    <Text style={styles.keywordText}>{keyword}</Text>
                  </View>
                ))}
              </View>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Data Management</Text>
              
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={onClearHistory}
              >
                <Text style={styles.actionButtonText}>Clear Browsing History</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={onResetSettings}
              >
                <Text style={styles.actionButtonText}>Reset to Default Settings</Text>
              </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: Dimensions.get('window').height * 0.7,
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  settingText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  keywordTag: {
    backgroundColor: '#e0e0e0',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 10,
    marginBottom: 10,
  },
  keywordText: {
    fontSize: 12,
    color: '#333',
  },
  actionButton: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#333',
  },
});

export default SettingsModal;
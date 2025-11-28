/**
 * HistoryModal.tsx
 * History modal component for browsing history
 */

import React, {useState, useMemo} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  TextInput,
  Image,
} from 'react-native';
import colors from './colors';

interface HistoryModalProps {
  visible: boolean;
  history: string[];
  onSelectUrl: (url: string) => void;
  onClose: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({
  visible,
  history,
  onSelectUrl,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter history based on search query
  const filteredHistory = useMemo(() => {
    if (!searchQuery) return history;
    return history.filter(url => 
      url.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [history, searchQuery]);

  // Format URL for display
  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  // Get favicon URL
  const getFaviconUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
    } catch {
      return 'https://cdn-icons-png.flaticon.com/512/594/594517.png';
    }
  };

  return (
    <Modal
      transparent={true}
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Browsing History</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search history..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
            {searchQuery ? (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={() => setSearchQuery('')}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          
          {/* History Stats */}
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              {filteredHistory.length} {filteredHistory.length === 1 ? 'item' : 'items'}
              {searchQuery ? ' found' : ' total'}
            </Text>
          </View>
          
          <ScrollView style={styles.content}>
            {filteredHistory.length === 0 ? (
              <View style={styles.emptyState}>
                <Image 
                  source={{uri: 'https://cdn-icons-png.flaticon.com/512/594/594517.png'}} 
                  style={styles.emptyStateIcon}
                />
                <Text style={styles.emptyStateText}>
                  {searchQuery ? 'No matching history found' : 'No browsing history yet'}
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  {searchQuery ? 'Try a different search term' : 'Your visited websites will appear here'}
                </Text>
              </View>
            ) : (
              filteredHistory.map((url, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.historyItem}
                  onPress={() => {
                    onSelectUrl(url);
                    onClose();
                  }}>
                  <Image 
                    source={{uri: getFaviconUrl(url)}} 
                    style={styles.favicon}
                  />
                  <View style={styles.historyTextContainer}>
                    <Text style={styles.historyTitle} numberOfLines={1}>
                      {formatUrl(url)}
                    </Text>
                    <Text style={styles.historyUrl} numberOfLines={1}>
                      {url}
                    </Text>
                  </View>
                  <Text style={styles.historyIndex}>#{history.length - index}</Text>
                </TouchableOpacity>
              ))
            )}
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
    height: Dimensions.get('window').height * 0.7,
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: colors.gray100,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray300,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 15,
    fontSize: 16,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  clearButton: {
    position: 'absolute',
    right: 30,
    top: 25,
    padding: 5,
  },
  clearButtonText: {
    fontSize: 18,
    color: colors.textDisabled,
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.surfaceLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray300,
  },
  statsText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    marginBottom: 20,
    opacity: 0.7,
  },
  emptyStateText: {
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray300,
    backgroundColor: colors.surface,
  },
  favicon: {
    width: 32,
    height: 32,
    borderRadius: 4,
    marginRight: 15,
  },
  historyTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  historyUrl: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  historyIndex: {
    fontSize: 12,
    color: colors.textDisabled,
  },
});

export default HistoryModal;
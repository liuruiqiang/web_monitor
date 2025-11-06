/**
 * History Screen - View blocked content history
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HistoryScreen() {
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const historyJson = await AsyncStorage.getItem('warningHistory');
      if (historyJson) {
        const parsed = JSON.parse(historyJson);
        setHistory(parsed);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const clearHistory = () => {
    Alert.alert(
      '确认清空',
      '确定要清空所有历史记录吗？此操作不可恢复。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清空',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('warningHistory');
            setHistory([]);
            Alert.alert('成功', '历史记录已清空');
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyType}>{item.detectionType}</Text>
        <Text style={styles.historyTime}>
          {new Date(item.timestamp).toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
      
      <Text style={styles.historyReason}>{item.reason}</Text>
      
      <Text style={styles.historyUrl} numberOfLines={2}>
        🔗 {item.url}
      </Text>
      
      {item.content && (
        <Text style={styles.historyContent} numberOfLines={3}>
          📄 {item.content}
        </Text>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>✅</Text>
      <Text style={styles.emptyText}>暂无拦截记录</Text>
      <Text style={styles.emptySubtext}>
        当检测到不当内容时，记录将显示在这里
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.stats}>
          <Text style={styles.statsNumber}>{history.length}</Text>
          <Text style={styles.statsLabel}>条拦截记录</Text>
        </View>
        
        {history.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={clearHistory}>
            <Text style={styles.clearButtonText}>清空历史</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        ListEmptyComponent={renderEmpty}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={history.length === 0 ? styles.emptyList : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statsNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginRight: 8,
  },
  statsLabel: {
    fontSize: 14,
    color: '#666',
  },
  clearButton: {
    backgroundColor: '#ff5722',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  historyItem: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 15,
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ff5722',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyType: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  historyTime: {
    fontSize: 12,
    color: '#999',
  },
  historyReason: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '600',
  },
  historyUrl: {
    fontSize: 12,
    color: '#1976d2',
    marginBottom: 5,
  },
  historyContent: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 5,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

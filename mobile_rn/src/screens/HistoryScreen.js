/**
 * History Screen - View blocked content history
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import {useHistory} from '../context/HistoryContext';

export default function HistoryScreen() {
  const {history, isLoading, clearHistory, deleteWarning, loadHistory} =
    useHistory();

  const handleClearAll = () => {
    Alert.alert(
      '确认清空',
      '确定要清空所有历史记录吗？此操作不可恢复。',
      [
        {text: '取消', style: 'cancel'},
        {
          text: '清空',
          style: 'destructive',
          onPress: async () => {
            const success = await clearHistory();
            if (success) {
              Alert.alert('成功', '历史记录已清空');
            }
          },
        },
      ],
    );
  };

  const handleDelete = (id) => {
    Alert.alert('删除记录', '确定要删除这条记录吗？', [
      {text: '取消', style: 'cancel'},
      {
        text: '删除',
        style: 'destructive',
        onPress: () => deleteWarning(id),
      },
    ]);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date
      .getDate()
      .toString()
      .padStart(2, '0')} ${date
      .getHours()
      .toString()
      .padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const renderItem = ({item}) => (
    <TouchableOpacity
      style={styles.historyItem}
      onLongPress={() => handleDelete(item.id)}>
      <View style={styles.historyHeader}>
        <View style={styles.typeTag}>
          <Text style={styles.typeText}>{item.detectionType}</Text>
        </View>
        <Text style={styles.historyTime}>{formatTime(item.timestamp)}</Text>
      </View>

      <Text style={styles.historyReason}>{item.reason}</Text>

      <View style={styles.urlContainer}>
        <Text style={styles.urlIcon}>🔗</Text>
        <Text style={styles.historyUrl} numberOfLines={2}>
          {item.url}
        </Text>
      </View>

      {item.content && (
        <View style={styles.contentBox}>
          <Text style={styles.contentIcon}>📄</Text>
          <Text style={styles.historyContent} numberOfLines={3}>
            {item.content}
          </Text>
        </View>
      )}
    </TouchableOpacity>
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
          <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
            <Text style={styles.clearButtonText}>清空历史</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadHistory} />
        }
        contentContainerStyle={
          history.length === 0 ? styles.emptyList : styles.list
        }
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
  list: {
    padding: 15,
  },
  historyItem: {
    backgroundColor: '#fff',
    marginBottom: 12,
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ff5722',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeTag: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#c62828',
  },
  historyTime: {
    fontSize: 12,
    color: '#999',
  },
  historyReason: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  urlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  urlIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  historyUrl: {
    flex: 1,
    fontSize: 12,
    color: '#1976d2',
  },
  contentBox: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  contentIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  historyContent: {
    flex: 1,
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
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

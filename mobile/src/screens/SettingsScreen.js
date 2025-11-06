/**
 * Settings Screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const [enabled, setEnabled] = useState(true);
  const [strictMode, setStrictMode] = useState(false);
  const [customKeywords, setCustomKeywords] = useState('');
  const [blockedDomains, setBlockedDomains] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsJson = await AsyncStorage.getItem('settings');
      if (settingsJson) {
        const settings = JSON.parse(settingsJson);
        setEnabled(settings.enabled !== false);
        setStrictMode(settings.strictMode || false);
        setCustomKeywords(settings.customKeywords?.join('\n') || '');
        setBlockedDomains(settings.blockedDomains?.join('\n') || '');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const settings = {
        enabled,
        strictMode,
        customKeywords: customKeywords.split('\n').filter(k => k.trim()),
        blockedDomains: blockedDomains.split('\n').filter(d => d.trim()),
        updatedAt: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem('settings', JSON.stringify(settings));
      Alert.alert('成功', '设置已保存');
    } catch (error) {
      console.error('Failed to save settings:', error);
      Alert.alert('错误', '保存设置失败');
    }
  };

  const resetSettings = () => {
    Alert.alert(
      '确认重置',
      '确定要恢复默认设置吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            setEnabled(true);
            setStrictMode(false);
            setCustomKeywords('');
            setBlockedDomains('');
            await AsyncStorage.removeItem('settings');
            Alert.alert('成功', '已恢复默认设置');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>基本设置</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>启用监控</Text>
            <Text style={styles.settingDescription}>
              开启后将实时监控网页内容
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={setEnabled}
            trackColor={{ false: '#ccc', true: '#4caf50' }}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>严格模式</Text>
            <Text style={styles.settingDescription}>
              更严格的检测标准，可能产生误报
            </Text>
          </View>
          <Switch
            value={strictMode}
            onValueChange={setStrictMode}
            trackColor={{ false: '#ccc', true: '#ff9800' }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>自定义关键词</Text>
        <Text style={styles.hint}>每行一个关键词</Text>
        <TextInput
          style={styles.textArea}
          value={customKeywords}
          onChangeText={setCustomKeywords}
          placeholder="例如：&#10;赌博&#10;暴力&#10;违禁品"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>屏蔽域名</Text>
        <Text style={styles.hint}>每行一个域名或域名片段</Text>
        <TextInput
          style={styles.textArea}
          value={blockedDomains}
          onChangeText={setBlockedDomains}
          placeholder="例如：&#10;example.com&#10;badsite.net"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
          <Text style={styles.saveButtonText}>保存设置</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.resetButton} onPress={resetSettings}>
          <Text style={styles.resetButtonText}>恢复默认</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🛡️ 内容安全监控器 v1.0.0
        </Text>
        <Text style={styles.footerSubtext}>
          所有数据均本地存储，不会上传
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#666',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 120,
    backgroundColor: '#fafafa',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff5722',
  },
  resetButtonText: {
    color: '#ff5722',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999',
  },
});

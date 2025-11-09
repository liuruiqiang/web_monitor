import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/settings_service.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final TextEditingController _keywordsController = TextEditingController();
  final TextEditingController _domainsController = TextEditingController();

  @override
  void initState() {
    super.initState();
    final settings = context.read<SettingsService>();
    _keywordsController.text = settings.customKeywords.join('\n');
    _domainsController.text = settings.blockedDomains.join('\n');
  }

  @override
  void dispose() {
    _keywordsController.dispose();
    _domainsController.dispose();
    super.dispose();
  }

  void _saveSettings() {
    final settings = context.read<SettingsService>();
    
    settings.setCustomKeywords(
      _keywordsController.text.split('\n').where((k) => k.trim().isNotEmpty).toList(),
    );
    settings.setBlockedDomains(
      _domainsController.text.split('\n').where((d) => d.trim().isNotEmpty).toList(),
    );

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('设置已保存')),
    );
  }

  void _resetSettings() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('确认重置'),
        content: const Text('确定要恢复默认设置吗？'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          FilledButton(
            onPressed: () {
              final settings = context.read<SettingsService>();
              settings.resetToDefaults();
              _keywordsController.clear();
              _domainsController.clear();
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('已恢复默认设置')),
              );
            },
            child: const Text('确定'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final settings = context.watch<SettingsService>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('设置'),
      ),
      body: ListView(
        children: [
          // Basic Settings
          const ListTile(
            title: Text('基本设置', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
          SwitchListTile(
            title: const Text('启用监控'),
            subtitle: const Text('开启后将实时监控网页内容'),
            value: settings.isEnabled,
            onChanged: settings.setEnabled,
          ),
          SwitchListTile(
            title: const Text('严格模式'),
            subtitle: const Text('更严格的检测标准，可能产生误报'),
            value: settings.strictMode,
            onChanged: settings.setStrictMode,
          ),
          const Divider(),

          // Custom Keywords
          const ListTile(
            title: Text('自定义关键词', style: TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text('每行一个关键词'),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _keywordsController,
              maxLines: 6,
              decoration: InputDecoration(
                hintText: '例如：\n赌博\n暴力\n违禁品',
                border: const OutlineInputBorder(),
                filled: true,
                fillColor: Theme.of(context).colorScheme.surfaceVariant,
              ),
            ),
          ),
          const Divider(),

          // Blocked Domains
          const ListTile(
            title: Text('屏蔽域名', style: TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text('每行一个域名或域名片段'),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _domainsController,
              maxLines: 6,
              decoration: InputDecoration(
                hintText: '例如：\nexample.com\nbadsite.net',
                border: const OutlineInputBorder(),
                filled: true,
                fillColor: Theme.of(context).colorScheme.surfaceVariant,
              ),
            ),
          ),
          const Divider(),

          // Action Buttons
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                FilledButton.icon(
                  onPressed: _saveSettings,
                  icon: const Icon(Icons.save),
                  label: const Text('保存设置'),
                  style: FilledButton.styleFrom(
                    minimumSize: const Size.fromHeight(48),
                  ),
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: _resetSettings,
                  icon: const Icon(Icons.restore),
                  label: const Text('恢复默认'),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size.fromHeight(48),
                    foregroundColor: Colors.red,
                  ),
                ),
              ],
            ),
          ),

          // Footer
          const Padding(
            padding: EdgeInsets.all(16),
            child: Column(
              children: [
                Text(
                  '🛡️ 内容安全监控器 v1.0.0',
                  style: TextStyle(fontSize: 14, color: Colors.grey),
                ),
                SizedBox(height: 4),
                Text(
                  '所有数据均本地存储，不会上传',
                  style: TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

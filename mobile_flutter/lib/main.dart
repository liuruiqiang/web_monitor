import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'screens/browser_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/history_screen.dart';
import 'services/settings_service.dart';
import 'services/history_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize services
  final settingsService = SettingsService();
  final historyService = HistoryService();
  await settingsService.init();
  await historyService.init();
  
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => settingsService),
        ChangeNotifierProvider(create: (_) => historyService),
      ],
      child: const ContentSecurityMonitorApp(),
    ),
  );
}

class ContentSecurityMonitorApp extends StatelessWidget {
  const ContentSecurityMonitorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '内容安全监控器',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.blue,
          brightness: Brightness.light,
        ),
        useMaterial3: true,
      ),
      darkTheme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.blue,
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
      ),
      home: const BrowserScreen(),
      routes: {
        '/settings': (context) => const SettingsScreen(),
        '/history': (context) => const HistoryScreen(),
      },
    );
  }
}

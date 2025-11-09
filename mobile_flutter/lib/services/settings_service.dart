import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Settings Service - Manages app settings
class SettingsService with ChangeNotifier {
  late SharedPreferences _prefs;
  
  bool _isEnabled = true;
  bool _strictMode = false;
  List<String> _customKeywords = [];
  List<String> _blockedDomains = [];

  // Getters
  bool get isEnabled => _isEnabled;
  bool get strictMode => _strictMode;
  List<String> get customKeywords => List.unmodifiable(_customKeywords);
  List<String> get blockedDomains => List.unmodifiable(_blockedDomains);

  /// Initialize service
  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
    await _loadSettings();
  }

  /// Load settings from storage
  Future<void> _loadSettings() async {
    _isEnabled = _prefs.getBool('isEnabled') ?? true;
    _strictMode = _prefs.getBool('strictMode') ?? false;
    _customKeywords = _prefs.getStringList('customKeywords') ?? [];
    _blockedDomains = _prefs.getStringList('blockedDomains') ?? [];
    notifyListeners();
  }

  /// Toggle monitoring enabled/disabled
  Future<void> setEnabled(bool value) async {
    _isEnabled = value;
    await _prefs.setBool('isEnabled', value);
    notifyListeners();
  }

  /// Toggle strict mode
  Future<void> setStrictMode(bool value) async {
    _strictMode = value;
    await _prefs.setBool('strictMode', value);
    notifyListeners();
  }

  /// Update custom keywords
  Future<void> setCustomKeywords(List<String> keywords) async {
    _customKeywords = keywords.where((k) => k.trim().isNotEmpty).toList();
    await _prefs.setStringList('customKeywords', _customKeywords);
    notifyListeners();
  }

  /// Update blocked domains
  Future<void> setBlockedDomains(List<String> domains) async {
    _blockedDomains = domains.where((d) => d.trim().isNotEmpty).toList();
    await _prefs.setStringList('blockedDomains', _blockedDomains);
    notifyListeners();
  }

  /// Reset to defaults
  Future<void> resetToDefaults() async {
    _isEnabled = true;
    _strictMode = false;
    _customKeywords = [];
    _blockedDomains = [];
    
    await _prefs.clear();
    await _prefs.setBool('isEnabled', true);
    
    notifyListeners();
  }
}

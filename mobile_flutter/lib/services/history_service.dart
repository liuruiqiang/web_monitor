import 'package:flutter/foundation.dart';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/warning_record.dart';

/// History Service - Manages warning history
class HistoryService with ChangeNotifier {
  Database? _database;
  List<WarningRecord> _history = [];

  List<WarningRecord> get history => List.unmodifiable(_history);
  int get count => _history.length;

  /// Initialize service
  Future<void> init() async {
    await _initDatabase();
    await loadHistory();
  }

  /// Initialize database
  Future<void> _initDatabase() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, 'content_security.db');

    _database = await openDatabase(
      path,
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE warnings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT NOT NULL,
            reason TEXT NOT NULL,
            detectionType TEXT NOT NULL,
            keyword TEXT,
            content TEXT,
            timestamp TEXT NOT NULL
          )
        ''');
      },
    );
  }

  /// Load history from database
  Future<void> loadHistory() async {
    if (_database == null) return;

    final List<Map<String, dynamic>> maps = await _database!.query(
      'warnings',
      orderBy: 'timestamp DESC',
      limit: 100,
    );

    _history = maps.map((map) => WarningRecord.fromMap(map)).toList();
    notifyListeners();
  }

  /// Add warning to history
  Future<void> addWarning(WarningRecord warning) async {
    if (_database == null) return;

    await _database!.insert('warnings', warning.toMap());
    await loadHistory();
  }

  /// Clear all history
  Future<void> clearHistory() async {
    if (_database == null) return;

    await _database!.delete('warnings');
    _history = [];
    notifyListeners();
  }

  /// Delete single record
  Future<void> deleteRecord(int id) async {
    if (_database == null) return;

    await _database!.delete('warnings', where: 'id = ?', whereArgs: [id]);
    await loadHistory();
  }

  @override
  void dispose() {
    _database?.close();
    super.dispose();
  }
}

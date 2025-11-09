/// Warning Record Model
class WarningRecord {
  final int? id;
  final String url;
  final String reason;
  final String detectionType;
  final String? keyword;
  final String? content;
  final DateTime timestamp;

  WarningRecord({
    this.id,
    required this.url,
    required this.reason,
    required this.detectionType,
    this.keyword,
    this.content,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'url': url,
      'reason': reason,
      'detectionType': detectionType,
      'keyword': keyword,
      'content': content,
      'timestamp': timestamp.toIso8601String(),
    };
  }

  factory WarningRecord.fromMap(Map<String, dynamic> map) {
    return WarningRecord(
      id: map['id'] as int?,
      url: map['url'] as String,
      reason: map['reason'] as String,
      detectionType: map['detectionType'] as String,
      keyword: map['keyword'] as String?,
      content: map['content'] as String?,
      timestamp: DateTime.parse(map['timestamp'] as String),
    );
  }

  String get formattedTime {
    return '${timestamp.month.toString().padLeft(2, '0')}/'
        '${timestamp.day.toString().padLeft(2, '0')} '
        '${timestamp.hour.toString().padLeft(2, '0')}:'
        '${timestamp.minute.toString().padLeft(2, '0')}';
  }
}

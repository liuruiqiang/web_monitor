# PC Browser Extension Data Integration

This document explains how to integrate monitoring data from the PC browser extension with the Android app.

## Data Structure

The integration uses a standardized JSON format for data exchange between the PC browser extension and Android app.

### BrowserExtensionData Interface

```typescript
interface BrowserExtensionData {
  userInfo?: Partial<UserInfo>;
  contentAccessRecords?: ContentAccessRecord[];
  statistics?: Partial<StatisticsData>;
  articleNotifications?: ArticleNotification[];
  timestamp: string;
  version: string;
}
```

### Data Types

1. **UserInfo**: User profile information
   - gender: string
   - age: string
   - education: string
   - occupation: string
   - browsingFrequency: string

2. **ContentAccessRecord**: Individual browsing records
   - id: string (unique identifier)
   - url: string (visited URL)
   - timestamp: string (ISO format)
   - contentType: 'inappropriate' | 'safe' | 'blocked' | 'warning_bypassed'
   - keywordsDetected?: string[] (optional)

3. **StatisticsData**: Aggregated statistics
   - totalBlocked: number
   - totalWarnings: number
   - totalBypassed: number
   - totalSafe: number
   - dailyAccess: Record<string, number> (date as key, count as value)
   - hourlyDistribution: Record<number, number> (hour 0-23 as key)
   - contentTypeDistribution: Record<string, number>
   - dailyDomainAccess: Record<string, Record<string, number>> (date, domain:count)
   - weeklyAccessPattern: Record<string, number> (day of week 0-6 as key)

4. **ArticleNotification**: Educational content
   - id: string
   - title: string
   - content: string
   - category: 'anti_addiction' | 'cybersecurity' | 'parental_control'
   - timestamp: string
   - read: boolean

## Integration Process

### 1. Export from PC Browser Extension

The PC browser extension should export data in the standardized format:

```json
{
  "userInfo": {
    "gender": "male",
    "age": "25-34",
    "education": "Bachelor's Degree",
    "occupation": "Engineer",
    "browsingFrequency": "daily"
  },
  "contentAccessRecords": [
    {
      "id": "record1",
      "url": "https://example.com",
      "timestamp": "2023-01-01T10:00:00Z",
      "contentType": "safe"
    }
  ],
  "statistics": {
    "totalBlocked": 10,
    "totalSafe": 150,
    "dailyAccess": {
      "2023-01-01": 25,
      "2023-01-02": 30
    },
    "dailyDomainAccess": {
      "2023-01-01": {
        "example.com": 5,
        "test.com": 20
      }
    }
  },
  "timestamp": "2023-01-02T15:30:00Z",
  "version": "1.0.0"
}
```

### 2. Import into Android App

Use the Settings modal in the Android app:
1. Open Settings
2. Select "Import from PC Browser"
3. Choose the exported JSON file
4. Data will be merged with existing records

## Merging Strategy

When importing data, the system uses intelligent merging:

1. **User Info**: Fields from imported data override missing fields in existing data
2. **Content Records**: New records are added, duplicates are skipped
3. **Statistics**: Numerical values are combined (added together)
4. **Articles**: New articles are added, existing ones are preserved

## Implementation Details

The integration is handled by `DataImportService.ts`:

- **importBrowserExtensionData()**: Processes and merges imported data
- **exportAndroidData()**: Exports Android app data for PC use
- **validateBrowserExtensionData()**: Validates data format

## Data Storage

All data is stored using AsyncStorage with these keys:
- `user_info`: User profile information
- `content_access_records`: Detailed content access records
- `statistics_data`: Aggregated statistics
- `article_notifications`: Educational content
- `frequency_settings`: Frequency monitoring thresholds

## Frequency Monitoring Integration

Domain access frequency from PC data is merged with mobile data:
- Daily domain access counts are combined
- Weekly patterns are aggregated
- Overall statistics are updated

This provides a unified view of browsing habits across devices.
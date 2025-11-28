# Content Security Monitor: Cross-Platform Integration Guide

This guide explains how to integrate the Android app with the PC browser extension for unified content monitoring.

## Overview

The system now supports cross-platform data synchronization between:
- PC Browser Extension (Chrome/Firefox)
- Android Mobile App

Users can share their browsing history, statistics, and content filtering data between devices.

## Data Integration Features

### 1. Cross-Device Data Synchronization
- Import browsing history from PC browser extension
- Export mobile browsing data for PC use
- Unified statistics dashboard showing combined data
- Merged content access patterns across devices

### 2. Data Types Supported
- User profile information
- Content access records (safe/blocked sites)
- Browsing statistics and patterns
- Domain access frequency tracking
- Educational article notifications

### 3. Merging Strategy
When importing data:
- **User Info**: Imported fields override missing mobile fields
- **Content Records**: New records added, duplicates skipped
- **Statistics**: Numerical values combined (summed)
- **Articles**: New articles added to existing collection

## Implementation Architecture

### Core Components

1. **DataImportService.ts**
   - Handles cross-platform data import/export
   - Manages data validation and merging
   - Provides standardized data format conversion

2. **StorageService.ts**
   - Enhanced with cross-device data storage
   - Unified AsyncStorage key management
   - Domain-based access frequency tracking

3. **SettingsModal.tsx**
   - UI for import/export functionality
   - File selection using DocumentPicker
   - User feedback and progress indicators

### Data Flow

```
PC Browser Extension → Export JSON → File Transfer → Android App Import → Data Merging → Unified Dashboard
```

## How to Use

### Export from PC Browser Extension
1. In browser extension, go to Settings/Export
2. Select "Export for Mobile App"
3. Save the JSON file to your computer
4. Transfer file to your mobile device (email, cloud storage, USB)

### Import to Android App
1. Open Content Security Monitor app
2. Go to Settings → Data Management
3. Tap "Import from PC Browser"
4. Select the exported JSON file
5. Confirm import to merge data

### View Combined Statistics
1. Open app main screen
2. Tap "📊 Statistics" quick access button
3. View combined browsing patterns from both devices
4. See domain access frequency across all platforms

## Technical Implementation

### Data Structure
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

### Storage Keys
- `user_info`: User profile data
- `content_access_records`: Detailed browsing records
- `statistics_data`: Aggregated statistics with cross-device data
- `article_notifications`: Educational content
- `frequency_settings`: Access frequency thresholds

### Merging Logic
- Daily access counts: Combined by date
- Domain frequencies: Merged across devices
- Content types: Aggregated statistics
- User preferences: Smart merge with imported taking priority

## Security Considerations

### Data Privacy
- All data remains on user's device
- No cloud synchronization required
- File-based transfer gives user control
- JSON format is human-readable and auditable

### Data Validation
- Schema validation before import
- Type checking for all data fields
- Error handling for malformed files
- Duplicate detection and prevention

## Future Enhancements

### Planned Features
1. Automatic cloud sync (optional, user-controlled)
2. Real-time cross-device notifications
3. Unified blocking rules across platforms
4. Device-specific reporting and analytics

### Integration Points
- Browser extension API for direct data exchange
- QR code based data transfer
- Encrypted data sharing for privacy

## Troubleshooting

### Common Issues
1. **Import fails**: Check JSON file format matches specification
2. **Data not merging**: Ensure timestamps are in correct format
3. **Statistics not updating**: Restart app after import
4. **File selection not working**: Check file permissions

### Support Information
For integration issues:
- Verify browser extension export format
- Check Android app version compatibility
- Review PC_BROWSER_INTEGRATION.md for detailed specifications
- Contact support with exported data samples

## Conclusion

The cross-platform integration provides users with a comprehensive view of their browsing habits across all devices, enabling better content filtering decisions and more effective digital wellness management.
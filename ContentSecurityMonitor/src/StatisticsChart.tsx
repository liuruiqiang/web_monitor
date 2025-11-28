/**
 * StatisticsChart.tsx
 * Statistics visualization component for the Content Security Monitor app
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import colors from './colors';

interface StatisticsChartProps {
  statistics: {
    totalBlocked: number;
    totalWarnings: number;
    totalBypassed: number;
    dailyAccess: Record<string, number>;
    hourlyDistribution: Record<number, number>;
    contentTypeDistribution: Record<string, number>;
    dailyDomainAccess: Record<string, Record<string, number>>;
    weeklyAccessPattern: Record<string, number>;
  };
}

const StatisticsChart: React.FC<StatisticsChartProps> = ({ statistics }) => {
  // Generate bar chart data for hourly distribution
  const generateHourlyBars = () => {
    const bars = [];
    const maxCount = Math.max(...Object.values(statistics.hourlyDistribution), 1);
    
    for (let hour = 0; hour < 24; hour++) {
      const count = statistics.hourlyDistribution[hour] || 0;
      const height = (count / maxCount) * 100;
      
      bars.push(
        <View key={hour} style={styles.hourlyBarContainer}>
          <View style={[styles.hourlyBar, { height: `${height}%` }]} />
          <Text style={styles.hourlyLabel}>{hour}</Text>
          <Text style={styles.hourlyCount}>{count}</Text>
        </View>
      );
    }
    
    return bars;
  };

  // Generate daily trend data
  const generateDailyTrend = () => {
    const dates = Object.keys(statistics.dailyAccess).sort();
    if (dates.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No data available yet</Text>
        </View>
      );
    }
    
    const maxCount = Math.max(...Object.values(statistics.dailyAccess), 1);
    const trendItems = dates.map(date => {
      const count = statistics.dailyAccess[date];
      const height = (count / maxCount) * 100;
      
      return (
        <View key={date} style={styles.trendItem}>
          <View style={[styles.trendBar, { height: `${height}%` }]} />
          <Text style={styles.trendDate}>{date.split('-')[1]}/{date.split('-')[2]}</Text>
          <Text style={styles.trendCount}>{count}</Text>
        </View>
      );
    });
    
    return <View style={styles.trendContainer}>{trendItems}</View>;
  };

  // Generate weekly access pattern chart
  const generateWeeklyChart = () => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const bars = [];
    const maxCount = Math.max(...Object.values(statistics.weeklyAccessPattern), 1);
    
    for (let day = 0; day < 7; day++) {
      const count = statistics.weeklyAccessPattern[day.toString()] || 0;
      const height = (count / maxCount) * 100;
      
      bars.push(
        <View key={day} style={styles.hourlyBarContainer}>
          <View style={[styles.hourlyBar, { height: `${height}%`, backgroundColor: colors.secondary }]} />
          <Text style={styles.hourlyLabel}>{dayNames[day]}</Text>
          <Text style={styles.hourlyCount}>{count}</Text>
        </View>
      );
    }
    
    return bars;
  };

  // Generate domain access frequency data
  const generateDomainFrequency = () => {
    const today = new Date().toISOString().split('T')[0];
    const domainAccess = statistics.dailyDomainAccess[today] || {};
    
    if (Object.keys(domainAccess).length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No domain access data available for today</Text>
        </View>
      );
    }
    
    // Sort domains by access count
    const sortedDomains = Object.entries(domainAccess)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10); // Show top 10 domains
    
    return (
      <View style={styles.domainList}>
        {sortedDomains.map(([domain, count]) => (
          <View key={domain} style={styles.domainItem}>
            <Text style={styles.domainName} numberOfLines={1}>{domain}</Text>
            <Text style={styles.domainCount}>{count}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Summary Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Content Security Summary</Text>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{statistics.totalBlocked}</Text>
            <Text style={styles.summaryLabel}>Blocked Sites</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{statistics.totalBypassed}</Text>
            <Text style={styles.summaryLabel}>Warnings Bypassed</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{statistics.totalSafe || 0}</Text>
            <Text style={styles.summaryLabel}>Safe Sites</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{statistics.totalWarnings || 0}</Text>
            <Text style={styles.summaryLabel}>Frequency Warnings</Text>
          </View>
        </View>
      </View>

      {/* Daily Trend */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily Activity Trend</Text>
        <View style={styles.chartContainer}>
          {generateDailyTrend()}
        </View>
      </View>

      {/* Domain Access Frequency */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Domain Access Frequency</Text>
        <View style={styles.chartContainer}>
          {generateDomainFrequency()}
        </View>
      </View>

      {/* Weekly Access Pattern */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly Access Pattern</Text>
        <View style={styles.chartContainer}>
          <View style={styles.hourlyChart}>
            {generateWeeklyChart()}
          </View>
        </View>
      </View>

      {/* Hourly Distribution */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hourly Access Distribution</Text>
        <View style={styles.chartContainer}>
          <View style={styles.hourlyChart}>
            {generateHourlyBars()}
          </View>
        </View>
      </View>

      {/* Content Type Distribution */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Content Type Distribution</Text>
        <View style={styles.distributionContainer}>
          {Object.entries(statistics.contentTypeDistribution).map(([type, count]) => (
            <View key={type} style={styles.distributionItem}>
              <Text style={styles.distributionLabel}>
                {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
              <Text style={styles.distributionCount}>{count}</Text>
            </View>
          ))}
          {Object.keys(statistics.contentTypeDistribution).length === 0 && (
            <Text style={styles.emptyText}>No content type data available</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    margin: 20,
    backgroundColor: colors.surface,
    borderRadius: 15,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 15,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  summaryItem: {
    alignItems: 'center',
    margin: 10,
  },
  summaryNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 5,
    textAlign: 'center',
  },
  chartContainer: {
    height: 200,
    justifyContent: 'flex-end',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  trendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
  },
  trendItem: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 2,
  },
  trendBar: {
    width: '80%',
    backgroundColor: colors.primary,
    borderRadius: 4,
    minWidth: 10,
  },
  trendDate: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 5,
  },
  trendCount: {
    fontSize: 10,
    color: colors.textPrimary,
    marginTop: 3,
    fontWeight: 'bold',
  },
  hourlyChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
  },
  hourlyBarContainer: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 1,
  },
  hourlyBar: {
    width: '80%',
    backgroundColor: colors.accent,
    borderRadius: 2,
    minWidth: 4,
  },
  hourlyLabel: {
    fontSize: 8,
    color: colors.textSecondary,
    marginTop: 3,
  },
  hourlyCount: {
    fontSize: 8,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  distributionContainer: {
    padding: 10,
  },
  distributionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray300,
  },
  distributionLabel: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  distributionCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: 20,
  },
  domainList: {
    flex: 1,
  },
  domainItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray300,
  },
  domainName: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
    marginRight: 10,
  },
  domainCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    minWidth: 20,
    textAlign: 'right',
  },
});

export default StatisticsChart;
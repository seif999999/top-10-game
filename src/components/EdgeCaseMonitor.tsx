import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../utils/constants';
import { EdgeCaseHandler } from '../services/edgeCaseHandler';

interface EdgeCaseMonitorProps {
  roomCode?: string;
  isVisible?: boolean;
  onClose?: () => void;
}

interface EdgeCaseStats {
  totalErrors: number;
  connectionIssues: number;
  dataCorruption: number;
  securityViolations: number;
  performanceIssues: number;
  lastError?: string;
  lastErrorTime?: number;
}

const EdgeCaseMonitor: React.FC<EdgeCaseMonitorProps> = ({
  roomCode,
  isVisible = false,
  onClose
}) => {
  const [stats, setStats] = useState<EdgeCaseStats>({
    totalErrors: 0,
    connectionIssues: 0,
    dataCorruption: 0,
    securityViolations: 0,
    performanceIssues: 0
  });
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (isVisible && isMonitoring) {
      startMonitoring();
    }
    return () => {
      stopMonitoring();
    };
  }, [isVisible, isMonitoring]);

  const startMonitoring = () => {
    // Start monitoring edge cases
    console.log('🔍 Starting edge case monitoring...');
    
    // Simulate monitoring (in real app, this would connect to actual monitoring)
    const interval = setInterval(() => {
      updateStats();
    }, 5000);

    return () => clearInterval(interval);
  };

  const stopMonitoring = () => {
    console.log('🛑 Stopping edge case monitoring...');
  };

  const updateStats = () => {
    // Simulate stats update (in real app, this would come from actual monitoring)
    setStats(prev => ({
      ...prev,
      totalErrors: prev.totalErrors + Math.floor(Math.random() * 3),
      connectionIssues: prev.connectionIssues + Math.floor(Math.random() * 2),
      dataCorruption: prev.dataCorruption + Math.floor(Math.random() * 1),
      securityViolations: prev.securityViolations + Math.floor(Math.random() * 1),
      performanceIssues: prev.performanceIssues + Math.floor(Math.random() * 2),
      lastError: 'Connection timeout detected',
      lastErrorTime: Date.now()
    }));

    // Add to logs
    setLogs(prev => [
      ...prev.slice(-9), // Keep last 10 logs
      `${new Date().toLocaleTimeString()}: Edge case detected`
    ]);
  };

  const handleTestEdgeCase = async (edgeCase: string) => {
    try {
      const edgeCaseHandler = EdgeCaseHandler.getInstance();
      
      switch (edgeCase) {
        case 'host_disconnect':
          await edgeCaseHandler.handleHostDisconnection(roomCode || 'TEST', 'test_host');
          addLog('Host disconnection test executed');
          break;
        case 'player_disconnect':
          await edgeCaseHandler.handlePlayerDisconnection(roomCode || 'TEST', 'test_player');
          addLog('Player disconnection test executed');
          break;
        case 'firebase_outage':
          await edgeCaseHandler.handleFirebaseOutage();
          addLog('Firebase outage test executed');
          break;
        case 'data_corruption':
          await edgeCaseHandler.handleRoomDataCorruption(roomCode || 'TEST');
          addLog('Data corruption repair test executed');
          break;
        case 'malicious_player':
          await edgeCaseHandler.handleMaliciousPlayer(roomCode || 'TEST', 'test_malicious', 'spam');
          addLog('Malicious player detection test executed');
          break;
        default:
          addLog(`Unknown edge case: ${edgeCase}`);
      }
    } catch (error) {
      addLog(`Error testing ${edgeCase}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const addLog = (message: string) => {
    setLogs(prev => [
      ...prev.slice(-9),
      `${new Date().toLocaleTimeString()}: ${message}`
    ]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const resetStats = () => {
    setStats({
      totalErrors: 0,
      connectionIssues: 0,
      dataCorruption: 0,
      securityViolations: 0,
      performanceIssues: 0
    });
  };

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Edge Case Monitor</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Monitoring Toggle */}
        <View style={styles.section}>
          <View style={styles.toggleContainer}>
            <Text style={styles.sectionTitle}>Monitoring</Text>
            <Switch
              value={isMonitoring}
              onValueChange={setIsMonitoring}
              trackColor={{ false: COLORS.muted, true: COLORS.primary }}
              thumbColor={isMonitoring ? COLORS.white : COLORS.muted}
            />
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalErrors}</Text>
              <Text style={styles.statLabel}>Total Errors</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.connectionIssues}</Text>
              <Text style={styles.statLabel}>Connection Issues</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.dataCorruption}</Text>
              <Text style={styles.statLabel}>Data Corruption</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.securityViolations}</Text>
              <Text style={styles.statLabel}>Security Violations</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.performanceIssues}</Text>
              <Text style={styles.statLabel}>Performance Issues</Text>
            </View>
          </View>
          
          <TouchableOpacity onPress={resetStats} style={styles.resetButton}>
            <Text style={styles.resetButtonText}>Reset Stats</Text>
          </TouchableOpacity>
        </View>

        {/* Test Edge Cases */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Edge Cases</Text>
          <View style={styles.testButtons}>
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => handleTestEdgeCase('host_disconnect')}
            >
              <Text style={styles.testButtonText}>Host Disconnect</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => handleTestEdgeCase('player_disconnect')}
            >
              <Text style={styles.testButtonText}>Player Disconnect</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => handleTestEdgeCase('firebase_outage')}
            >
              <Text style={styles.testButtonText}>Firebase Outage</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => handleTestEdgeCase('data_corruption')}
            >
              <Text style={styles.testButtonText}>Data Corruption</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => handleTestEdgeCase('malicious_player')}
            >
              <Text style={styles.testButtonText}>Malicious Player</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logs */}
        <View style={styles.section}>
          <View style={styles.logsHeader}>
            <Text style={styles.sectionTitle}>Activity Logs</Text>
            <TouchableOpacity onPress={clearLogs} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.logsContainer}>
            {logs.length === 0 ? (
              <Text style={styles.noLogsText}>No activity logs yet</Text>
            ) : (
              logs.map((log, index) => (
                <Text key={index} style={styles.logText}>{log}</Text>
              ))
            )}
          </View>
        </View>

        {/* Last Error */}
        {stats.lastError && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Last Error</Text>
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{stats.lastError}</Text>
              <Text style={styles.errorTime}>
                {stats.lastErrorTime ? new Date(stats.lastErrorTime).toLocaleString() : 'Unknown'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.background,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: COLORS.text,
  },
  closeButton: {
    padding: SPACING.sm,
  },
  closeButtonText: {
    fontSize: 18,
    color: COLORS.muted,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  statItem: {
    width: '30%',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'center',
  },
  resetButton: {
    backgroundColor: COLORS.error,
    padding: SPACING.sm,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: SPACING.md,
  },
  resetButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  testButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  testButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.sm,
    borderRadius: 6,
    minWidth: 120,
  },
  testButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: COLORS.muted,
    padding: SPACING.xs,
    borderRadius: 4,
  },
  clearButtonText: {
    color: COLORS.white,
    fontSize: 12,
  },
  logsContainer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 8,
    maxHeight: 200,
  },
  noLogsText: {
    color: COLORS.muted,
    fontStyle: 'italic' as const,
  },
  logText: {
    color: COLORS.text,
    fontSize: 12,
    marginBottom: SPACING.xs,
  },
  errorContainer: {
    backgroundColor: COLORS.error + '20',
    padding: SPACING.md,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  errorTime: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: SPACING.xs,
  },
});

export default EdgeCaseMonitor;

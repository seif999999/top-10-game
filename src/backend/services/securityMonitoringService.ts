import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { logger } from '../utils/logger';
import { COLLECTIONS } from '../utils/constants';

export interface SecurityEvent {
  id?: string;
  userId?: string;
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  description: string;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    roomCode?: string;
    action?: string;
    error?: string;
    [key: string]: any;
  };
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export type SecurityEventType = 
  | 'AUTHENTICATION_FAILURE'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SUSPICIOUS_ACTIVITY'
  | 'CONTENT_MODERATION_FLAG'
  | 'INPUT_VALIDATION_FAILURE'
  | 'GAME_CHEAT_ATTEMPT'
  | 'DATA_BREACH_ATTEMPT'
  | 'UNAUTHORIZED_ACCESS'
  | 'SYSTEM_ERROR'
  | 'SECURITY_POLICY_VIOLATION';

export type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SecurityAlert {
  id: string;
  eventId: string;
  alertType: string;
  message: string;
  severity: SecuritySeverity;
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

export interface SecurityStats {
  totalEvents: number;
  eventsByType: { [key in SecurityEventType]: number };
  eventsBySeverity: { [key in SecuritySeverity]: number };
  recentEvents: SecurityEvent[];
  topOffenders: { userId: string; eventCount: number }[];
  systemHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}

class SecurityMonitoringService {
  private static readonly EVENTS_COLLECTION = COLLECTIONS.SECURITY_EVENTS;
  private static readonly ALERTS_COLLECTION = 'securityAlerts';
  private static readonly MAX_EVENTS_PER_QUERY = 100;

  /**
   * Log a security event
   */
  static async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>): Promise<string> {
    try {
      const eventData: Omit<SecurityEvent, 'id'> = {
        ...event,
        timestamp: new Date(),
        resolved: false,
      };

      const docRef = await addDoc(collection(db, this.EVENTS_COLLECTION), {
        ...eventData,
        timestamp: serverTimestamp(),
      });

      logger.log(`Security event logged: ${event.eventType} - ${event.description}`);

      // Check if this event should trigger an alert
      await this.checkForAlerts(eventData);

      return docRef.id;
    } catch (error) {
      logger.error('Error logging security event:', error);
      throw new Error('Failed to log security event');
    }
  }

  /**
   * Get recent security events
   */
  static async getRecentEvents(
    limitCount: number = 50,
    eventType?: SecurityEventType,
    severity?: SecuritySeverity
  ): Promise<SecurityEvent[]> {
    try {
      let q = query(
        collection(db, this.EVENTS_COLLECTION),
        orderBy('timestamp', 'desc'),
        limit(Math.min(limitCount, this.MAX_EVENTS_PER_QUERY))
      );

      if (eventType) {
        q = query(q, where('eventType', '==', eventType));
      }

      if (severity) {
        q = query(q, where('severity', '==', severity));
      }

      const snapshot = await getDocs(q);
      const events: SecurityEvent[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        events.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
          resolvedAt: data.resolvedAt?.toDate(),
        } as SecurityEvent);
      });

      return events;
    } catch (error) {
      logger.error('Error getting recent events:', error);
      return [];
    }
  }

  /**
   * Get security statistics
   */
  static async getSecurityStats(): Promise<SecurityStats> {
    try {
      const events = await this.getRecentEvents(1000);
      
      const stats: SecurityStats = {
        totalEvents: events.length,
        eventsByType: {} as { [key in SecurityEventType]: number },
        eventsBySeverity: {} as { [key in SecuritySeverity]: number },
        recentEvents: events.slice(0, 10),
        topOffenders: [],
        systemHealth: 'HEALTHY',
      };

      // Count events by type
      events.forEach(event => {
        stats.eventsByType[event.eventType] = (stats.eventsByType[event.eventType] || 0) + 1;
        stats.eventsBySeverity[event.severity] = (stats.eventsBySeverity[event.severity] || 0) + 1;
      });

      // Calculate top offenders
      const userEventCounts: { [userId: string]: number } = {};
      events.forEach(event => {
        if (event.userId) {
          userEventCounts[event.userId] = (userEventCounts[event.userId] || 0) + 1;
        }
      });

      stats.topOffenders = Object.entries(userEventCounts)
        .map(([userId, count]) => ({ userId, eventCount: count }))
        .sort((a, b) => b.eventCount - a.eventCount)
        .slice(0, 10);

      // Determine system health
      const criticalEvents = events.filter(e => e.severity === 'CRITICAL' && !e.resolved);
      const highEvents = events.filter(e => e.severity === 'HIGH' && !e.resolved);

      if (criticalEvents.length > 0) {
        stats.systemHealth = 'CRITICAL';
      } else if (highEvents.length > 5) {
        stats.systemHealth = 'WARNING';
      }

      return stats;
    } catch (error) {
      logger.error('Error getting security stats:', error);
      return {
        totalEvents: 0,
        eventsByType: {} as { [key in SecurityEventType]: number },
        eventsBySeverity: {} as { [key in SecuritySeverity]: number },
        recentEvents: [],
        topOffenders: [],
        systemHealth: 'CRITICAL',
      };
    }
  }

  /**
   * Create a security alert
   */
  static async createAlert(
    eventId: string,
    alertType: string,
    message: string,
    severity: SecuritySeverity
  ): Promise<string> {
    try {
      const alert: Omit<SecurityAlert, 'id'> = {
        eventId,
        alertType,
        message,
        severity,
        createdAt: new Date(),
        acknowledged: false,
      };

      const docRef = await addDoc(collection(db, this.ALERTS_COLLECTION), {
        ...alert,
        createdAt: serverTimestamp(),
      });

      logger.log(`Security alert created: ${alertType} - ${message}`);
      return docRef.id;
    } catch (error) {
      logger.error('Error creating security alert:', error);
      throw new Error('Failed to create security alert');
    }
  }

  /**
   * Acknowledge a security alert
   */
  static async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    try {
      // This would update the alert in Firestore
      logger.log(`Security alert acknowledged: ${alertId} by ${acknowledgedBy}`);
    } catch (error) {
      logger.error('Error acknowledging alert:', error);
      throw new Error('Failed to acknowledge alert');
    }
  }

  /**
   * Check if an event should trigger an alert
   */
  private static async checkForAlerts(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>): Promise<void> {
    // Critical events always trigger alerts
    if (event.severity === 'CRITICAL') {
      await this.createAlert(
        'pending',
        'CRITICAL_EVENT',
        `Critical security event: ${event.eventType}`,
        'CRITICAL'
      );
    }

    // Multiple failed authentication attempts
    if (event.eventType === 'AUTHENTICATION_FAILURE' && event.userId) {
      const recentAuthFailures = await this.getRecentEvents(10, 'AUTHENTICATION_FAILURE');
      const userFailures = recentAuthFailures.filter(e => e.userId === event.userId);
      
      if (userFailures.length >= 5) {
        await this.createAlert(
          'pending',
          'BRUTE_FORCE_ATTEMPT',
          `Multiple failed authentication attempts from user: ${event.userId}`,
          'HIGH'
        );
      }
    }

    // Rate limit exceeded multiple times
    if (event.eventType === 'RATE_LIMIT_EXCEEDED' && event.userId) {
      const recentRateLimits = await this.getRecentEvents(10, 'RATE_LIMIT_EXCEEDED');
      const userRateLimits = recentRateLimits.filter(e => e.userId === event.userId);
      
      if (userRateLimits.length >= 3) {
        await this.createAlert(
          'pending',
          'ABUSIVE_BEHAVIOR',
          `User ${event.userId} has exceeded rate limits multiple times`,
          'MEDIUM'
        );
      }
    }

    // Suspicious activity patterns
    if (event.eventType === 'SUSPICIOUS_ACTIVITY') {
      await this.createAlert(
        'pending',
        'SUSPICIOUS_ACTIVITY',
        `Suspicious activity detected: ${event.description}`,
        'HIGH'
      );
    }

    // Content moderation flags
    if (event.eventType === 'CONTENT_MODERATION_FLAG') {
      await this.createAlert(
        'pending',
        'CONTENT_MODERATION',
        `Content moderation flag: ${event.description}`,
        'MEDIUM'
      );
    }
  }

  /**
   * Get events for a specific user
   */
  static async getUserEvents(userId: string, limitCount: number = 50): Promise<SecurityEvent[]> {
    try {
      const q = query(
        collection(db, this.EVENTS_COLLECTION),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(Math.min(limitCount, this.MAX_EVENTS_PER_QUERY))
      );

      const snapshot = await getDocs(q);
      const events: SecurityEvent[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        events.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
          resolvedAt: data.resolvedAt?.toDate(),
        } as SecurityEvent);
      });

      return events;
    } catch (error) {
      logger.error('Error getting user events:', error);
      return [];
    }
  }

  /**
   * Resolve a security event
   */
  static async resolveEvent(eventId: string, resolvedBy: string): Promise<void> {
    try {
      // This would update the event in Firestore
      logger.log(`Security event resolved: ${eventId} by ${resolvedBy}`);
    } catch (error) {
      logger.error('Error resolving event:', error);
      throw new Error('Failed to resolve event');
    }
  }

  /**
   * Get security dashboard data
   */
  static async getDashboardData(): Promise<{
    stats: SecurityStats;
    recentEvents: SecurityEvent[];
    activeAlerts: SecurityAlert[];
  }> {
    try {
      const [stats, recentEvents, activeAlerts] = await Promise.all([
        this.getSecurityStats(),
        this.getRecentEvents(20),
        this.getActiveAlerts(),
      ]);

      return {
        stats,
        recentEvents,
        activeAlerts,
      };
    } catch (error) {
      logger.error('Error getting dashboard data:', error);
      throw new Error('Failed to get dashboard data');
    }
  }

  /**
   * Get active security alerts
   */
  private static async getActiveAlerts(): Promise<SecurityAlert[]> {
    try {
      const q = query(
        collection(db, this.ALERTS_COLLECTION),
        where('acknowledged', '==', false),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      const snapshot = await getDocs(q);
      const alerts: SecurityAlert[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        alerts.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          acknowledgedAt: data.acknowledgedAt?.toDate(),
        } as SecurityAlert);
      });

      return alerts;
    } catch (error) {
      logger.error('Error getting active alerts:', error);
      return [];
    }
  }

  /**
   * Clean up old security events
   */
  static async cleanupOldEvents(retentionDays: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // This would delete old events in production
      logger.log(`Cleaning up security events older than ${retentionDays} days`);
      return 0;
    } catch (error) {
      logger.error('Error cleaning up old events:', error);
      return 0;
    }
  }
}

export default SecurityMonitoringService;

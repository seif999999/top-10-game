/**
 * Moderation Logging and Reporting Service
 * Handles logging, reporting, and analytics for content moderation
 */

import { ModerationLog, ModerationResult } from './contentModerationService';
import { logger } from '../utils/logger';

export interface ModerationReport {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  reportedBy: string;
  reportedUser?: string;
  content: string;
  contentType: ModerationLog['contentType'];
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
  notes?: string[];
  actions?: ModerationAction[];
}

export interface ModerationAction {
  id: string;
  type: 'warning' | 'content_removal' | 'user_suspension' | 'user_ban' | 'content_approval';
  description: string;
  performedBy: string;
  performedAt: Date;
  reason: string;
  duration?: number; // For suspensions/bans in hours
}

export interface ModerationStats {
  totalModerations: number;
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;
  rejectionReasons: { [reason: string]: number };
  contentTypeStats: { [type: string]: number };
  userStats: { [userId: string]: { total: number; rejected: number; approved: number } };
  timeRange: { start: Date; end: Date };
}

export interface ModerationAlert {
  id: string;
  type: 'high_rejection_rate' | 'suspicious_user' | 'content_spike' | 'system_error' | 'high_severity_report';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  data?: unknown;
}

export class ModerationLoggingService {
  private static logs: ModerationLog[] = [];
  private static reports: ModerationReport[] = [];
  private static alerts: ModerationAlert[] = [];

  /**
   * Log a moderation action
   */
  static logModeration(log: ModerationLog): void {
    this.logs.push(log);
    
    // Check for alerts
    this.checkForAlerts(log);
    
    // In production, this would be sent to a logging service
    logger.log('Moderation logged:', {
      id: log.id,
      userId: log.userId,
      contentType: log.contentType,
      approved: log.result.approved,
      reason: log.result.reason,
      timestamp: log.timestamp
    });
  }

  /**
   * Create a moderation report
   */
  static createReport(
    title: string,
    description: string,
    severity: ModerationReport['severity'],
    reportedBy: string,
    content: string,
    contentType: ModerationLog['contentType'],
    reportedUser?: string
  ): ModerationReport {
    const report: ModerationReport = {
      id: this.generateId('report'),
      title,
      description,
      severity,
      status: 'open',
      reportedBy,
      reportedUser,
      content,
      contentType,
      createdAt: new Date(),
      updatedAt: new Date(),
      notes: [],
      actions: []
    };

    this.reports.push(report);
    
    // Create alert for high severity reports
    if (severity === 'high' || severity === 'critical') {
      this.createAlert(
        'high_severity_report',
        'High Severity Moderation Report',
        `A ${severity} severity report has been created: ${title}`,
        severity,
        { reportId: report.id }
      );
    }

    return report;
  }

  /**
   * Add action to a report
   */
  static addActionToReport(
    reportId: string,
    action: Omit<ModerationAction, 'id' | 'performedAt'>
  ): boolean {
    const report = this.reports.find(r => r.id === reportId);
    if (!report) return false;

    const newAction: ModerationAction = {
      id: this.generateId('action'),
      ...action,
      performedAt: new Date()
    };

    report.actions = report.actions || [];
    report.actions.push(newAction);
    report.updatedAt = new Date();

    return true;
  }

  /**
   * Update report status
   */
  static updateReportStatus(
    reportId: string,
    status: ModerationReport['status'],
    updatedBy: string,
    notes?: string
  ): boolean {
    const report = this.reports.find(r => r.id === reportId);
    if (!report) return false;

    report.status = status;
    report.updatedAt = new Date();
    report.assignedTo = updatedBy;

    if (notes) {
      report.notes = report.notes || [];
      report.notes.push(`${new Date().toISOString()}: ${notes} (by ${updatedBy})`);
    }

    return true;
  }

  /**
   * Get moderation statistics
   */
  static getModerationStats(timeRange?: { start: Date; end: Date }): ModerationStats {
    const start = timeRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = timeRange?.end || new Date();

    const filteredLogs = this.logs.filter(log => 
      log.timestamp >= start && log.timestamp <= end
    );

    const totalModerations = filteredLogs.length;
    const approvedCount = filteredLogs.filter(log => log.result.approved).length;
    const rejectedCount = totalModerations - approvedCount;
    const pendingCount = this.reports.filter(r => r.status === 'open').length;

    // Rejection reasons
    const rejectionReasons: { [reason: string]: number } = {};
    filteredLogs
      .filter(log => !log.result.approved && log.result.reason)
      .forEach(log => {
        const reason = log.result.reason!;
        rejectionReasons[reason] = (rejectionReasons[reason] || 0) + 1;
      });

    // Content type stats
    const contentTypeStats: { [type: string]: number } = {};
    filteredLogs.forEach(log => {
      contentTypeStats[log.contentType] = (contentTypeStats[log.contentType] || 0) + 1;
    });

    // User stats
    const userStats: { [userId: string]: { total: number; rejected: number; approved: number } } = {};
    filteredLogs.forEach(log => {
      if (!userStats[log.userId]) {
        userStats[log.userId] = { total: 0, rejected: 0, approved: 0 };
      }
      userStats[log.userId].total++;
      if (log.result.approved) {
        userStats[log.userId].approved++;
      } else {
        userStats[log.userId].rejected++;
      }
    });

    return {
      totalModerations,
      approvedCount,
      rejectedCount,
      pendingCount,
      rejectionReasons,
      contentTypeStats,
      userStats,
      timeRange: { start, end }
    };
  }

  /**
   * Get user moderation history
   */
  static getUserModerationHistory(userId: string): ModerationLog[] {
    return this.logs.filter(log => log.userId === userId);
  }

  /**
   * Get all reports
   */
  static getAllReports(): ModerationReport[] {
    return [...this.reports];
  }

  /**
   * Get reports by status
   */
  static getReportsByStatus(status: ModerationReport['status']): ModerationReport[] {
    return this.reports.filter(report => report.status === status);
  }

  /**
   * Get reports by severity
   */
  static getReportsBySeverity(severity: ModerationReport['severity']): ModerationReport[] {
    return this.reports.filter(report => report.severity === severity);
  }

  /**
   * Create an alert
   */
  static createAlert(
    type: ModerationAlert['type'],
    title: string,
    description: string,
    severity: ModerationAlert['severity'],
    data?: unknown
  ): ModerationAlert {
    const alert: ModerationAlert = {
      id: this.generateId('alert'),
      type,
      title,
      description,
      severity,
      createdAt: new Date(),
      resolved: false,
      data
    };

    this.alerts.push(alert);
    
    // In production, this would send notifications
    logger.warn('Moderation alert created:', alert);

    return alert;
  }

  /**
   * Resolve an alert
   */
  static resolveAlert(alertId: string, resolvedBy: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.resolved = true;
    alert.resolvedAt = new Date();
    alert.resolvedBy = resolvedBy;

    return true;
  }

  /**
   * Get all alerts
   */
  static getAllAlerts(): ModerationAlert[] {
    return [...this.alerts];
  }

  /**
   * Get unresolved alerts
   */
  static getUnresolvedAlerts(): ModerationAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Check for alerts based on moderation log
   */
  private static checkForAlerts(log: ModerationLog): void {
    // Check for high rejection rate
    const userLogs = this.logs.filter(l => l.userId === log.userId);
    const recentLogs = userLogs.filter(l => 
      Date.now() - l.timestamp.getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
    );
    
    if (recentLogs.length >= 10) {
      const rejectionRate = recentLogs.filter(l => !l.result.approved).length / recentLogs.length;
      
      if (rejectionRate > 0.7) {
        this.createAlert(
          'high_rejection_rate',
          'High Rejection Rate Detected',
          `User ${log.userId} has a ${(rejectionRate * 100).toFixed(1)}% rejection rate in the last 24 hours`,
          'high',
          { userId: log.userId, rejectionRate, recentLogs: recentLogs.length }
        );
      }
    }

    // Check for suspicious patterns
    if (log.contentType === 'gameAnswer' && !log.result.approved) {
      const suspiciousPatterns = [
        /(.)\1{5,}/, // Repeated characters
        /(.)\s+\1\s+\1/, // Repeated words
        /(.){30,}/, // Very long words
      ];

      const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(log.content));
      
      if (isSuspicious) {
        this.createAlert(
          'suspicious_user',
          'Suspicious Content Pattern Detected',
          `User ${log.userId} submitted suspicious content: ${log.content.substring(0, 50)}...`,
          'medium',
          { userId: log.userId, content: log.content, pattern: 'suspicious_format' }
        );
      }
    }

    // Check for content spike
    const recentLogsAll = this.logs.filter(l => 
      Date.now() - l.timestamp.getTime() < 60 * 60 * 1000 // Last hour
    );
    
    if (recentLogsAll.length > 100) {
      this.createAlert(
        'content_spike',
        'High Content Volume Detected',
        `${recentLogsAll.length} moderation requests in the last hour`,
        'medium',
        { count: recentLogsAll.length, timeRange: '1 hour' }
      );
    }
  }

  /**
   * Generate unique ID
   */
  private static generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export moderation data for analysis
   */
  static exportModerationData(): {
    logs: ModerationLog[];
    reports: ModerationReport[];
    alerts: ModerationAlert[];
    stats: ModerationStats;
  } {
    return {
      logs: [...this.logs],
      reports: [...this.reports],
      alerts: [...this.alerts],
      stats: this.getModerationStats()
    };
  }

  /**
   * Clean up old data
   */
  static cleanupOldData(daysToKeep: number = 90): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // Clean up old logs
    this.logs = this.logs.filter(log => log.timestamp > cutoffDate);

    // Clean up old alerts (keep resolved ones for shorter time)
    this.alerts = this.alerts.filter(alert => 
      alert.createdAt > cutoffDate || 
      (alert.resolved && alert.resolvedAt && alert.resolvedAt > new Date(cutoffDate.getTime() - 30 * 24 * 60 * 60 * 1000))
    );

    // Keep reports longer as they're more important
    const reportCutoffDate = new Date();
    reportCutoffDate.setDate(reportCutoffDate.getDate() - daysToKeep * 2);
    this.reports = this.reports.filter(report => report.createdAt > reportCutoffDate);
  }

  /**
   * Get moderation dashboard data
   */
  static getDashboardData(): {
    stats: ModerationStats;
    recentLogs: ModerationLog[];
    openReports: ModerationReport[];
    unresolvedAlerts: ModerationAlert[];
  } {
    return {
      stats: this.getModerationStats(),
      recentLogs: this.logs
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 50),
      openReports: this.getReportsByStatus('open'),
      unresolvedAlerts: this.getUnresolvedAlerts()
    };
  }
}

export default ModerationLoggingService;

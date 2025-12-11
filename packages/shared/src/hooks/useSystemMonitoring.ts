/**
 * 系统监控Hook
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  SystemMonitoringService,
  SystemHealth,
  SystemAlert,
  LogEntry,
  PerformanceReport,
  AlertSeverity,
  LogLevel,
} from '../services/systemMonitoring';

interface UseSystemMonitoringOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  alertRefreshInterval?: number;
  onHealthChange?: (health: SystemHealth) => void;
  onAlert?: (alert: SystemAlert) => void;
}

interface UseSystemMonitoringReturn {
  // 系统健康
  systemHealth: SystemHealth | null;
  isLoadingHealth: boolean;
  healthError: string | null;
  lastHealthCheck: string;

  // 系统指标
  systemMetrics: any | null;
  isLoadingMetrics: boolean;
  metricsError: string | null;

  // 警报管理
  alerts: SystemAlert[];
  isLoadingAlerts: boolean;
  alertsError: string | null;
  unreadAlerts: number;
  alertFilters: AlertFilters;

  // 日志监控
  logs: LogEntry[];
  isLoadingLogs: boolean;
  logsError: string | null;
  logSearch: LogSearch;

  // 性能报告
  performanceReport: PerformanceReport | null;
  isLoadingReport: boolean;
  reportError: string | null;

  // 监控配置
  monitoringConfig: any | null;
  isLoadingConfig: boolean;
  configError: string | null;

  // 操作方法
  refreshHealth: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
  refreshAlerts: () => Promise<void>;
  acknowledgeAlert: (alertId: string, note?: string) => Promise<void>;
  searchLogs: (options: any) => Promise<void>;
  generatePerformanceReport: (timeRange: any) => Promise<void>;
  triggerHealthCheck: () => Promise<void>;
  restartComponent: (component: string) => Promise<void>;

  // 过滤和搜索
  setAlertFilters: (filters: Partial<AlertFilters>) => void;
  clearAlertFilters: () => void;
  setLogSearch: (search: Partial<LogSearch>) => void;
  clearLogSearch: () => void;

  // 实时连接
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  isConnected: boolean;
}

interface AlertFilters {
  severity?: AlertSeverity[];
  acknowledged?: boolean;
  resolved?: boolean;
  component?: string;
  timeRange?: {
    start: string;
    end: string;
  };
}

interface LogSearch {
  query: string;
  level?: LogLevel[];
  component?: string;
  timeRange?: {
    start: string;
    end: string;
  };
  context?: Record<string, any>;
}

export const useSystemMonitoring = (options: UseSystemMonitoringOptions = {}): UseSystemMonitoringReturn => {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30秒
    alertRefreshInterval = 10000, // 10秒
    onHealthChange,
    onAlert,
  } = options;

  // 状态管理
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [lastHealthCheck, setLastHealthCheck] = useState<string>('');

  const [systemMetrics, setSystemMetrics] = useState<any | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);
  const [alertsError, setAlertsError] = useState<string | null>(null);
  const [alertFilters, setAlertFiltersState] = useState<AlertFilters>({});

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [logSearch, setLogSearchState] = useState<LogSearch>({ query: '' });

  const [performanceReport, setPerformanceReport] = useState<PerformanceReport | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const [monitoringConfig, setMonitoringConfig] = useState<any | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  // WebSocket连接
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // 计算未读警报数量
  const unreadAlerts = alerts.filter(alert => !alert.acknowledged && !alert.resolvedAt).length;

  // 刷新系统健康状态
  const refreshHealth = useCallback(async () => {
    setIsLoadingHealth(true);
    setHealthError(null);

    try {
      const health = await SystemMonitoringService.getSystemHealth();
      setSystemHealth(health);
      setLastHealthCheck(health.timestamp);
      onHealthChange?.(health);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取系统健康状态失败';
      setHealthError(errorMessage);
    } finally {
      setIsLoadingHealth(false);
    }
  }, [onHealthChange]);

  // 刷新系统指标
  const refreshMetrics = useCallback(async () => {
    setIsLoadingMetrics(true);
    setMetricsError(null);

    try {
      const metrics = await SystemMonitoringService.getSystemMetrics({
        timeRange: {
          start: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1小时前
          end: new Date().toISOString(),
        },
        interval: '1m',
      });
      setSystemMetrics(metrics);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取系统指标失败';
      setMetricsError(errorMessage);
    } finally {
      setIsLoadingMetrics(false);
    }
  }, []);

  // 刷新警报
  const refreshAlerts = useCallback(async () => {
    setIsLoadingAlerts(true);
    setAlertsError(null);

    try {
      const { alerts: alertList } = await SystemMonitoringService.getSystemAlerts({
        ...alertFilters,
        limit: 100,
      });
      setAlerts(alertList);

      // 检查新警报
      if (onAlert) {
        const newAlerts = alertList.filter(
          alert => !alert.acknowledged && alert.timestamp > (lastHealthCheck || '')
        );
        newAlerts.forEach(alert => onAlert(alert));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取系统警报失败';
      setAlertsError(errorMessage);
    } finally {
      setIsLoadingAlerts(false);
    }
  }, [alertFilters, lastHealthCheck, onAlert]);

  // 确认警报
  const acknowledgeAlert = useCallback(async (alertId: string, note?: string) => {
    try {
      await SystemMonitoringService.acknowledgeAlert(alertId, note);
      setAlerts(prev =>
        prev.map(alert =>
          alert.id === alertId
            ? { ...alert, acknowledged: true, acknowledgedAt: new Date().toISOString() }
            : alert
        )
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '确认警报失败';
      setAlertsError(errorMessage);
      throw error;
    }
  }, []);

  // 搜索日志
  const searchLogs = useCallback(async (options: any) => {
    setIsLoadingLogs(true);
    setLogsError(null);

    try {
      const searchOptions = {
        ...logSearch,
        ...options,
        limit: options.limit || 100,
      };

      const result = await SystemMonitoringService.searchLogs(searchOptions);
      setLogs(result.logs);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '搜索日志失败';
      setLogsError(errorMessage);
    } finally {
      setIsLoadingLogs(false);
    }
  }, [logSearch]);

  // 生成性能报告
  const generatePerformanceReport = useCallback(async (timeRange: any) => {
    setIsLoadingReport(true);
    setReportError(null);

    try {
      const report = await SystemMonitoringService.getPerformanceReport(timeRange);
      setPerformanceReport(report);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '生成性能报告失败';
      setReportError(errorMessage);
    } finally {
      setIsLoadingReport(false);
    }
  }, []);

  // 手动触发健康检查
  const triggerHealthCheck = useCallback(async () => {
    try {
      await SystemMonitoringService.triggerHealthCheck();
      await refreshHealth();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '触发健康检查失败';
      setHealthError(errorMessage);
      throw error;
    }
  }, [refreshHealth]);

  // 重启组件
  const restartComponent = useCallback(async (component: string) => {
    try {
      await SystemMonitoringService.restartComponent(component);
      // 刷新健康状态以反映组件重启
      setTimeout(() => {
        refreshHealth();
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '重启组件失败';
      setHealthError(errorMessage);
      throw error;
    }
  }, [refreshHealth]);

  // 设置警报过滤器
  const setAlertFilters = useCallback((filters: Partial<AlertFilters>) => {
    setAlertFiltersState(prev => ({ ...prev, ...filters }));
  }, []);

  // 清除警报过滤器
  const clearAlertFilters = useCallback(() => {
    setAlertFiltersState({});
  }, []);

  // 设置日志搜索
  const setLogSearchState = useCallback((search: Partial<LogSearch>) => {
    setLogSearchState(prev => ({ ...prev, ...search }));
  }, []);

  // 清除日志搜索
  const clearLogSearch = useCallback(() => {
    setLogSearchState({ query: '' });
  }, []);

  // WebSocket连接管理
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const wsUrl = `${import.meta.env.VITE_WS_BASE_URL}/admin/monitoring/ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log('Monitoring WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        console.log('Monitoring WebSocket disconnected');

        // 自动重连
        setTimeout(() => {
          connectWebSocket();
        }, 5000);
      };

      ws.onerror = () => {
        setIsConnected(false);
        console.error('Monitoring WebSocket error');
      };
    } catch (error) {
      console.error('Failed to connect monitoring WebSocket:', error);
      setIsConnected(false);
    }
  }, []);

  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // 处理WebSocket消息
  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'health_update':
        setSystemHealth(data.health);
        onHealthChange?.(data.health);
        break;
      case 'metrics_update':
        setSystemMetrics(data.metrics);
        break;
      case 'new_alert':
        setAlerts(prev => [data.alert, ...prev]);
        onAlert?.(data.alert);
        break;
      case 'log_entry':
        setLogs(prev => [data.log, ...prev.slice(0, 999)]); // 保留最新1000条
        break;
      case 'alert_acknowledged':
        setAlerts(prev =>
          prev.map(alert =>
            alert.id === data.alertId
              ? { ...alert, acknowledged: true, acknowledgedAt: data.timestamp }
              : alert
          )
        );
        break;
      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  }, [onHealthChange, onAlert]);

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return;

    // 健康检查刷新
    const healthInterval = setInterval(() => {
      refreshHealth();
    }, refreshInterval);

    // 警报刷新
    const alertInterval = setInterval(() => {
      refreshAlerts();
    }, alertRefreshInterval);

    return () => {
      clearInterval(healthInterval);
      clearInterval(alertInterval);
    };
  }, [autoRefresh, refreshInterval, alertRefreshInterval, refreshHealth, refreshAlerts]);

  // 初始化加载
  useEffect(() => {
    refreshHealth();
    refreshMetrics();
    refreshAlerts();
  }, []);

  // WebSocket连接
  useEffect(() => {
    if (autoRefresh) {
      connectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [autoRefresh, connectWebSocket, disconnectWebSocket]);

  // 页面可见性变化时刷新数据
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshHealth();
        refreshMetrics();
        refreshAlerts();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshHealth, refreshMetrics, refreshAlerts]);

  return {
    // 系统健康
    systemHealth,
    isLoadingHealth,
    healthError,
    lastHealthCheck,

    // 系统指标
    systemMetrics,
    isLoadingMetrics,
    metricsError,

    // 警报管理
    alerts,
    isLoadingAlerts,
    alertsError,
    unreadAlerts,
    alertFilters,

    // 日志监控
    logs,
    isLoadingLogs,
    logsError,
    logSearch,

    // 性能报告
    performanceReport,
    isLoadingReport,
    reportError,

    // 监控配置
    monitoringConfig,
    isLoadingConfig,
    configError,

    // 操作方法
    refreshHealth,
    refreshMetrics,
    refreshAlerts,
    acknowledgeAlert,
    searchLogs,
    generatePerformanceReport,
    triggerHealthCheck,
    restartComponent,

    // 过滤和搜索
    setAlertFilters,
    clearAlertFilters,
    setLogSearchState,
    clearLogSearch,

    // 实时连接
    connectWebSocket,
    disconnectWebSocket,
    isConnected,
  };
};

/**
 * 警报管理Hook
 */
export const useAlertManagement = () => {
  const { alerts, acknowledgeAlert, refreshAlerts, alertFilters, setAlertFilters } = useSystemMonitoring({
    alertRefreshInterval: 5000, // 5秒刷新警报
  });

  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);

  // 批量确认警报
  const acknowledgeMultipleAlerts = useCallback(async (alertIds: string[], note?: string) => {
    try {
      await Promise.all(alertIds.map(id => acknowledgeAlert(id, note)));
      setSelectedAlerts([]);
    } catch (error) {
      console.error('Failed to acknowledge alerts:', error);
    }
  }, [acknowledgeAlert]);

  // 获取严重警报
  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical' && !alert.resolvedAt);

  // 获取未确认警报
  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged && !alert.resolvedAt);

  return {
    alerts,
    selectedAlerts,
    setSelectedAlerts,
    criticalAlerts,
    unacknowledgedAlerts,
    acknowledgeAlert,
    acknowledgeMultipleAlerts,
    refreshAlerts,
    alertFilters,
    setAlertFilters,
  };
};

/**
 * 日志监控Hook
 */
export const useLogMonitoring = () => {
  const { logs, searchLogs, logSearch, setLogSearchState, isLoadingLogs } = useSystemMonitoring();

  // 实时日志流
  const [isStreaming, setIsStreaming] = useState(false);

  // 开始实时日志流
  const startLogStream = useCallback((filters?: any) => {
    setIsStreaming(true);
    const streamOptions = {
      ...filters,
      limit: 50, // 实时流限制数量
      sortBy: 'timestamp',
      sortOrder: 'desc',
    };
    searchLogs(streamOptions);
  }, [searchLogs]);

  // 停止实时日志流
  const stopLogStream = useCallback(() => {
    setIsStreaming(false);
  }, []);

  // 搜索错误日志
  const searchErrorLogs = useCallback((timeRange?: any) => {
    const errorSearchOptions = {
      level: ['error', 'critical'],
      timeRange,
      limit: 100,
    };
    searchLogs(errorSearchOptions);
  }, [searchLogs]);

  // 搜索特定组件日志
  const searchComponentLogs = useCallback((component: string, timeRange?: any) => {
    const componentSearchOptions = {
      component,
      timeRange,
      limit: 100,
    };
    searchLogs(componentSearchOptions);
  }, [searchLogs]);

  // 清除日志搜索
  const clearLogSearch = useCallback(() => {
    setLogSearchState({ query: '' });
  }, [setLogSearchState]);

  return {
    logs,
    isLoadingLogs,
    isStreaming,
    logSearch,
    searchLogs,
    startLogStream,
    stopLogStream,
    searchErrorLogs,
    searchComponentLogs,
    clearLogSearch,
  };
};
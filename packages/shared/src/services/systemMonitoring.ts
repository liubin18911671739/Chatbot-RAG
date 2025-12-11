/**
 * 系统监控服务 - 处理系统性能、健康检查、日志监控等功能
 */

import { AdminService } from './admin';

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical' | 'down';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  components: ComponentHealth[];
  metrics: SystemMetrics;
  alerts: SystemAlert[];
}

export interface ComponentHealth {
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'down';
  responseTime: number;
  lastCheck: string;
  errorCount: number;
  errorRate: number;
  uptime: number;
  details?: any;
}

export interface SystemMetrics {
  cpu: CPUMetrics;
  memory: MemoryMetrics;
  disk: DiskMetrics;
  network: NetworkMetrics;
  database: DatabaseMetrics;
  cache: CacheMetrics;
  queue: QueueMetrics;
  api: APIMetrics;
}

export interface CPUMetrics {
  usage: number;
  cores: number;
  loadAverage: number[];
  processes: number;
  temperature?: number;
}

export interface MemoryMetrics {
  total: number;
  used: number;
  free: number;
  cached: number;
  swap: SwapMetrics;
  usage: number;
  pressure: MemoryPressure;
}

export interface SwapMetrics {
  total: number;
  used: number;
  free: number;
  usage: number;
}

export interface MemoryPressure {
  some: number;
  full: number;
}

export interface DiskMetrics {
  total: number;
  used: number;
  free: number;
  usage: number;
  readSpeed: number;
  writeSpeed: number;
  iops: IOPSMetrics;
  partitions: DiskPartition[];
}

export interface IOPSMetrics {
  readOps: number;
  writeOps: number;
  readBytes: number;
  writeBytes: number;
}

export interface DiskPartition {
  device: string;
  mountpoint: string;
  total: number;
  used: number;
  free: number;
  usage: number;
  filesystem: string;
}

export interface NetworkMetrics {
  interfaces: NetworkInterface[];
  connections: NetworkConnection[];
  bandwidth: BandwidthMetrics;
  latency: LatencyMetrics;
}

export interface NetworkInterface {
  name: string;
  status: 'up' | 'down';
  speed: number;
  duplex: boolean;
  mtu: number;
  bytesReceived: number;
  bytesSent: number;
  packetsReceived: number;
  packetsSent: number;
  errorsIn: number;
  errorsOut: number;
  dropsIn: number;
  dropsOut: number;
}

export interface NetworkConnection {
  protocol: 'tcp' | 'udp';
  localAddress: string;
  localPort: number;
  remoteAddress?: string;
  remotePort?: number;
  state: string;
  pid?: number;
}

export interface BandwidthMetrics {
  inbound: number;
  outbound: number;
  total: number;
  peakInbound: number;
  peakOutbound: number;
}

export interface LatencyMetrics {
  average: number;
  p50: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
}

export interface DatabaseMetrics {
  connections: DatabaseConnections;
  performance: DatabasePerformance;
  size: DatabaseSize;
  queries: DatabaseQueries;
  locks: DatabaseLocks;
  replication?: DatabaseReplication;
}

export interface DatabaseConnections {
  active: number;
  idle: number;
  total: number;
  max: number;
  usage: number;
}

export interface DatabasePerformance {
  queryTime: QueryTimeMetrics;
  throughput: ThroughputMetrics;
  cacheHitRatio: number;
  indexUsage: IndexUsageMetrics;
}

export interface QueryTimeMetrics {
  average: number;
  p95: number;
  p99: number;
  slowQueries: number;
}

export interface ThroughputMetrics {
  transactionsPerSecond: number;
  queriesPerSecond: number;
  rowsPerSecond: number;
}

export interface IndexUsageMetrics {
  total: number;
  used: number;
  unused: number;
  efficiency: number;
}

export interface DatabaseSize {
  total: number;
  tables: number;
  indexes: number;
  largestTable: string;
  growthRate: number;
}

export interface DatabaseQueries {
  total: number;
  select: number;
  insert: number;
  update: number;
  delete: number;
  others: number;
}

export interface DatabaseLocks {
  waiting: number;
  granted: number;
  deadlocks: number;
  lockTime: number;
}

export interface DatabaseReplication {
  status: 'healthy' | 'lagging' | 'down';
  lag: number;
  lastSync: string;
}

export interface CacheMetrics {
  hitRatio: number;
  memory: CacheMemoryMetrics;
  operations: CacheOperationsMetrics;
  eviction: CacheEvictionMetrics;
  keys: CacheKeysMetrics;
}

export interface CacheMemoryMetrics {
  used: number;
  max: number;
  usage: number;
}

export interface CacheOperationsMetrics {
  gets: number;
  sets: number;
  deletes: number;
  hits: number;
  misses: number;
}

export interface CacheEvictionMetrics {
  evicted: number;
  expired: number;
}

export interface CacheKeysMetrics {
  total: number;
  expired: number;
  averageSize: number;
}

export interface QueueMetrics {
  queues: QueueStatus[];
  throughput: QueueThroughputMetrics;
  latency: QueueLatencyMetrics;
  errors: QueueErrorMetrics;
}

export interface QueueStatus {
  name: string;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  rate: number;
  avgProcessingTime: number;
}

export interface QueueThroughputMetrics {
  messagesPerSecond: number;
  peakMessagesPerSecond: number;
  totalMessages: number;
}

export interface QueueLatencyMetrics {
  averageWaitTime: number;
  p95WaitTime: number;
  p99WaitTime: number;
  maxWaitTime: number;
}

export interface QueueErrorMetrics {
  errorRate: number;
  totalErrors: number;
  recentErrors: QueueError[];
}

export interface QueueError {
  timestamp: string;
  error: string;
  queue: string;
  messageId?: string;
}

export interface APIMetrics {
  requests: APIRequestsMetrics;
  responseTime: APIResponseTimeMetrics;
  statusCodes: StatusCodeMetrics;
  endpoints: EndpointMetrics[];
  errors: APIErrorMetrics;
}

export interface APIRequestsMetrics {
  total: number;
  perSecond: number;
  peakPerSecond: number;
}

export interface APIResponseTimeMetrics {
  average: number;
  p50: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
}

export interface StatusCodeMetrics {
  '1xx': number;
  '2xx': number;
  '3xx': number;
  '4xx': number;
  '5xx': number;
}

export interface EndpointMetrics {
  path: string;
  method: string;
  requests: number;
  averageResponseTime: number;
  errorRate: number;
  lastRequest: string;
}

export interface APIErrorMetrics {
  totalErrors: number;
  errorRate: number;
  topErrors: APIError[];
}

export interface APIError {
  path: string;
  method: string;
  statusCode: number;
  count: number;
  lastOccurrence: string;
  message?: string;
}

export interface SystemAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  component: string;
  timestamp: string;
  acknowledged: boolean;
  resolvedAt?: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  metadata?: any;
}

export enum AlertType {
  SYSTEM_DOWN = 'system_down',
  HIGH_CPU_USAGE = 'high_cpu_usage',
  HIGH_MEMORY_USAGE = 'high_memory_usage',
  LOW_DISK_SPACE = 'low_disk_space',
  DATABASE_CONNECTION_ERROR = 'database_connection_error',
  API_ERROR_RATE_HIGH = 'api_error_rate_high',
  RESPONSE_TIME_HIGH = 'response_time_high',
  QUEUE_BACKLOG = 'queue_backlog',
  CACHE_HIT_RATIO_LOW = 'cache_hit_ratio_low',
  SECURITY_BREACH = 'security_breach',
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  component: string;
  context?: LogContext;
  metadata?: any;
  traceId?: string;
  spanId?: string;
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: any;
}

export interface LogSearchOptions {
  level?: LogLevel[];
  component?: string[];
  timeRange?: TimeRange;
  search?: string;
  context?: Record<string, any>;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'level';
  sortOrder?: 'asc' | 'desc';
}

export interface TimeRange {
  start: string;
  end: string;
}

export interface LogSearchResult {
  logs: LogEntry[];
  total: number;
  hasMore: boolean;
  facets?: LogFacets;
}

export interface LogFacets {
  levels: LevelFacet[];
  components: ComponentFacet[];
  errors: ErrorFacet[];
}

export interface LevelFacet {
  level: LogLevel;
  count: number;
}

export interface ComponentFacet {
  component: string;
  count: number;
}

export interface ErrorFacet {
  error: string;
  count: number;
}

export interface PerformanceReport {
  id: string;
  generatedAt: string;
  timeRange: TimeRange;
  summary: PerformanceSummary;
  details: PerformanceDetails;
  recommendations: PerformanceRecommendation[];
}

export interface PerformanceSummary {
  overallScore: number;
  availability: number;
  responseTime: number;
  throughput: number;
  errorRate: number;
}

export interface PerformanceDetails {
  api: APIDetails;
  database: DatabaseDetails;
  cache: CacheDetails;
  queue: QueueDetails;
}

export interface APIDetails {
  totalRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  errorRate: number;
  throughput: number;
  topEndpoints: TopEndpoint[];
}

export interface TopEndpoint {
  path: string;
  requests: number;
  averageResponseTime: number;
  errorRate: number;
}

export interface DatabaseDetails {
  totalQueries: number;
  averageQueryTime: number;
  slowQueries: number;
  connectionUsage: number;
  cacheHitRatio: number;
}

export interface CacheDetails {
  hitRatio: number;
  memoryUsage: number;
  evictionRate: number;
  keyCount: number;
}

export interface QueueDetails {
  totalMessages: number;
  averageWaitTime: number;
  processingRate: number;
  backlog: number;
}

export interface PerformanceRecommendation {
  category: 'performance' | 'security' | 'reliability' | 'scalability';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  implementation: string;
}

export interface MonitoringConfig {
  thresholds: MonitoringThresholds;
  alerts: AlertConfig[];
  retention: RetentionConfig;
  dashboards: DashboardConfig[];
}

export interface MonitoringThresholds {
  cpu: {
    warning: number;
    critical: number;
  };
  memory: {
    warning: number;
    critical: number;
  };
  disk: {
    warning: number;
    critical: number;
  };
  responseTime: {
    warning: number;
    critical: number;
  };
  errorRate: {
    warning: number;
    critical: number;
  };
  queueBacklog: {
    warning: number;
    critical: number;
  };
}

export interface AlertConfig {
  type: AlertType;
  enabled: boolean;
  threshold: number;
  duration: number;
  channels: NotificationChannel[];
  cooldown: number;
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  config: any;
}

export interface RetentionConfig {
  metrics: number; // days
  logs: number; // days
  alerts: number; // days
  reports: number; // days
}

export interface DashboardConfig {
  id: string;
  name: string;
  description: string;
  widgets: WidgetConfig[];
  layout: LayoutConfig;
  refreshInterval: number;
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  dataSource: string;
  config: any;
  position: Position;
}

export enum WidgetType {
  CHART = 'chart',
  METRIC = 'metric',
  TABLE = 'table',
  GAUGE = 'gauge',
  ALERTS = 'alerts',
  LOGS = 'logs',
}

export interface LayoutConfig {
  columns: number;
  rows: number;
}

export interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}

class SystemMonitoringError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message);
    this.name = 'SystemMonitoringError';
  }
}

export class SystemMonitoringService {
  private static readonly API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  /**
   * 获取系统健康状态
   */
  static async getSystemHealth(): Promise<SystemHealth> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new SystemMonitoringError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/admin/monitoring/health`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new SystemMonitoringError(
          data.message || '获取系统健康状态失败',
          data.code,
          response.status
        );
      }

      return data.health;
    } catch (error) {
      if (error instanceof SystemMonitoringError) {
        throw error;
      }
      throw new SystemMonitoringError('获取系统健康状态失败');
    }
  }

  /**
   * 获取系统指标
   */
  static async getSystemMetrics(options?: {
    timeRange?: TimeRange;
    components?: string[];
    interval?: string;
  }): Promise<SystemMetrics> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new SystemMonitoringError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const params = new URLSearchParams();
      if (options?.timeRange) {
        params.append('startTime', options.timeRange.start);
        params.append('endTime', options.timeRange.end);
      }
      if (options?.components) params.append('components', options.components.join(','));
      if (options?.interval) params.append('interval', options.interval);

      const response = await fetch(`${this.API_BASE}/api/admin/monitoring/metrics?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new SystemMonitoringError(
          data.message || '获取系统指标失败',
          data.code,
          response.status
        );
      }

      return data.metrics;
    } catch (error) {
      if (error instanceof SystemMonitoringError) {
        throw error;
      }
      throw new SystemMonitoringError('获取系统指标失败');
    }
  }

  /**
   * 获取系统警报
   */
  static async getSystemAlerts(options?: {
    severity?: AlertSeverity[];
    acknowledged?: boolean;
    resolved?: boolean;
    timeRange?: TimeRange;
    limit?: number;
    offset?: number;
  }): Promise<{ alerts: SystemAlert[]; total: number }> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new SystemMonitoringError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const params = new URLSearchParams();
      if (options?.severity) params.append('severity', options.severity.join(','));
      if (options?.acknowledged !== undefined) params.append('acknowledged', options.acknowledged.toString());
      if (options?.resolved !== undefined) params.append('resolved', options.resolved.toString());
      if (options?.timeRange) {
        params.append('startTime', options.timeRange.start);
        params.append('endTime', options.timeRange.end);
      }
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());

      const response = await fetch(`${this.API_BASE}/api/admin/monitoring/alerts?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new SystemMonitoringError(
          data.message || '获取系统警报失败',
          data.code,
          response.status
        );
      }

      return {
        alerts: data.alerts,
        total: data.total,
      };
    } catch (error) {
      if (error instanceof SystemMonitoringError) {
        throw error;
      }
      throw new SystemMonitoringError('获取系统警报失败');
    }
  }

  /**
   * 确认警报
   */
  static async acknowledgeAlert(alertId: string, note?: string): Promise<void> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new SystemMonitoringError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/admin/monitoring/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ note }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new SystemMonitoringError(
          data.message || '确认警报失败',
          data.code,
          response.status
        );
      }
    } catch (error) {
      if (error instanceof SystemMonitoringError) {
        throw error;
      }
      throw new SystemMonitoringError('确认警报失败');
    }
  }

  /**
   * 搜索日志
   */
  static async searchLogs(options: LogSearchOptions): Promise<LogSearchResult> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new SystemMonitoringError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const params = new URLSearchParams();
      if (options?.level) params.append('level', options.level.join(','));
      if (options?.component) params.append('component', options.component.join(','));
      if (options?.timeRange) {
        params.append('startTime', options.timeRange.start);
        params.append('endTime', options.timeRange.end);
      }
      if (options?.search) params.append('search', options.search);
      if (options?.context) params.append('context', JSON.stringify(options.context));
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());
      if (options?.sortBy) params.append('sortBy', options.sortBy);
      if (options?.sortOrder) params.append('sortOrder', options.sortOrder);

      const response = await fetch(`${this.API_BASE}/api/admin/monitoring/logs/search?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new SystemMonitoringError(
          data.message || '搜索日志失败',
          data.code,
          response.status
        );
      }

      return data.result;
    } catch (error) {
      if (error instanceof SystemMonitoringError) {
        throw error;
      }
      throw new SystemMonitoringError('搜索日志失败');
    }
  }

  /**
   * 获取性能报告
   */
  static async getPerformanceReport(timeRange: TimeRange): Promise<PerformanceReport> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new SystemMonitoringError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/admin/monitoring/performance/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ timeRange }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new SystemMonitoringError(
          data.message || '获取性能报告失败',
          data.code,
          response.status
        );
      }

      return data.report;
    } catch (error) {
      if (error instanceof SystemMonitoringError) {
        throw error;
      }
      throw new SystemMonitoringError('获取性能报告失败');
    }
  }

  /**
   * 获取监控配置
   */
  static async getMonitoringConfig(): Promise<MonitoringConfig> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new SystemMonitoringError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/admin/monitoring/config`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new SystemMonitoringError(
          data.message || '获取监控配置失败',
          data.code,
          response.status
        );
      }

      return data.config;
    } catch (error) {
      if (error instanceof SystemMonitoringError) {
        throw error;
      }
      throw new SystemMonitoringError('获取监控配置失败');
    }
  }

  /**
   * 更新监控配置
   */
  static async updateMonitoringConfig(config: Partial<MonitoringConfig>): Promise<MonitoringConfig> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new SystemMonitoringError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/admin/monitoring/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new SystemMonitoringError(
          data.message || '更新监控配置失败',
          data.code,
          response.status
        );
      }

      return data.config;
    } catch (error) {
      if (error instanceof SystemMonitoringError) {
        throw error;
      }
      throw new SystemMonitoringError('更新监控配置失败');
    }
  }

  /**
   * 手动触发健康检查
   */
  static async triggerHealthCheck(): Promise<SystemHealth> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new SystemMonitoringError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/admin/monitoring/health/check`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new SystemMonitoringError(
          data.message || '触发健康检查失败',
          data.code,
          response.status
        );
      }

      return data.health;
    } catch (error) {
      if (error instanceof SystemMonitoringError) {
        throw error;
      }
      throw new SystemMonitoringError('触发健康检查失败');
    }
  }

  /**
   * 重启系统组件
   */
  static async restartComponent(component: string): Promise<void> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new SystemMonitoringError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/admin/monitoring/components/${component}/restart`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new SystemMonitoringError(
          data.message || '重启组件失败',
          data.code,
          response.status
        );
      }
    } catch (error) {
      if (error instanceof SystemMonitoringError) {
        throw error;
      }
      throw new SystemMonitoringError('重启组件失败');
    }
  }

  /**
   * 导出监控数据
   */
  static async exportMonitoringData(options: {
    timeRange: TimeRange;
    metrics: string[];
    format: 'json' | 'csv' | 'xlsx';
  }): Promise<{ exportId: string; downloadUrl?: string }> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new SystemMonitoringError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/admin/monitoring/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(options),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new SystemMonitoringError(
          data.message || '导出监控数据失败',
          data.code,
          response.status
        );
      }

      return data.export;
    } catch (error) {
      if (error instanceof SystemMonitoringError) {
        throw error;
      }
      throw new SystemMonitoringError('导出监控数据失败');
    }
  }
}
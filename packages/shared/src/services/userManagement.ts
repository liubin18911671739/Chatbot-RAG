/**
 * 用户管理服务 - 处理管理员对用户的操作
 */

import { AdminService } from './admin';

export interface User {
  id: string;
  email: string;
  username?: string;
  nickname: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  profile: UserProfile;
  statistics: UserStatistics;
  security: UserSecurity;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  ANALYST = 'analyst',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
  PENDING_VERIFICATION = 'pending_verification',
  LOCKED = 'locked',
}

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  bio?: string;
  location?: string;
  website?: string;
  company?: string;
  jobTitle?: string;
  phone?: string;
  timezone?: string;
  language?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  socialLinks?: SocialLinks;
}

export interface SocialLinks {
  github?: string;
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  website?: string;
}

export interface UserStatistics {
  totalMessages: number;
  totalConversations: number;
  totalTokensUsed: number;
  averageMessagesPerDay: number;
  mostActiveHour: number;
  averageSessionDuration: number;
  knowledgeBaseUsage: KnowledgeBaseUsage[];
  lastActivityDate: string;
  registrationDate: string;
  daysActive: number;
  streakDays: number;
  achievements: Achievement[];
}

export interface KnowledgeBaseUsage {
  knowledgeBaseId: string;
  knowledgeBaseName: string;
  queryCount: number;
  averageResponseTime: number;
  satisfactionScore?: number;
  lastQueryDate: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  unlockedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UserSecurity {
  twoFactorEnabled: boolean;
  lastPasswordChange?: string;
  loginAttempts: number;
  lockedUntil?: string;
  securityEvents: SecurityEvent[];
  trustedDevices: TrustedDevice[];
  activeSessions: ActiveSession[];
}

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  description: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}

export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  PASSWORD_CHANGE = 'password_change',
  TWO_FACTOR_ENABLED = 'two_factor_enabled',
  TWO_FACTOR_DISABLED = 'two_factor_disabled',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  ACCOUNT_LOCKED = 'account_locked',
  DATA_BREACH = 'data_breach',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
}

export interface TrustedDevice {
  id: string;
  name: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  platform: string;
  browser: string;
  ipAddress: string;
  lastUsed: string;
  trusted: boolean;
}

export interface ActiveSession {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  location?: string;
  createdAt: string;
  lastActivity: string;
  current: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
  chat: ChatPreferences;
  accessibility: AccessibilityPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  marketing: boolean;
  security: boolean;
  updates: boolean;
  frequency: 'instant' | 'hourly' | 'daily' | 'weekly';
  quietHours?: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export interface PrivacyPreferences {
  profileVisibility: 'public' | 'friends' | 'private';
  activityVisibility: 'public' | 'friends' | 'private';
  showOnlineStatus: boolean;
  allowDataCollection: boolean;
  allowAnalytics: boolean;
  searchEngineIndexing: boolean;
}

export interface ChatPreferences {
  fontSize: 'small' | 'medium' | 'large';
  fontFamily: string;
  messageStyle: 'bubble' | 'plain';
  showTimestamps: boolean;
  showAvatars: boolean;
  showSources: boolean;
  autoSaveHistory: boolean;
  streamResponses: boolean;
  defaultKnowledgeBase?: string;
  customInstructions?: string;
}

export interface AccessibilityPreferences {
  highContrast: boolean;
  reduceMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
}

export interface UserManagementFilters {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  registrationDateRange?: {
    start: string;
    end: string;
  };
  lastActivityDateRange?: {
    start: string;
    end: string;
  };
  minMessages?: number;
  maxMessages?: number;
  hasTwoFactor?: boolean;
  location?: string;
  language?: string;
}

export interface UserManagementOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'lastLoginAt' | 'messageCount' | 'email';
  sortOrder?: 'asc' | 'desc';
  includeInactive?: boolean;
  includeStatistics?: boolean;
  includeSecurity?: boolean;
}

export interface UserManagementResponse {
  users: User[];
  total: number;
  hasMore: boolean;
  facets: UserFacets;
}

export interface UserFacets {
  roles: RoleFacet[];
  statuses: StatusFacet[];
  locations: LocationFacet[];
  languages: LanguageFacet[];
  registrationPeriods: RegistrationPeriodFacet[];
}

export interface RoleFacet {
  role: UserRole;
  count: number;
}

export interface StatusFacet {
  status: UserStatus;
  count: number;
}

export interface LocationFacet {
  location: string;
  count: number;
}

export interface LanguageFacet {
  language: string;
  count: number;
}

export interface RegistrationPeriodFacet {
  period: string;
  count: number;
}

export interface UserCreateRequest {
  email: string;
  password?: string;
  username?: string;
  nickname?: string;
  role?: UserRole;
  profile?: Partial<UserProfile>;
  preferences?: Partial<UserPreferences>;
  sendWelcomeEmail?: boolean;
  requirePasswordChange?: boolean;
}

export interface UserUpdateRequest {
  email?: string;
  username?: string;
  nickname?: string;
  role?: UserRole;
  status?: UserStatus;
  profile?: Partial<UserProfile>;
  preferences?: Partial<UserPreferences>;
  security?: Partial<UserSecurity>;
}

export interface UserBulkOperation {
  action: 'update_role' | 'update_status' | 'delete' | 'export' | 'send_notification';
  userIds: string[];
  parameters?: any;
}

export interface UserAnalytics {
  overview: UserOverview;
  trends: UserTrends;
  engagement: UserEngagement;
  retention: UserRetention;
  demographics: UserDemographics;
  activity: UserActivityMetrics;
}

export interface UserOverview {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  churnRate: number;
  averageMessagesPerUser: number;
  averageSessionsPerUser: number;
  mostActiveTimeOfDay: string;
  topLocations: TopLocation[];
  growthRate: number;
}

export interface TopLocation {
  location: string;
  count: number;
  percentage: number;
}

export interface UserTrends {
  userGrowth: TrendData[];
  activityTrends: TrendData[];
  retentionTrends: TrendData[];
  featureAdoption: FeatureAdoptionData[];
}

export interface TrendData {
  date: string;
  value: number;
  change?: number;
}

export interface FeatureAdoptionData {
  feature: string;
  adoptionRate: number;
  users: number;
  growth: number;
}

export interface UserEngagement {
  dailyActiveUsers: DailyActiveUser[];
  sessionMetrics: SessionMetrics;
  messageMetrics: MessageMetrics;
  featureUsage: FeatureUsage[];
}

export interface DailyActiveUser {
  date: string;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
}

export interface SessionMetrics {
  averageSessionDuration: number;
  averageSessionsPerUser: number;
  bounceRate: number;
  sessionDurationDistribution: DurationDistribution[];
}

export interface DurationDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface MessageMetrics {
  totalMessages: number;
  averageMessagesPerSession: number;
  averageResponseTime: number;
  messageLengthDistribution: MessageLengthDistribution[];
}

export interface MessageLengthDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface FeatureUsage {
  feature: string;
  usageCount: number;
  uniqueUsers: number;
  adoptionRate: number;
  averageUsagePerUser: number;
}

export interface UserRetention {
  retentionRates: RetentionRate[];
  cohortAnalysis: CohortAnalysis[];
  churnAnalysis: ChurnAnalysis[];
  lifecycleMetrics: LifecycleMetrics;
}

export interface RetentionRate {
  period: string;
  rate: number;
  users: number;
}

export interface CohortAnalysis {
  cohort: string;
  size: number;
  retentionRates: number[];
}

export interface ChurnAnalysis {
  period: string;
  churnedUsers: number;
  churnRate: number;
  reasons: ChurnReason[];
}

export interface ChurnReason {
  reason: string;
  count: number;
  percentage: number;
}

export interface LifecycleMetrics {
  averageLifetime: number;
  lifetimeDistribution: LifetimeDistribution[];
  userJourney: UserJourneyStep[];
}

export interface LifetimeDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface UserJourneyStep {
  step: string;
  users: number;
  conversionRate: number;
  averageTime: number;
}

export interface UserDemographics {
  ageDistribution: AgeDistribution[];
  genderDistribution: GenderDistribution[];
  locationDistribution: LocationDistribution[];
  languageDistribution: LanguageDistribution[];
  deviceDistribution: DeviceDistribution[];
  professionDistribution: ProfessionDistribution[];
}

export interface AgeDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface GenderDistribution {
  gender: string;
  count: number;
  percentage: number;
}

export interface LocationDistribution {
  country: string;
  region: string;
  city: string;
  count: number;
  percentage: number;
}

export interface LanguageDistribution {
  language: string;
  count: number;
  percentage: number;
}

export interface DeviceDistribution {
  deviceType: string;
  platform: string;
  count: number;
  percentage: number;
}

export interface ProfessionDistribution {
  profession: string;
  count: number;
  percentage: number;
}

export interface UserActivityMetrics {
  hourlyActivity: HourlyActivity[];
  weeklyActivity: WeeklyActivity[];
  monthlyActivity: MonthlyActivity[];
  queryPatterns: QueryPattern[];
  knowledgeBaseUsage: KnowledgeBaseUsageStats[];
}

export interface HourlyActivity {
  hour: number;
  activity: number;
  messages: number;
  users: number;
}

export interface WeeklyActivity {
  week: string;
  activity: number;
  messages: number;
  users: number;
  newUsers: number;
}

export interface MonthlyActivity {
  month: string;
  activity: number;
  messages: number;
  users: number;
  newUsers: number;
}

export interface QueryPattern {
  pattern: string;
  frequency: number;
  averageResponseTime: number;
  satisfactionScore: number;
}

export interface KnowledgeBaseUsageStats {
  knowledgeBaseId: string;
  knowledgeBaseName: string;
  totalQueries: number;
  uniqueUsers: number;
  averageResponseTime: number;
  satisfactionScore: number;
  growthRate: number;
}

export interface UserExportOptions {
  format: 'json' | 'csv' | 'xlsx';
  fields?: string[];
  filters?: UserManagementFilters;
  dateRange?: {
    start: string;
    end: string;
  };
  includeSensitive?: boolean;
  compress?: boolean;
}

export interface UserImportOptions {
  format: 'json' | 'csv' | 'xlsx';
  data: File | string;
  mapping?: FieldMapping;
  validation: ImportValidation;
  mergeStrategy: 'create' | 'update' | 'skip_duplicates';
}

export interface FieldMapping {
  email: string;
  username?: string;
  nickname?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  [key: string]: string | undefined;
}

export interface ImportValidation {
  validateEmails: boolean;
  validateRequiredFields: boolean;
  checkDuplicates: boolean;
  maxErrors: number;
}

export interface ImportResult {
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
  value: any;
}

class UserManagementError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message);
    this.name = 'UserManagementError';
  }
}

export class UserManagementService {
  private static readonly API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  /**
   * 获取用户列表
   */
  static async getUsers(
    filters?: UserManagementFilters,
    options?: UserManagementOptions
  ): Promise<UserManagementResponse> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new UserManagementError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const params = new URLSearchParams();

      // 添加过滤器参数
      if (filters?.search) params.append('search', filters.search);
      if (filters?.role) params.append('role', filters.role);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.minMessages) params.append('minMessages', filters.minMessages.toString());
      if (filters?.maxMessages) params.append('maxMessages', filters.maxMessages.toString());
      if (filters?.hasTwoFactor !== undefined) params.append('hasTwoFactor', filters.hasTwoFactor.toString());
      if (filters?.location) params.append('location', filters.location);
      if (filters?.language) params.append('language', filters.language);

      if (filters?.registrationDateRange) {
        params.append('registrationStartDate', filters.registrationDateRange.start);
        params.append('registrationEndDate', filters.registrationDateRange.end);
      }

      if (filters?.lastActivityDateRange) {
        params.append('lastActivityStartDate', filters.lastActivityDateRange.start);
        params.append('lastActivityEndDate', filters.lastActivityDateRange.end);
      }

      // 添加选项参数
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());
      if (options?.sortBy) params.append('sortBy', options.sortBy);
      if (options?.sortOrder) params.append('sortOrder', options.sortOrder);
      if (options?.includeInactive !== undefined) params.append('includeInactive', options.includeInactive.toString());
      if (options?.includeStatistics !== undefined) params.append('includeStatistics', options.includeStatistics.toString());
      if (options?.includeSecurity !== undefined) params.append('includeSecurity', options.includeSecurity.toString());

      const response = await fetch(`${this.API_BASE}/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new UserManagementError(
          data.message || '获取用户列表失败',
          data.code,
          response.status
        );
      }

      return data;
    } catch (error) {
      if (error instanceof UserManagementError) {
        throw error;
      }
      throw new UserManagementError('获取用户列表失败');
    }
  }

  /**
   * 获取单个用户详情
   */
  static async getUser(userId: string, options?: {
    includeStatistics?: boolean;
    includeSecurity?: boolean;
    includeActivity?: boolean;
  }): Promise<User> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new UserManagementError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const params = new URLSearchParams();
      if (options?.includeStatistics) params.append('includeStatistics', 'true');
      if (options?.includeSecurity) params.append('includeSecurity', 'true');
      if (options?.includeActivity) params.append('includeActivity', 'true');

      const response = await fetch(`${this.API_BASE}/api/admin/users/${userId}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new UserManagementError(
          data.message || '获取用户详情失败',
          data.code,
          response.status
        );
      }

      return data.user;
    } catch (error) {
      if (error instanceof UserManagementError) {
        throw error;
      }
      throw new UserManagementError('获取用户详情失败');
    }
  }

  /**
   * 创建用户
   */
  static async createUser(userData: UserCreateRequest): Promise<User> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new UserManagementError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new UserManagementError(
          data.message || '创建用户失败',
          data.code,
          response.status
        );
      }

      return data.user;
    } catch (error) {
      if (error instanceof UserManagementError) {
        throw error;
      }
      throw new UserManagementError('创建用户失败');
    }
  }

  /**
   * 更新用户
   */
  static async updateUser(userId: string, userData: UserUpdateRequest): Promise<User> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new UserManagementError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new UserManagementError(
          data.message || '更新用户失败',
          data.code,
          response.status
        );
      }

      return data.user;
    } catch (error) {
      if (error instanceof UserManagementError) {
        throw error;
      }
      throw new UserManagementError('更新用户失败');
    }
  }

  /**
   * 删除用户
   */
  static async deleteUser(userId: string, options?: {
    deleteData?: boolean;
    reason?: string;
  }): Promise<void> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new UserManagementError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const params = new URLSearchParams();
      if (options?.deleteData !== undefined) params.append('deleteData', options.deleteData.toString());
      if (options?.reason) params.append('reason', options.reason);

      const response = await fetch(`${this.API_BASE}/api/admin/users/${userId}?${params}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new UserManagementError(
          data.message || '删除用户失败',
          data.code,
          response.status
        );
      }
    } catch (error) {
      if (error instanceof UserManagementError) {
        throw error;
      }
      throw new UserManagementError('删除用户失败');
    }
  }

  /**
   * 批量操作用户
   */
  static async bulkUserOperation(operation: UserBulkOperation): Promise<{
    total: number;
    success: number;
    failed: number;
    errors: string[];
  }> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new UserManagementError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/admin/users/bulk-operation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(operation),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new UserManagementError(
          data.message || '批量操作用户失败',
          data.code,
          response.status
        );
      }

      return data.result;
    } catch (error) {
      if (error instanceof UserManagementError) {
        throw error;
      }
      throw new UserManagementError('批量操作用户失败');
    }
  }

  /**
   * 重置用户密码
   */
  static async resetUserPassword(
    userId: string,
    options?: {
      sendEmail?: boolean;
      temporaryPassword?: string;
      requireChange?: boolean;
    }
  ): Promise<{ temporaryPassword?: string; emailSent: boolean }> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new UserManagementError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(options),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new UserManagementError(
          data.message || '重置用户密码失败',
          data.code,
          response.status
        );
      }

      return data.result;
    } catch (error) {
      if (error instanceof UserManagementError) {
        throw error;
      }
      throw new UserManagementError('重置用户密码失败');
    }
  }

  /**
   * 锁定/解锁用户
   */
  static async toggleUserLock(
    userId: string,
    locked: boolean,
    reason?: string,
    duration?: number
  ): Promise<void> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new UserManagementError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/admin/users/${userId}/lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ locked, reason, duration }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new UserManagementError(
          data.message || '锁定用户失败',
          data.code,
          response.status
        );
      }
    } catch (error) {
      if (error instanceof UserManagementError) {
        throw error;
      }
      throw new UserManagementError('锁定用户失败');
    }
  }

  /**
   * 强制用户登出
   */
  static async forceLogoutUser(userId: string, options?: {
    allDevices?: boolean;
    reason?: string;
  }): Promise<void> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new UserManagementError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/admin/users/${userId}/force-logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new UserManagementError(
          data.message || '强制用户登出失败',
          data.code,
          response.status
        );
      }
    } catch (error) {
      if (error instanceof UserManagementError) {
        throw error;
      }
      throw new UserManagementError('强制用户登出失败');
    }
  }

  /**
   * 获取用户分析数据
   */
  static async getUserAnalytics(options?: {
    dateRange?: {
      start: string;
      end: string;
    };
    metrics?: string[];
    groupBy?: 'day' | 'week' | 'month';
  }): Promise<UserAnalytics> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new UserManagementError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const params = new URLSearchParams();
      if (options?.dateRange) {
        params.append('startDate', options.dateRange.start);
        params.append('endDate', options.dateRange.end);
      }
      if (options?.metrics) params.append('metrics', options.metrics.join(','));
      if (options?.groupBy) params.append('groupBy', options.groupBy);

      const response = await fetch(`${this.API_BASE}/api/admin/users/analytics?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new UserManagementError(
          data.message || '获取用户分析数据失败',
          data.code,
          response.status
        );
      }

      return data.analytics;
    } catch (error) {
      if (error instanceof UserManagementError) {
        throw error;
      }
      throw new UserManagementError('获取用户分析数据失败');
    }
  }

  /**
   * 导出用户数据
   */
  static async exportUsers(
    options: UserExportOptions
  ): Promise<{ exportId: string; downloadUrl?: string }> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new UserManagementError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/admin/users/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(options),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new UserManagementError(
          data.message || '导出用户数据失败',
          data.code,
          response.status
        );
      }

      return data.export;
    } catch (error) {
      if (error instanceof UserManagementError) {
        throw error;
      }
      throw new UserManagementError('导出用户数据失败');
    }
  }

  /**
   * 导入用户数据
   */
  static async importUsers(options: UserImportOptions): Promise<ImportResult> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new UserManagementError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const formData = new FormData();
      formData.append('format', options.format);
      formData.append('mergeStrategy', options.mergeStrategy);

      if (options.data instanceof File) {
        formData.append('file', options.data);
      } else {
        formData.append('data', options.data);
      }

      if (options.mapping) {
        formData.append('mapping', JSON.stringify(options.mapping));
      }

      if (options.validation) {
        formData.append('validation', JSON.stringify(options.validation));
      }

      const response = await fetch(`${this.API_BASE}/api/admin/users/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new UserManagementError(
          data.message || '导入用户数据失败',
          data.code,
          response.status
        );
      }

      return data.result;
    } catch (error) {
      if (error instanceof UserManagementError) {
        throw error;
      }
      throw new UserManagementError('导入用户数据失败');
    }
  }

  /**
   * 发送通知给用户
   */
  static async sendNotificationToUsers(
    userIds: string[],
    notification: {
      title: string;
      message: string;
      type: 'info' | 'warning' | 'success' | 'error';
      channels?: ('email' | 'push' | 'in_app')[];
      data?: any;
    }
  ): Promise<{ sent: number; failed: number; errors: string[] }> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new UserManagementError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/admin/users/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userIds,
          notification,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new UserManagementError(
          data.message || '发送通知失败',
          data.code,
          response.status
        );
      }

      return data.result;
    } catch (error) {
      if (error instanceof UserManagementError) {
        throw error;
      }
      throw new UserManagementError('发送通知失败');
    }
  }

  /**
   * 获取用户会话列表
   */
  static async getUserSessions(userId: string): Promise<ActiveSession[]> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new UserManagementError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/admin/users/${userId}/sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new UserManagementError(
          data.message || '获取用户会话失败',
          data.code,
          response.status
        );
      }

      return data.sessions;
    } catch (error) {
      if (error instanceof UserManagementError) {
        throw error;
      }
      throw new UserManagementError('获取用户会话失败');
    }
  }

  /**
   * 撤销用户会话
   */
  static async revokeUserSession(userId: string, sessionId: string): Promise<void> {
    const token = AdminService.getAdminAccessToken();
    if (!token) {
      throw new UserManagementError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/admin/users/${userId}/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new UserManagementError(
          data.message || '撤销用户会话失败',
          data.code,
          response.status
        );
      }
    } catch (error) {
      if (error instanceof UserManagementError) {
        throw error;
      }
      throw new UserManagementError('撤销用户会话失败');
    }
  }
}
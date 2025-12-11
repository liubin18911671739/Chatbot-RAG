/**
 * 管理员服务 - 处理管理员认证、权限验证和管理功能
 */

import { AuthService } from './auth';

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  avatar?: string;
  role: AdminRole;
  permissions: Permission[];
  status: AdminStatus;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  twoFactorEnabled: boolean;
  loginAttempts: number;
  lockedUntil?: string;
}

export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  ANALYST = 'analyst',
  SUPPORT = 'support',
}

export enum AdminStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  LOCKED = 'locked',
  PENDING = 'pending',
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
  category: PermissionCategory;
}

export enum PermissionCategory {
  USER_MANAGEMENT = 'user_management',
  SYSTEM_ADMINISTRATION = 'system_administration',
  CONTENT_MODERATION = 'content_moderation',
  ANALYTICS_REPORTING = 'analytics_reporting',
  KNOWLEDGE_MANAGEMENT = 'knowledge_management',
  SECURITY_MANAGEMENT = 'security_management',
  BILLING_MANAGEMENT = 'billing_management',
}

export interface AdminSession {
  id: string;
  adminId: string;
  token: string;
  refreshToken: string;
  expiresAt: string;
  ipAddress: string;
  userAgent: string;
  twoFactorVerified: boolean;
  createdAt: string;
  lastActivityAt: string;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
  twoFactorCode?: string;
  rememberMe?: boolean;
  deviceInfo?: DeviceInfo;
}

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  platform: string;
  browser: string;
  version: string;
}

export interface AdminLoginResponse {
  admin: AdminUser;
  session: AdminSession;
  requiresTwoFactor: boolean;
  twoFactorMethods?: TwoFactorMethod[];
}

export interface TwoFactorMethod {
  type: TwoFactorType;
  name: string;
  enabled: boolean;
  setupRequired: boolean;
}

export enum TwoFactorType {
  TOTP = 'totp',
  SMS = 'sms',
  EMAIL = 'email',
  AUTHENTICATOR_APP = 'authenticator_app',
}

export interface TwoFactorSetupRequest {
  type: TwoFactorType;
  phoneNumber?: string;
  emailAddress?: string;
}

export interface TwoFactorSetupResponse {
  qrCode?: string;
  secret?: string;
  backupCodes?: string[];
  verificationToken: string;
}

export interface AdminActivityLog {
  id: string;
  adminId: string;
  adminName: string;
  action: AdminAction;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  success: boolean;
  failureReason?: string;
}

export enum AdminAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  CREATE_USER = 'create_user',
  UPDATE_USER = 'update_user',
  DELETE_USER = 'delete_user',
  SUSPEND_USER = 'suspend_user',
  ACTIVATE_USER = 'activate_user',
  VIEW_SENSITIVE_DATA = 'view_sensitive_data',
  EXPORT_DATA = 'export_data',
  IMPORT_DATA = 'import_data',
  MODIFY_SETTINGS = 'modify_settings',
  ACCESS_ADMIN_PANEL = 'access_admin_panel',
  RESET_PASSWORD = 'reset_password',
  ENABLE_TWO_FACTOR = 'enable_two_factor',
  DISABLE_TWO_FACTOR = 'disable_two_factor',
}

export interface SystemSettings {
  id: string;
  category: string;
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json' | 'array';
  description: string;
  isPublic: boolean;
  requiresRestart: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rules: SecurityRule[];
  createdAt: string;
  updatedAt: string;
}

export interface SecurityRule {
  type: SecurityRuleType;
  parameters: any;
  enabled: boolean;
}

export enum SecurityRuleType {
  PASSWORD_COMPLEXITY = 'password_complexity',
  PASSWORD_EXPIRY = 'password_expiry',
  SESSION_TIMEOUT = 'session_timeout',
  IP_WHITELIST = 'ip_whitelist',
  LOGIN_ATTEMPT_LIMIT = 'login_attempt_limit',
  TWO_FACTOR_REQUIRED = 'two_factor_required',
}

export interface AccessControlList {
  id: string;
  resource: string;
  permissions: string[];
  roles: AdminRole[];
  conditions?: any;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPermissionCheck {
  resource: string;
  action: string;
  context?: any;
}

class AdminError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message);
    this.name = 'AdminError';
  }
}

export class AdminService {
  private static readonly API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  private static readonly ADMIN_TOKEN_KEY = 'rag_admin_token';
  private static readonly ADMIN_REFRESH_TOKEN_KEY = 'rag_admin_refresh_token';

  /**
   * 管理员登录
   */
  static async adminLogin(credentials: AdminLoginRequest): Promise<AdminLoginResponse> {
    try {
      const response = await fetch(`${this.API_BASE}/api/admin/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...credentials,
          device_info: credentials.deviceInfo || this.getDeviceInfo(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new AdminError(
          data.message || '登录失败',
          data.code,
          response.status
        );
      }

      // 保存认证信息
      this.saveAdminTokens(data.session);

      return data;
    } catch (error) {
      if (error instanceof AdminError) {
        throw error;
      }
      throw new AdminError('网络连接失败，请检查网络设置');
    }
  }

  /**
   * 二步验证
   */
  static async verifyTwoFactor(token: string, code: string): Promise<AdminLoginResponse> {
    try {
      const response = await fetch(`${this.API_BASE}/api/admin/auth/2fa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new AdminError(
          data.message || '二步验证失败',
          data.code,
          response.status
        );
      }

      // 更新认证信息
      this.saveAdminTokens(data.session);

      return data;
    } catch (error) {
      if (error instanceof AdminError) {
        throw error;
      }
      throw new AdminError('二步验证失败');
    }
  }

  /**
   * 设置二步验证
   */
  static async setupTwoFactor(setupRequest: TwoFactorSetupRequest): Promise<TwoFactorSetupResponse> {
    const token = this.getAdminAccessToken();
    if (!token) {
      throw new AdminError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/admin/auth/2fa/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(setupRequest),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new AdminError(
          data.message || '设置二步验证失败',
          data.code,
          response.status
        );
      }

      return data;
    } catch (error) {
      if (error instanceof AdminError) {
        throw error;
      }
      throw new AdminError('设置二步验证失败');
    }
  }

  /**
   * 确认二步验证设置
   */
  static async confirmTwoFactorSetup(
    verificationToken: string,
    code: string
  ): Promise<void> {
    const token = this.getAdminAccessToken();
    if (!token) {
      throw new AdminError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/admin/auth/2fa/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ verificationToken: verificationToken, code }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new AdminError(
          data.message || '确认二步验证失败',
          data.code,
          response.status
        );
      }
    } catch (error) {
      if (error instanceof AdminError) {
        throw error;
      }
      throw new AdminError('确认二步验证失败');
    }
  }

  /**
   * 禁用二步验证
   */
  static async disableTwoFactor(password: string): Promise<void> {
    const token = this.getAdminAccessToken();
    if (!token) {
      throw new AdminError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/admin/auth/2fa/disable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new AdminError(
          data.message || '禁用二步验证失败',
          data.code,
          response.status
        );
      }
    } catch (error) {
      if (error instanceof AdminError) {
        throw error;
      }
      throw new AdminError('禁用二步验证失败');
    }
  }

  /**
   * 管理员登出
   */
  static async adminLogout(): Promise<void> {
    const token = this.getAdminAccessToken();
    if (token) {
      try {
        await fetch(`${this.API_BASE}/api/admin/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (error) {
        // 即使请求失败也继续清理本地数据
      }
    }

    this.clearAdminTokens();
  }

  /**
   * 刷新管理员令牌
   */
  static async refreshAdminToken(): Promise<void> {
    const refreshToken = this.getAdminRefreshToken();
    if (!refreshToken) {
      throw new AdminError('未找到刷新令牌', 'NO_REFRESH_TOKEN');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/admin/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new AdminError(
          data.message || '令牌刷新失败',
          data.code,
          response.status
        );
      }

      this.saveAdminTokens(data.session);
    } catch (error) {
      this.clearAdminTokens();
      if (error instanceof AdminError) {
        throw error;
      }
      throw new AdminError('令牌刷新失败，请重新登录');
    }
  }

  /**
   * 获取当前管理员信息
   */
  static async getCurrentAdmin(): Promise<AdminUser | null> {
    const token = this.getAdminAccessToken();
    if (!token) {
      return null;
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/admin/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // 令牌可能过期，尝试刷新
          try {
            await this.refreshAdminToken();
            return this.getCurrentAdmin();
          } catch {
            this.clearAdminTokens();
            return null;
          }
        }
        throw new AdminError('获取管理员信息失败', 'GET_ADMIN_FAILED');
      }

      return response.json();
    } catch (error) {
      if (error instanceof AdminError) {
        throw error;
      }
      return null;
    }
  }

  /**
   * 检查管理员权限
   */
  static async checkPermission(permissionCheck: AdminPermissionCheck): Promise<boolean> {
    const token = this.getAdminAccessToken();
    if (!token) {
      return false;
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/admin/auth/check-permission`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(permissionCheck),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.hasPermission;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取管理员活动日志
   */
  static async getAdminActivityLogs(options?: {
    limit?: number;
    offset?: number;
    adminId?: string;
    action?: AdminAction;
    dateRange?: {
      start: string;
      end: string;
    };
  }): Promise<{ logs: AdminActivityLog[]; total: number }> {
    const token = this.getAdminAccessToken();
    if (!token) {
      throw new AdminError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());
      if (options?.adminId) params.append('adminId', options.adminId);
      if (options?.action) params.append('action', options.action);
      if (options?.dateRange) {
        params.append('startDate', options.dateRange.start);
        params.append('endDate', options.dateRange.end);
      }

      const response = await fetch(`${this.API_BASE}/api/admin/activity-logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new AdminError(
          data.message || '获取活动日志失败',
          data.code,
          response.status
        );
      }

      return {
        logs: data.logs,
        total: data.total,
      };
    } catch (error) {
      if (error instanceof AdminError) {
        throw error;
      }
      throw new AdminError('获取活动日志失败');
    }
  }

  /**
   * 记录管理员活动
   */
  static async logActivity(activity: {
    action: AdminAction;
    resource: string;
    resourceId?: string;
    details?: any;
    success: boolean;
    failureReason?: string;
  }): Promise<void> {
    const token = this.getAdminAccessToken();
    if (!token) {
      return; // 如果未登录，不记录活动
    }

    try {
      await fetch(`${this.API_BASE}/api/admin/activity-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...activity,
          ipAddress: this.getClientIP(),
          userAgent: navigator.userAgent,
        }),
      });
    } catch (error) {
      // 记录失败不影响主要功能
      console.error('Failed to log admin activity:', error);
    }
  }

  /**
   * 获取系统设置
   */
  static async getSystemSettings(category?: string): Promise<SystemSettings[]> {
    const token = this.getAdminAccessToken();
    if (!token) {
      throw new AdminError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);

      const response = await fetch(`${this.API_BASE}/api/admin/settings?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new AdminError(
          data.message || '获取系统设置失败',
          data.code,
          response.status
        );
      }

      return data.settings;
    } catch (error) {
      if (error instanceof AdminError) {
        throw error;
      }
      throw new AdminError('获取系统设置失败');
    }
  }

  /**
   * 更新系统设置
   */
  static async updateSystemSetting(
    settingId: string,
    value: any
  ): Promise<SystemSettings> {
    const token = this.getAdminAccessToken();
    if (!token) {
      throw new AdminError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/admin/settings/${settingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ value }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new AdminError(
          data.message || '更新系统设置失败',
          data.code,
          response.status
        );
      }

      return data.setting;
    } catch (error) {
      if (error instanceof AdminError) {
        throw error;
      }
      throw new AdminError('更新系统设置失败');
    }
  }

  /**
   * 获取安全策略
   */
  static async getSecurityPolicies(): Promise<SecurityPolicy[]> {
    const token = this.getAdminAccessToken();
    if (!token) {
      throw new AdminError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/admin/security/policies`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new AdminError(
          data.message || '获取安全策略失败',
          data.code,
          response.status
        );
      }

      return data.policies;
    } catch (error) {
      if (error instanceof AdminError) {
        throw error;
      }
      throw new AdminError('获取安全策略失败');
    }
  }

  /**
   * 更新安全策略
   */
  static async updateSecurityPolicy(
    policyId: string,
    updates: Partial<SecurityPolicy>
  ): Promise<SecurityPolicy> {
    const token = this.getAdminAccessToken();
    if (!token) {
      throw new AdminError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/admin/security/policies/${policyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new AdminError(
          data.message || '更新安全策略失败',
          data.code,
          response.status
        );
      }

      return data.policy;
    } catch (error) {
      if (error instanceof AdminError) {
        throw error;
      }
      throw new AdminError('更新安全策略失败');
    }
  }

  /**
   * 获取访问控制列表
   */
  static async getAccessControlList(): Promise<AccessControlList[]> {
    const token = this.getAdminAccessToken();
    if (!token) {
      throw new AdminError('管理员未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/admin/acl`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new AdminError(
          data.message || '获取访问控制列表失败',
          data.code,
          response.status
        );
      }

      return data.acl;
    } catch (error) {
      if (error instanceof AdminError) {
        throw error;
      }
      throw new AdminError('获取访问控制列表失败');
    }
  }

  /**
   * 保存管理员令牌
   */
  private static saveAdminTokens(session: AdminSession): void {
    localStorage.setItem(this.ADMIN_TOKEN_KEY, session.token);
    localStorage.setItem(this.ADMIN_REFRESH_TOKEN_KEY, session.refreshToken);
  }

  /**
   * 清除管理员令牌
   */
  private static clearAdminTokens(): void {
    localStorage.removeItem(this.ADMIN_TOKEN_KEY);
    localStorage.removeItem(this.ADMIN_REFRESH_TOKEN_KEY);
  }

  /**
   * 获取管理员访问令牌
   */
  static getAdminAccessToken(): string | null {
    return localStorage.getItem(this.ADMIN_TOKEN_KEY);
  }

  /**
   * 获取管理员刷新令牌
   */
  static getAdminRefreshToken(): string | null {
    return localStorage.getItem(this.ADMIN_REFRESH_TOKEN_KEY);
  }

  /**
   * 检查是否为管理员
   */
  static isAdminAuthenticated(): boolean {
    return !!this.getAdminAccessToken();
  }

  /**
   * 获取设备信息
   */
  private static getDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;

    let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
    if (/mobile/i.test(userAgent)) {
      deviceType = 'mobile';
    } else if (/tablet|ipad/i.test(userAgent)) {
      deviceType = 'tablet';
    }

    // 提取浏览器信息
    let browser = 'unknown';
    let version = 'unknown';

    if (userAgent.includes('Chrome')) {
      browser = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      if (match) version = match[1];
    } else if (userAgent.includes('Firefox')) {
      browser = 'Firefox';
      const match = userAgent.match(/Firefox\/(\d+)/);
      if (match) version = match[1];
    } else if (userAgent.includes('Safari')) {
      browser = 'Safari';
      const match = userAgent.match(/Version\/(\d+)/);
      if (match) version = match[1];
    }

    return {
      deviceId: this.generateDeviceId(),
      deviceName: `${browser} on ${platform}`,
      deviceType,
      platform,
      browser,
      version,
    };
  }

  /**
   * 生成设备ID
   */
  private static generateDeviceId(): string {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + Date.now();
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  }

  /**
   * 获取客户端IP（需要后端支持）
   */
  private static getClientIP(): string {
    // 这里可以通过API获取真实IP，或者使用代理头信息
    return 'unknown';
  }
}
/**
 * 管理员认证Hook
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AdminService, AdminUser, AdminRole, AdminLoginRequest, AdminAction } from '../services/admin';

interface UseAdminAuthOptions {
  autoRefresh?: boolean;
  refreshThreshold?: number;
  onAuthChange?: (isAuthenticated: boolean, admin: AdminUser | null) => void;
  onSessionExpiry?: () => void;
  onActivityLog?: (activity: any) => void;
}

interface UseAdminAuthReturn {
  // 认证状态
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isTwoFactorRequired: boolean;
  sessionExpiryTime: number;

  // 认证方法
  login: (credentials: AdminLoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  verifyTwoFactor: (token: string, code: string) => Promise<void>;

  // 权限检查
  hasPermission: (resource: string, action: string) => Promise<boolean>;
  hasRole: (role: AdminRole) => boolean;
  canAccess: (resource: string) => Promise<boolean>;

  // 活动记录
  logActivity: (activity: {
    action: AdminAction;
    resource: string;
    resourceId?: string;
    details?: any;
    success: boolean;
    failureReason?: string;
  }) => Promise<void>;

  // 二步验证
  setupTwoFactor: (type: any, phoneNumber?: string) => Promise<any>;
  confirmTwoFactorSetup: (verificationToken: string, code: string) => Promise<void>;
  disableTwoFactor: (password: string) => Promise<void>;

  // 状态管理
  clearError: () => void;
  checkAuthStatus: () => Promise<void>;
}

export const useAdminAuth = (options: UseAdminAuthOptions = {}): UseAdminAuthReturn => {
  const {
    autoRefresh = true,
    refreshThreshold = 5 * 60 * 1000, // 5分钟
    onAuthChange,
    onSessionExpiry,
    onActivityLog,
  } = options;

  // 状态管理
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTwoFactorRequired, setIsTwoFactorRequired] = useState(false);
  const [sessionExpiryTime, setSessionExpiryTime] = useState(0);
  const [pendingVerificationToken, setPendingVerificationToken] = useState<string | null>(null);

  // 定时器引用
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // 更新状态的辅助函数
  const updateState = useCallback((updater: Partial<UseAdminAuthReturn>) => {
    if (updater.admin !== undefined) setAdmin(updater.admin);
    if (updater.isAuthenticated !== undefined) setIsAuthenticated(updater.isAuthenticated);
    if (updater.isLoading !== undefined) setIsLoading(updater.isLoading);
    if (updater.error !== undefined) setError(updater.error);
    if (updater.isTwoFactorRequired !== undefined) setIsTwoFactorRequired(updater.isTwoFactorRequired);
    if (updater.sessionExpiryTime !== undefined) setSessionExpiryTime(updater.sessionExpiryTime);
  }, []);

  // 更新最后活动时间
  const updateLastActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 检查认证状态
  const checkAuthStatus = useCallback(async () => {
    if (!AdminService.isAdminAuthenticated()) {
      updateState({
        admin: null,
        isAuthenticated: false,
        isLoading: false,
        isTwoFactorRequired: false,
        sessionExpiryTime: 0,
      });
      return;
    }

    setIsLoading(true);
    try {
      const currentAdmin = await AdminService.getCurrentAdmin();
      updateState({
        admin: currentAdmin,
        isAuthenticated: !!currentAdmin,
        isLoading: false,
        isTwoFactorRequired: false,
      });
      onAuthChange?.(!!currentAdmin, currentAdmin);
    } catch (error) {
      updateState({
        admin: null,
        isAuthenticated: false,
        isLoading: false,
        isTwoFactorRequired: false,
        error: error instanceof Error ? error.message : '检查认证状态失败',
      });
      onAuthChange?.(false, null);
    }
  }, [updateState, onAuthChange]);

  // 管理员登录
  const login = useCallback(async (credentials: AdminLoginRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const loginResponse = await AdminService.adminLogin(credentials);

      if (loginResponse.requiresTwoFactor) {
        // 需要二步验证
        setIsTwoFactorRequired(true);
        setPendingVerificationToken(credentials.email); // 或者使用服务器返回的token
        setIsLoading(false);
        return;
      }

      // 登录成功
      updateState({
        admin: loginResponse.admin,
        isAuthenticated: true,
        isTwoFactorRequired: false,
        sessionExpiryTime: new Date(loginResponse.session.expiresAt).getTime(),
      });

      onAuthChange?.(true, loginResponse.admin);

      // 记录登录活动
      await logActivity({
        action: AdminAction.LOGIN,
        resource: 'admin_auth',
        success: true,
      });

      updateLastActivity();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '登录失败';
      updateState({
        isLoading: false,
        error: errorMessage,
      });

      // 记录登录失败活动
      await logActivity({
        action: AdminAction.LOGIN,
        resource: 'admin_auth',
        success: false,
        failureReason: errorMessage,
      });

      throw error;
    }
  }, [updateState, onAuthChange, updateLastActivity]);

  // 二步验证
  const verifyTwoFactor = useCallback(async (token: string, code: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const loginResponse = await AdminService.verifyTwoFactor(token, code);

      updateState({
        admin: loginResponse.admin,
        isAuthenticated: true,
        isTwoFactorRequired: false,
        sessionExpiryTime: new Date(loginResponse.session.expiresAt).getTime(),
      });

      onAuthChange?.(true, loginResponse.admin);

      // 记录登录成功活动
      await logActivity({
        action: AdminAction.LOGIN,
        resource: 'admin_auth',
        success: true,
      });

      updateLastActivity();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '二步验证失败';
      updateState({
        isLoading: false,
        error: errorMessage,
      });

      // 记录二步验证失败活动
      await logActivity({
        action: AdminAction.LOGIN,
        resource: 'admin_auth',
        success: false,
        failureReason: errorMessage,
      });

      throw error;
    }
  }, [updateState, onAuthChange, updateLastActivity]);

  // 管理员登出
  const logout = useCallback(async () => {
    try {
      await AdminService.adminLogout();

      // 记录登出活动
      if (isAuthenticated) {
        await logActivity({
          action: AdminAction.LOGOUT,
          resource: 'admin_auth',
          success: true,
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      updateState({
        admin: null,
        isAuthenticated: false,
        isTwoFactorRequired: false,
        sessionExpiryTime: 0,
      });

      onAuthChange?.(false, null);
    }
  }, [isAuthenticated, updateState, onAuthChange]);

  // 刷新会话
  const refreshSession = useCallback(async () => {
    try {
      await AdminService.refreshAdminToken();
      await checkAuthStatus();
    } catch (error) {
      // 刷新失败，触发会话过期
      onSessionExpiry?.();
      await logout();
    }
  }, [checkAuthStatus, logout, onSessionExpiry]);

  // 权限检查
  const hasPermission = useCallback(async (resource: string, action: string): Promise<boolean> => {
    if (!isAuthenticated || !admin) {
      return false;
    }

    try {
      return await AdminService.checkPermission({ resource, action });
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }, [isAuthenticated, admin]);

  // 角色检查
  const hasRole = useCallback((role: AdminRole): boolean => {
    return admin?.role === role;
  }, [admin]);

  // 资源访问检查
  const canAccess = useCallback(async (resource: string): Promise<boolean> => {
    return hasPermission(resource, 'read');
  }, [hasPermission]);

  // 活动记录
  const logActivity = useCallback(async (activity: {
    action: AdminAction;
    resource: string;
    resourceId?: string;
    details?: any;
    success: boolean;
    failureReason?: string;
  }) => {
    try {
      await AdminService.logActivity(activity);
      onActivityLog?.(activity);
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }, [onActivityLog]);

  // 设置二步验证
  const setupTwoFactor = useCallback(async (type: any, phoneNumber?: string) => {
    try {
      const setupResponse = await AdminService.setupTwoFactor({
        type,
        phoneNumber,
      });
      return setupResponse;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '设置二步验证失败';
      setError(errorMessage);
      throw error;
    }
  }, []);

  // 确认二步验证设置
  const confirmTwoFactorSetup = useCallback(async (verificationToken: string, code: string) => {
    try {
      await AdminService.confirmTwoFactorSetup(verificationToken, code);

      // 重新加载管理员信息以更新二步验证状态
      await checkAuthStatus();

      // 记录二步验证启用活动
      await logActivity({
        action: AdminAction.ENABLE_TWO_FACTOR,
        resource: 'admin_security',
        success: true,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '确认二步验证设置失败';
      setError(errorMessage);
      throw error;
    }
  }, [checkAuthStatus, logActivity]);

  // 禁用二步验证
  const disableTwoFactor = useCallback(async (password: string) => {
    try {
      await AdminService.disableTwoFactor(password);

      // 重新加载管理员信息以更新二步验证状态
      await checkAuthStatus();

      // 记录二步验证禁用活动
      await logActivity({
        action: AdminAction.DISABLE_TWO_FACTOR,
        resource: 'admin_security',
        success: true,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '禁用二步验证失败';
      setError(errorMessage);
      throw error;
    }
  }, [checkAuthStatus, logActivity]);

  // 自动刷新令牌
  useEffect(() => {
    if (!autoRefresh || !isAuthenticated || sessionExpiryTime === 0) {
      return;
    }

    const setupRefreshTimer = () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }

      refreshTimerRef.current = setInterval(() => {
        const now = Date.now();
        const timeUntilExpiry = sessionExpiryTime - now;

        // 如果会话在阈值时间内过期，开始刷新
        if (timeUntilExpiry > 0 && timeUntilExpiry < refreshThreshold) {
          refreshSession().catch(() => {
            // 刷新失败，会在refreshSession中处理
          });
        }
      }, 60000); // 每分钟检查一次
    };

    setupRefreshTimer();

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [autoRefresh, isAuthenticated, sessionExpiryTime, refreshThreshold, refreshSession]);

  // 活动超时检查
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const setupActivityTimer = () => {
      if (activityTimerRef.current) {
        clearInterval(activityTimerRef.current);
      }

      activityTimerRef.current = setInterval(() => {
        const now = Date.now();
        const timeSinceLastActivity = now - lastActivityRef.current;

        // 如果30分钟无活动，登出
        if (timeSinceLastActivity > 30 * 60 * 1000) {
          logout();
        }
      }, 60000); // 每分钟检查一次
    };

    setupActivityTimer();

    return () => {
      if (activityTimerRef.current) {
        clearInterval(activityTimerRef.current);
      }
    };
  }, [isAuthenticated, logout]);

  // 页面可见性变化时的处理
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateLastActivity();
        if (isAuthenticated) {
          checkAuthStatus().catch(() => {
            // 检查失败，可能需要重新登录
          });
        }
      }
    };

    const handleActivity = () => {
      updateLastActivity();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('click', handleActivity);
    document.addEventListener('keydown', handleActivity);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('click', handleActivity);
      document.removeEventListener('keydown', handleActivity);
    };
  }, [isAuthenticated, checkAuthStatus, updateLastActivity]);

  // 初始化时检查认证状态
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
      if (activityTimerRef.current) {
        clearInterval(activityTimerRef.current);
      }
    };
  }, []);

  return {
    // 状态
    admin,
    isAuthenticated,
    isLoading,
    error,
    isTwoFactorRequired,
    sessionExpiryTime,

    // 方法
    login,
    logout,
    refreshSession,
    verifyTwoFactor,
    hasPermission,
    hasRole,
    canAccess,
    logActivity,
    setupTwoFactor,
    confirmTwoFactorSetup,
    disableTwoFactor,
    clearError,
    checkAuthStatus,
  };
};

/**
 * 权限守卫Hook
 */
export const useAdminPermissionGuard = (requiredPermissions: Array<{
  resource: string;
  action: string;
}>) => {
  const { isAuthenticated, hasPermission } = useAdminAuth();
  const [hasAllPermissions, setHasAllPermissions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!isAuthenticated) {
        setHasAllPermissions(false);
        setIsLoading(false);
        return;
      }

      try {
        const permissionChecks = await Promise.all(
          requiredPermissions.map(({ resource, action }) =>
            hasPermission(resource, action)
          )
        );

        setHasAllPermissions(permissionChecks.every(Boolean));
      } catch (error) {
        setHasAllPermissions(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPermissions();
  }, [isAuthenticated, hasPermission, requiredPermissions]);

  return {
    hasPermission: hasAllPermissions,
    isLoading,
  };
};

/**
 * 角色守卫Hook
 */
export const useAdminRoleGuard = (requiredRoles: AdminRole[]) => {
  const { admin, isAuthenticated } = useAdminAuth();

  const hasRequiredRole = isAuthenticated && admin && requiredRoles.includes(admin.role);

  return {
    hasRole: hasRequiredRole,
    userRole: admin?.role,
    isAuthenticated,
  };
};

/**
 * 管理员活动记录Hook
 */
export const useAdminActivityLog = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async (options?: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const { logs: activityLogs } = await AdminService.getAdminActivityLogs(options);
      setLogs(activityLogs);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载活动日志失败';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return {
    logs,
    isLoading,
    error,
    loadLogs,
  };
};
/**
 * 认证相关的自定义Hook
 */

import { useCallback, useEffect, useRef } from 'react';
import { AuthService, User, LoginRequest, RegisterRequest, PasswordChangeRequest } from '../services/auth';
import { AuthState, AuthActions, AuthStatus } from '../types/auth';

interface UseAuthOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  onAuthChange?: (isAuthenticated: boolean, user: User | null) => void;
  onError?: (error: Error) => void;
}

interface UseAuthReturn extends AuthState, AuthActions {
  isAuthenticated: boolean;
  isAdmin: boolean;
  status: AuthStatus;
  tokenRemainingTime: number;
  forceRefresh: () => Promise<void>;
}

/**
 * 认证Hook - 提供完整的认证状态管理
 */
export const useAuth = (options: UseAuthOptions = {}): UseAuthReturn => {
  const {
    autoRefresh = true,
    refreshInterval = 5 * 60 * 1000, // 5分钟
    onAuthChange,
    onError,
  } = options;

  // 使用ref来避免闭包问题
  const stateRef = useRef<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    lastActivity: Date.now(),
  });

  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const subscribers = useRef<Set<(state: AuthState) => void>>(new Set());

  // 状态管理
  const setState = useCallback((updater: Partial<AuthState>) => {
    const newState = { ...stateRef.current, ...updater };
    stateRef.current = newState;

    // 通知所有订阅者
    subscribers.current.forEach(callback => callback(newState));

    // 触发回调
    if (onAuthChange && updater.isAuthenticated !== undefined) {
      onAuthChange(newState.isAuthenticated, newState.user);
    }
  }, [onAuthChange]);

  // 订阅状态变化
  const subscribe = useCallback((callback: (state: AuthState) => void) => {
    subscribers.current.add(callback);
    return () => {
      subscribers.current.delete(callback);
    };
  }, []);

  // 获取当前状态
  const getState = useCallback((): AuthState => {
    return { ...stateRef.current };
  }, []);

  // 清除错误
  const clearError = useCallback(() => {
    setState({ error: null });
  }, [setState]);

  // 用户登录
  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    setState({ isLoading: true, error: null });

    try {
      const response = await AuthService.login({ email, password, rememberMe });
      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        lastActivity: Date.now(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '登录失败';
      setState({ isLoading: false, error: errorMessage });

      if (onError) {
        onError(error as Error);
      }
      throw error;
    }
  }, [setState, onError]);

  // 用户注册
  const register = useCallback(async (userData: RegisterRequest) => {
    setState({ isLoading: true, error: null });

    try {
      const response = await AuthService.register(userData);
      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        lastActivity: Date.now(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '注册失败';
      setState({ isLoading: false, error: errorMessage });

      if (onError) {
        onError(error as Error);
      }
      throw error;
    }
  }, [setState, onError]);

  // 用户登出
  const logout = useCallback(async () => {
    try {
      await AuthService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, [setState]);

  // 检查认证状态
  const checkAuth = useCallback(async () => {
    if (!AuthService.isAuthenticated()) {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return;
    }

    setState({ isLoading: true, error: null });

    try {
      const user = await AuthService.getCurrentUser();
      setState({
        user,
        isAuthenticated: !!user,
        isLoading: false,
        error: null,
        lastActivity: Date.now(),
      });
    } catch (error) {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, [setState]);

  // 刷新令牌
  const refreshToken = useCallback(async () => {
    try {
      await AuthService.refreshToken();
      // 刷新成功后更新用户信息
      await checkAuth();
    } catch (error) {
      setState({
        user: null,
        isAuthenticated: false,
        error: null,
      });

      if (onError) {
        onError(error as Error);
      }
    }
  }, [setState, checkAuth, onError]);

  // 强制刷新
  const forceRefresh = useCallback(async () => {
    await refreshToken();
  }, [refreshToken]);

  // 更新用户信息
  const updateUser = useCallback(async (updates: Partial<User>) => {
    setState({ isLoading: true, error: null });

    try {
      const updatedUser = await AuthService.updateProfile(updates);
      setState({
        user: updatedUser,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新失败';
      setState({ isLoading: false, error: errorMessage });

      if (onError) {
        onError(error as Error);
      }
      throw error;
    }
  }, [setState, onError]);

  // 修改密码
  const changePassword = useCallback(async (passwordData: PasswordChangeRequest) => {
    setState({ isLoading: true, error: null });

    try {
      await AuthService.changePassword(passwordData);
      setState({ isLoading: false, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '密码修改失败';
      setState({ isLoading: false, error: errorMessage });

      if (onError) {
        onError(error as Error);
      }
      throw error;
    }
  }, [setState, onError]);

  // 自动刷新令牌
  useEffect(() => {
    if (!autoRefresh) {
      return;
    }

    const setupRefreshTimer = () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }

      refreshTimerRef.current = setInterval(() => {
        const remainingTime = AuthService.getTokenRemainingTime();

        // 如果令牌在10分钟内过期，开始刷新
        if (remainingTime > 0 && remainingTime < 600) {
          refreshToken().catch(() => {
            // 刷新失败，静默处理
          });
        }
      }, refreshInterval);
    };

    if (AuthService.isAuthenticated()) {
      setupRefreshTimer();
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, refreshToken]);

  // 页面可见性变化时的处理
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAuth().catch(() => {
          // 检查失败，静默处理
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkAuth]);

  // 初始化时检查认证状态
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 计算派生状态
  const currentState = getState();
  const isAuthenticated = currentState.isAuthenticated;
  const isAdmin = currentState.user?.role === 'admin';
  const status = currentState.isLoading
    ? AuthStatus.LOADING
    : currentState.error
      ? AuthStatus.ERROR
      : AuthStatus.SUCCESS;
  const tokenRemainingTime = AuthService.getTokenRemainingTime();

  // 返回Hook接口
  return {
    // 状态
    user: currentState.user,
    isAuthenticated,
    isLoading: currentState.isLoading,
    error: currentState.error,
    isAdmin,
    status,
    tokenRemainingTime,
    lastActivity: currentState.lastActivity,

    // 方法
    login,
    register,
    logout,
    checkAuth,
    refreshToken,
    clearError,
    updateUser,
    changePassword,
    forceRefresh,

    // 内部方法（用于调试）
    subscribe,
    getState,
  };
};

/**
 * 认证状态监听Hook
 */
export const useAuthState = () => {
  const auth = useAuth();
  return {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    error: auth.error,
    status: auth.status,
  };
};

/**
 * 权限检查Hook
 */
export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = useCallback((permission: string) => {
    if (!user) return false;

    const userPermissions = user.role === 'admin'
      ? ['read', 'write', 'admin']
      : ['read', 'write'];

    return userPermissions.includes(permission);
  }, [user]);

  const canAccess = useCallback((resource: string) => {
    if (!user) return false;

    // 管理员可以访问所有资源
    if (user.role === 'admin') return true;

    // 普通用户的资源访问权限
    const allowedResources = ['chat', 'profile', 'history', 'documents'];
    return allowedResources.includes(resource);
  }, [user]);

  return {
    user,
    hasPermission,
    canAccess,
    isAdmin: user?.role === 'admin',
    isUser: user?.role === 'user',
  };
};

/**
 * 安全导航Hook - 需要认证的路由保护
 */
export const useRequireAuth = (redirectTo = '/auth/login') => {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      window.location.href = redirectTo;
    }
  }, [auth.isAuthenticated, auth.isLoading, redirectTo]);

  return auth;
};

/**
 * 管理员权限Hook
 */
export const useRequireAdmin = (redirectTo = '/') => {
  const auth = useRequireAuth(redirectTo);

  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated && !auth.isAdmin) {
      window.location.href = redirectTo;
    }
  }, [auth.isAuthenticated, auth.isAdmin, auth.isLoading, redirectTo]);

  return auth;
};
/**
 * 用户个人资料Hook
 */

import { useCallback, useEffect, useState } from 'react';
import { UserService, UserProfile, UserSettings, UserStatistics } from '../services/user';
import { AuthService } from '../services/auth';

interface UseUserProfileOptions {
  autoLoad?: boolean;
  onError?: (error: Error) => void;
  onUpdate?: (profile: UserProfile) => void;
}

interface UseUserProfileReturn {
  profile: UserProfile | null;
  settings: UserSettings | null;
  statistics: UserStatistics | null;
  isLoading: boolean;
  error: string | null;

  // 操作方法
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  refreshProfile: () => Promise<void>;

  // 状态检查
  hasProfile: boolean;
  isComplete: boolean;
  completionPercentage: number;
}

export const useUserProfile = (options: UseUserProfileOptions = {}): UseUserProfileReturn => {
  const {
    autoLoad = true,
    onError,
    onUpdate,
  } = options;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载用户资料
  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const userProfile = await UserService.getProfile();
      setProfile(userProfile);
      setSettings(userProfile.settings);
      setStatistics(userProfile.statistics);
      onUpdate?.(userProfile);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载用户资料失败';
      setError(errorMessage);
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [onUpdate, onError]);

  // 更新用户资料
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    setIsLoading(true);
    setError(null);

    try {
      const updatedProfile = await UserService.updateProfile(updates);
      setProfile(updatedProfile);
      setSettings(updatedProfile.settings);
      setStatistics(updatedProfile.statistics);
      onUpdate?.(updatedProfile);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新用户资料失败';
      setError(errorMessage);
      onError?.(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [onUpdate, onError]);

  // 更新用户设置
  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    setIsLoading(true);
    setError(null);

    try {
      const updatedSettings = await UserService.updateSettings(updates);
      setSettings(updatedSettings);

      // 同时更新profile中的settings
      if (profile) {
        const updatedProfile = { ...profile, settings: updatedSettings };
        setProfile(updatedProfile);
        onUpdate?.(updatedProfile);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新设置失败';
      setError(errorMessage);
      onError?.(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [profile, onUpdate, onError]);

  // 上传头像
  const uploadAvatar = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const avatarUrl = await UserService.uploadAvatar(file);

      if (profile) {
        const updatedProfile = { ...profile, avatar: avatarUrl };
        setProfile(updatedProfile);
        onUpdate?.(updatedProfile);
      }

      return avatarUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '上传头像失败';
      setError(errorMessage);
      onError?.(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [profile, onUpdate, onError]);

  // 刷新资料
  const refreshProfile = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  // 检查资料完整性
  const hasProfile = !!profile;
  const isComplete = profile ?
    !!(profile.nickname && profile.email && profile.bio) : false;

  const completionPercentage = profile ? {
    nickname: profile.nickname ? 20 : 0,
    bio: profile.bio ? 20 : 0,
    avatar: profile.avatar ? 20 : 0,
    location: profile.location ? 10 : 0,
    website: profile.website ? 10 : 0,
    socialLinks: profile.socialLinks && Object.keys(profile.socialLinks).length > 0 ? 10 : 0,
    settings: settings ? 10 : 0,
  } : {};

  const totalCompletion = Object.values(completionPercentage).reduce((sum, value) => sum + value, 0);

  useEffect(() => {
    if (autoLoad) {
      loadProfile();
    }
  }, [autoLoad, loadProfile]);

  return {
    profile,
    settings,
    statistics,
    isLoading,
    error,
    updateProfile,
    updateSettings,
    uploadAvatar,
    refreshProfile,
    hasProfile,
    isComplete,
    completionPercentage: totalCompletion,
  };
};

/**
 * 用户设置Hook
 */
export const useUserSettings = () => {
  const { settings, updateSettings, isLoading, error } = useUserProfile();

  // 快捷设置方法
  const updateTheme = useCallback((theme: 'light' | 'dark' | 'auto') => {
    return updateSettings({ theme });
  }, [updateSettings]);

  const updateLanguage = useCallback((language: 'zh-CN' | 'en-US') => {
    return updateSettings({ language });
  }, [updateSettings]);

  const updateNotifications = useCallback((notifications: any) => {
    return updateSettings({ notifications });
  }, [updateSettings]);

  const updatePrivacy = useCallback((privacy: any) => {
    return updateSettings({ privacy });
  }, [updateSettings]);

  const updateChatSettings = useCallback((chat: any) => {
    return updateSettings({ chat });
  }, [updateSettings]);

  const updateAccessibility = useCallback((accessibility: any) => {
    return updateSettings({ accessibility });
  }, [updateSettings]);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    updateTheme,
    updateLanguage,
    updateNotifications,
    updatePrivacy,
    updateChatSettings,
    updateAccessibility,
  };
};

/**
 * 用户统计Hook
 */
export const useUserStatistics = (options?: {
  dateRange?: {
    start: string;
    end: string;
  };
  autoRefresh?: boolean;
  refreshInterval?: number;
}) => {
  const { statistics, isLoading, error } = useUserProfile();
  const [dateRange, setDateRange] = useState(options?.dateRange);

  // 刷新统计数据
  const refreshStatistics = useCallback(async () => {
    try {
      const newStatistics = await UserService.getStatistics({ dateRange });
      // 这里需要通过某种方式更新父组件的statistics
    } catch (error) {
      console.error('Failed to refresh statistics:', error);
    }
  }, [dateRange]);

  // 自动刷新
  useEffect(() => {
    if (!options?.autoRefresh) return;

    const interval = setInterval(refreshStatistics, options.refreshInterval || 60000);
    return () => clearInterval(interval);
  }, [options?.autoRefresh, options?.refreshInterval, refreshStatistics]);

  return {
    statistics,
    isLoading,
    error,
    refreshStatistics,
    setDateRange,
  };
};

/**
 * 活动记录Hook
 */
export const useUserActivity = (options?: {
  limit?: number;
  autoLoad?: boolean;
}) => {
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadActivities = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { logs } = await UserService.getActivityLog({
        limit: options?.limit || 50,
      });
      setActivities(logs);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载活动记录失败';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [options?.limit]);

  useEffect(() => {
    if (options?.autoLoad !== false) {
      loadActivities();
    }
  }, [loadActivities, options?.autoLoad]);

  return {
    activities,
    isLoading,
    error,
    loadActivities,
  };
};

/**
 * 用户反馈Hook
 */
export const useUserFeedback = () => {
  const [feedback, setFeedback] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitFeedback = useCallback(async (feedbackData: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const newFeedback = await UserService.submitFeedback(feedbackData);
      setFeedback(prev => [newFeedback, ...prev]);
      return newFeedback;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '提交反馈失败';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadFeedback = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { feedback: feedbackList } = await UserService.getFeedbackList();
      setFeedback(feedbackList);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载反馈失败';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  return {
    feedback,
    isLoading,
    error,
    submitFeedback,
    loadFeedback,
  };
};

/**
 * 数据管理Hook
 */
export const useUserDataManagement = () => {
  const [exportRequests, setExportRequests] = useState<any[]>([]);
  const [storageUsage, setStorageUsage] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 请求数据导出
  const requestExport = useCallback(async (exportOptions: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const exportRequest = await UserService.requestExport(exportOptions);
      setExportRequests(prev => [exportRequest, ...prev]);
      return exportRequest;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建导出请求失败';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 获取存储使用情况
  const loadStorageUsage = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const usage = await UserService.getStorageUsage();
      setStorageUsage(usage);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取存储使用情况失败';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 删除用户数据
  const deleteUserData = useCallback(async (options: any) => {
    setIsLoading(true);
    setError(null);

    try {
      await UserService.deleteUserData(options);
      // 删除成功后刷新数据
      await loadStorageUsage();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除数据失败';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadStorageUsage]);

  useEffect(() => {
    loadStorageUsage();
  }, [loadStorageUsage]);

  return {
    exportRequests,
    storageUsage,
    isLoading,
    error,
    requestExport,
    loadStorageUsage,
    deleteUserData,
  };
};
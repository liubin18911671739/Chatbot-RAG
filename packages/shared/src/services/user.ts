/**
 * 用户服务 - 处理用户资料、偏好设置、使用统计等功能
 */

import { AuthService, User, UserPreferences } from './auth';

export interface UserProfile extends User {
  bio?: string;
  location?: string;
  website?: string;
  socialLinks?: SocialLinks;
  statistics: UserStatistics;
  settings: UserSettings;
}

export interface SocialLinks {
  github?: string;
  linkedin?: string;
  twitter?: string;
  wechat?: string;
  qq?: string;
}

export interface UserStatistics {
  totalMessages: number;
  totalConversations: number;
  totalTokensUsed: number;
  averageMessagesPerDay: number;
  mostActiveHour: number;
  favoriteKnowledgeBase?: string;
  joinDate: string;
  lastActiveDate: string;
  streakDays: number;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'zh-CN' | 'en-US';
  timezone: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  chat: ChatSettings;
  accessibility: AccessibilitySettings;
  data: DataSettings;
}

export interface NotificationSettings {
  email: {
    enabled: boolean;
    messageNotifications: boolean;
    systemUpdates: boolean;
    securityAlerts: boolean;
    weeklyDigest: boolean;
  };
  browser: {
    enabled: boolean;
    soundEnabled: boolean;
    desktopNotifications: boolean;
    messagePreview: boolean;
  };
  frequency: 'instant' | 'hourly' | 'daily' | 'weekly';
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  activityVisibility: 'public' | 'friends' | 'private';
  showOnlineStatus: boolean;
  allowDataCollection: boolean;
  allowAnalytics: boolean;
  deleteConversationData: boolean;
  retentionDays: number;
}

export interface ChatSettings {
  fontSize: 'small' | 'medium' | 'large';
  fontFamily: string;
  messageStyle: 'bubble' | 'plain';
  showTimestamps: boolean;
  showAvatars: boolean;
  showSources: boolean;
  autoSaveHistory: boolean;
  streamResponses: boolean;
  defaultKnowledgeBase: string | null;
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  topK: number;
  similarityThreshold: number;
  customInstructions: string;
}

export interface AccessibilitySettings {
  highContrast: boolean;
  reduceMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusVisible: boolean;
  textToSpeech: boolean;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
}

export interface DataSettings {
  exportFormat: 'json' | 'csv' | 'pdf';
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  lastBackupDate?: string;
  storageUsage: StorageUsage;
}

export interface StorageUsage {
  totalMessages: number;
  totalConversations: number;
  totalDocuments: number;
  totalSize: number;
  breakdown: {
    messages: number;
    conversations: number;
    documents: number;
    cache: number;
  };
}

export interface ActivityLog {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  metadata?: any;
}

export enum ActivityType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  MESSAGE_SENT = 'message_sent',
  CONVERSATION_CREATED = 'conversation_created',
  CONVERSATION_DELETED = 'conversation_deleted',
  PROFILE_UPDATED = 'profile_updated',
  PASSWORD_CHANGED = 'password_changed',
  SETTINGS_UPDATED = 'settings_updated',
  DOCUMENT_UPLOADED = 'document_uploaded',
  KNOWLEDGE_BASE_ACCESSED = 'knowledge_base_accessed',
  DATA_EXPORTED = 'data_exported',
  DATA_IMPORTED = 'data_imported',
  SECURITY_ALERT = 'security_alert',
}

export interface UserActivity {
  dailyStats: DailyActivityStats[];
  weeklyStats: WeeklyActivityStats[];
  monthlyStats: MonthlyActivityStats[];
  knowledgeBaseUsage: KnowledgeBaseUsage[];
  topicInterests: TopicInterest[];
}

export interface DailyActivityStats {
  date: string;
  messagesCount: number;
  conversationsCreated: number;
  timeSpent: number;
  knowledgeBasesAccessed: string[];
  topTopics: string[];
}

export interface WeeklyActivityStats {
  weekStart: string;
  messagesCount: number;
  conversationsCreated: number;
  timeSpent: number;
  activeDays: number;
  mostActiveDay: string;
}

export interface MonthlyActivityStats {
  month: string;
  messagesCount: number;
  conversationsCreated: number;
  timeSpent: number;
  averageDailyMessages: number;
  growthRate: number;
}

export interface KnowledgeBaseUsage {
  knowledgeBaseId: string;
  knowledgeBaseName: string;
  accessCount: number;
  totalMessages: number;
  averageResponseTime: number;
  lastAccessDate: string;
  favoriteScore: number;
}

export interface TopicInterest {
  topic: string;
  frequency: number;
  confidence: number;
  relatedTopics: string[];
  lastDiscussed: string;
}

export interface UserFeedback {
  id: string;
  type: 'bug' | 'feature' | 'improvement' | 'general';
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  responses: FeedbackResponse[];
  attachments: string[];
}

export interface FeedbackResponse {
  id: string;
  content: string;
  author: 'user' | 'support';
  createdAt: string;
  isInternal: boolean;
}

export interface DataExportRequest {
  id: string;
  type: 'full' | 'conversations' | 'profile' | 'settings' | 'statistics';
  format: 'json' | 'csv' | 'pdf';
  dateRange?: {
    start: string;
    end: string;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
  expiresAt?: string;
}

export interface UserImportRequest {
  id: string;
  type: 'conversations' | 'profile' | 'settings';
  format: 'json' | 'csv';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  summary?: ImportSummary;
  errors?: ImportError[];
}

export interface ImportSummary {
  totalRecords: number;
  importedRecords: number;
  skippedRecords: number;
  errorRecords: number;
}

export interface ImportError {
  record: number;
  field: string;
  message: string;
  data: any;
}

class UserError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message);
    this.name = 'UserError';
  }
}

export class UserService {
  private static readonly API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  /**
   * 获取用户完整资料
   */
  static async getProfile(): Promise<UserProfile> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new UserError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new UserError(
          data.message || '获取用户资料失败',
          data.code,
          response.status
        );
      }

      return {
        ...data.user,
        statistics: data.statistics || {},
        settings: data.settings || {},
      };
    } catch (error) {
      if (error instanceof UserError) {
        throw error;
      }
      throw new UserError('获取用户资料失败');
    }
  }

  /**
   * 更新用户资料
   */
  static async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new UserError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new UserError(
          data.message || '更新用户资料失败',
          data.code,
          response.status
        );
      }

      return {
        ...data.user,
        statistics: data.statistics || {},
        settings: data.settings || {},
      };
    } catch (error) {
      if (error instanceof UserError) {
        throw error;
      }
      throw new UserError('更新用户资料失败');
    }
  }

  /**
   * 上传头像
   */
  static async uploadAvatar(file: File): Promise<string> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new UserError('用户未登录', 'NOT_AUTHENTICATED');
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await fetch(`${this.API_BASE}/api/user/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new UserError(
          data.message || '上传头像失败',
          data.code,
          response.status
        );
      }

      return data.avatarUrl;
    } catch (error) {
      if (error instanceof UserError) {
        throw error;
      }
      throw new UserError('上传头像失败');
    }
  }

  /**
   * 更新用户设置
   */
  static async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new UserError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/user/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new UserError(
          data.message || '更新设置失败',
          data.code,
          response.status
        );
      }

      return data.settings;
    } catch (error) {
      if (error instanceof UserError) {
        throw error;
      }
      throw new UserError('更新设置失败');
    }
  }

  /**
   * 获取用户统计信息
   */
  static async getStatistics(options?: {
    dateRange?: {
      start: string;
      end: string;
    };
  }): Promise<UserStatistics> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new UserError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const params = new URLSearchParams();
      if (options?.dateRange) {
        params.append('start_date', options.dateRange.start);
        params.append('end_date', options.dateRange.end);
      }

      const response = await fetch(`${this.API_BASE}/api/user/statistics?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new UserError(
          data.message || '获取统计信息失败',
          data.code,
          response.status
        );
      }

      return data.statistics;
    } catch (error) {
      if (error instanceof UserError) {
        throw error;
      }
      throw new UserError('获取统计信息失败');
    }
  }

  /**
   * 获取用户活动记录
   */
  static async getActivityLog(options?: {
    limit?: number;
    offset?: number;
    type?: ActivityType;
    dateRange?: {
      start: string;
      end: string;
    };
  }): Promise<{ logs: ActivityLog[]; total: number }> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new UserError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());
      if (options?.type) params.append('type', options.type);
      if (options?.dateRange) {
        params.append('start_date', options.dateRange.start);
        params.append('end_date', options.dateRange.end);
      }

      const response = await fetch(`${this.API_BASE}/api/user/activity?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new UserError(
          data.message || '获取活动记录失败',
          data.code,
          response.status
        );
      }

      return {
        logs: data.logs,
        total: data.total,
      };
    } catch (error) {
      if (error instanceof UserError) {
        throw error;
      }
      throw new UserError('获取活动记录失败');
    }
  }

  /**
   * 获取用户活动分析
   */
  static async getActivityAnalysis(options?: {
    period: 'week' | 'month' | 'quarter' | 'year';
  }): Promise<UserActivity> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new UserError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const params = new URLSearchParams();
      if (options?.period) params.append('period', options.period);

      const response = await fetch(`${this.API_BASE}/api/user/activity/analysis?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new UserError(
          data.message || '获取活动分析失败',
          data.code,
          response.status
        );
      }

      return data.activity;
    } catch (error) {
      if (error instanceof UserError) {
        throw error;
      }
      throw new UserError('获取活动分析失败');
    }
  }

  /**
   * 提交用户反馈
   */
  static async submitFeedback(feedback: {
    type: 'bug' | 'feature' | 'improvement' | 'general';
    title: string;
    description: string;
    category: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    attachments?: File[];
  }): Promise<UserFeedback> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new UserError('用户未登录', 'NOT_AUTHENTICATED');
    }

    const formData = new FormData();
    formData.append('type', feedback.type);
    formData.append('title', feedback.title);
    formData.append('description', feedback.description);
    formData.append('category', feedback.category);
    if (feedback.priority) {
      formData.append('priority', feedback.priority);
    }

    if (feedback.attachments) {
      feedback.attachments.forEach((file, index) => {
        formData.append(`attachment_${index}`, file);
      });
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/user/feedback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new UserError(
          data.message || '提交反馈失败',
          data.code,
          response.status
        );
      }

      return data.feedback;
    } catch (error) {
      if (error instanceof UserError) {
        throw error;
      }
      throw new UserError('提交反馈失败');
    }
  }

  /**
   * 获取用户反馈列表
   */
  static async getFeedbackList(options?: {
    limit?: number;
    offset?: number;
    status?: 'open' | 'in_progress' | 'resolved' | 'closed';
    type?: 'bug' | 'feature' | 'improvement' | 'general';
  }): Promise<{ feedback: UserFeedback[]; total: number }> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new UserError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());
      if (options?.status) params.append('status', options.status);
      if (options?.type) params.append('type', options.type);

      const response = await fetch(`${this.API_BASE}/api/user/feedback?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new UserError(
          data.message || '获取反馈列表失败',
          data.code,
          response.status
        );
      }

      return {
        feedback: data.feedback,
        total: data.total,
      };
    } catch (error) {
      if (error instanceof UserError) {
        throw error;
      }
      throw new UserError('获取反馈列表失败');
    }
  }

  /**
   * 请求数据导出
   */
  static async requestExport(request: {
    type: 'full' | 'conversations' | 'profile' | 'settings' | 'statistics';
    format: 'json' | 'csv' | 'pdf';
    dateRange?: {
      start: string;
      end: string;
    };
  }): Promise<DataExportRequest> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new UserError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/user/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new UserError(
          data.message || '创建导出请求失败',
          data.code,
          response.status
        );
      }

      return data.exportRequest;
    } catch (error) {
      if (error instanceof UserError) {
        throw error;
      }
      throw new UserError('创建导出请求失败');
    }
  }

  /**
   * 获取导出请求列表
   */
  static async getExportRequests(): Promise<DataExportRequest[]> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new UserError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/user/exports`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new UserError(
          data.message || '获取导出请求失败',
          data.code,
          response.status
        );
      }

      return data.exports;
    } catch (error) {
      if (error instanceof UserError) {
        throw error;
      }
      throw new UserError('获取导出请求失败');
    }
  }

  /**
   * 下载导出文件
   */
  static async downloadExport(exportId: string): Promise<Blob> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new UserError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/user/export/${exportId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new UserError(
          data.message || '下载导出文件失败',
          data.code,
          response.status
        );
      }

      return response.blob();
    } catch (error) {
      if (error instanceof UserError) {
        throw error;
      }
      throw new UserError('下载导出文件失败');
    }
  }

  /**
   * 导入用户数据
   */
  static async importData(file: File, type: 'conversations' | 'profile' | 'settings'): Promise<UserImportRequest> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new UserError('用户未登录', 'NOT_AUTHENTICATED');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      const response = await fetch(`${this.API_BASE}/api/user/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new UserError(
          data.message || '导入数据失败',
          data.code,
          response.status
        );
      }

      return data.importRequest;
    } catch (error) {
      if (error instanceof UserError) {
        throw error;
      }
      throw new UserError('导入数据失败');
    }
  }

  /**
   * 获取存储使用情况
   */
  static async getStorageUsage(): Promise<StorageUsage> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new UserError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/user/storage`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new UserError(
          data.message || '获取存储使用情况失败',
          data.code,
          response.status
        );
      }

      return data.storageUsage;
    } catch (error) {
      if (error instanceof UserError) {
        throw error;
      }
      throw new UserError('获取存储使用情况失败');
    }
  }

  /**
   * 删除用户数据
   */
  static async deleteUserData(options: {
    type: 'conversations' | 'profile' | 'settings' | 'all';
    confirmation: string;
  }): Promise<void> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new UserError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/user/data`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new UserError(
          data.message || '删除用户数据失败',
          data.code,
          response.status
        );
      }
    } catch (error) {
      if (error instanceof UserError) {
        throw error;
      }
      throw new UserError('删除用户数据失败');
    }
  }

  /**
   * 注销账户
   */
  static async deleteAccount(options: {
    password: string;
    confirmation: string;
    reason?: string;
  }): Promise<void> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new UserError('用户未登录', 'NOT_AUTHENTICATED');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/user/account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new UserError(
          data.message || '注销账户失败',
          data.code,
          response.status
        );
      }

      // 注销成功后清理本地数据
      AuthService.logout();
    } catch (error) {
      if (error instanceof UserError) {
        throw error;
      }
      throw new UserError('注销账户失败');
    }
  }
}
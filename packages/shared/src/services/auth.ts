/**
 * 认证服务 - 处理用户登录、注册、JWT令牌管理
 * 替换原有的RADIUS认证系统，使用邮箱注册认证
 */

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  nickname?: string;
  acceptTerms: boolean;
}

export interface User {
  id: string;
  email: string;
  nickname: string;
  avatar?: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive' | 'banned';
  createdAt: string;
  lastLoginAt?: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'zh-CN' | 'en-US';
  notifications: {
    email: boolean;
    browser: boolean;
  };
  chat: {
    fontSize: 'small' | 'medium' | 'large';
    autoSaveHistory: boolean;
    showTimestamps: boolean;
  };
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

class AuthError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export class AuthService {
  private static readonly API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  private static readonly TOKEN_KEY = 'rag_auth_tokens';
  private static readonly USER_KEY = 'rag_current_user';
  private static readonly REFRESH_THRESHOLD = 5 * 60 * 1000; // 5分钟

  /**
   * 用户登录
   */
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new AuthError(
          data.message || '登录失败',
          data.code,
          response.status
        );
      }

      // 保存认证信息
      this.saveAuthData(data);

      return data;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('网络连接失败，请检查网络设置');
    }
  }

  /**
   * 用户注册
   */
  static async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      // 验证密码一致性
      if (userData.password !== userData.confirmPassword) {
        throw new AuthError('两次输入的密码不一致', 'PASSWORD_MISMATCH');
      }

      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        throw new AuthError('请输入有效的邮箱地址', 'INVALID_EMAIL');
      }

      // 验证密码强度
      if (userData.password.length < 8) {
        throw new AuthError('密码长度至少为8位', 'PASSWORD_TOO_SHORT');
      }

      const response = await fetch(`${this.API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          nickname: userData.nickname || userData.email.split('@')[0],
          acceptTerms: userData.acceptTerms,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new AuthError(
          data.message || '注册失败',
          data.code,
          response.status
        );
      }

      // 自动登录
      this.saveAuthData(data);

      return data;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('注册失败，请稍后重试');
    }
  }

  /**
   * 登出
   */
  static async logout(): Promise<void> {
    try {
      const tokens = this.getTokens();
      if (tokens?.accessToken) {
        // 通知服务器登出
        await fetch(`${this.API_BASE}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
          },
        }).catch(() => {
          // 即使请求失败也继续清理本地数据
        });
      }
    } finally {
      this.clearAuthData();
    }
  }

  /**
   * 刷新访问令牌
   */
  static async refreshToken(): Promise<AuthTokens> {
    const tokens = this.getTokens();

    if (!tokens?.refreshToken) {
      throw new AuthError('未找到刷新令牌', 'NO_REFRESH_TOKEN');
    }

    try {
      const response = await fetch(`${this.API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: tokens.refreshToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new AuthError(
          data.message || '令牌刷新失败',
          data.code,
          response.status
        );
      }

      // 更新令牌
      this.saveTokens(data);

      return data;
    } catch (error) {
      // 刷新失败，清除本地数据
      this.clearAuthData();
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('令牌刷新失败，请重新登录');
    }
  }

  /**
   * 获取当前用户信息
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const token = this.getAccessToken();
      if (!token) {
        return null;
      }

      const response = await fetch(`${this.API_BASE}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // 令牌可能过期，尝试刷新
          try {
            await this.refreshToken();
            return this.getCurrentUser();
          } catch {
            this.clearAuthData();
            return null;
          }
        }
        throw new AuthError('获取用户信息失败', 'GET_USER_FAILED');
      }

      const user = await response.json();
      this.saveUser(user);

      return user;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      return null;
    }
  }

  /**
   * 请求密码重置
   */
  static async requestPasswordReset(email: string): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE}/api/auth/password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new AuthError(
          data.message || '密码重置请求失败',
          data.code,
          response.status
        );
      }
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('密码重置请求失败，请稍后重试');
    }
  }

  /**
   * 确认密码重置
   */
  static async confirmPasswordReset(resetData: PasswordResetConfirm): Promise<void> {
    try {
      if (resetData.newPassword !== resetData.confirmPassword) {
        throw new AuthError('两次输入的密码不一致', 'PASSWORD_MISMATCH');
      }

      const response = await fetch(`${this.API_BASE}/api/auth/password-reset/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: resetData.token,
          newPassword: resetData.newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new AuthError(
          data.message || '密码重置失败',
          data.code,
          response.status
        );
      }
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('密码重置失败，请稍后重试');
    }
  }

  /**
   * 修改密码
   */
  static async changePassword(passwordData: PasswordChangeRequest): Promise<void> {
    try {
      const token = this.getAccessToken();
      if (!token) {
        throw new AuthError('用户未登录', 'NOT_AUTHENTICATED');
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new AuthError('两次输入的密码不一致', 'PASSWORD_MISMATCH');
      }

      const response = await fetch(`${this.API_BASE}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new AuthError(
          data.message || '密码修改失败',
          data.code,
          response.status
        );
      }
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('密码修改失败，请稍后重试');
    }
  }

  /**
   * 更新用户资料
   */
  static async updateProfile(updates: Partial<User>): Promise<User> {
    try {
      const token = this.getAccessToken();
      if (!token) {
        throw new AuthError('用户未登录', 'NOT_AUTHENTICATED');
      }

      const response = await fetch(`${this.API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new AuthError(
          data.message || '资料更新失败',
          data.code,
          response.status
        );
      }

      this.saveUser(data);
      return data;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('资料更新失败，请稍后重试');
    }
  }

  /**
   * 获取访问令牌
   */
  static getAccessToken(): string | null {
    const tokens = this.getTokens();
    if (!tokens) {
      return null;
    }

    // 检查令牌是否即将过期
    const now = Date.now();
    const expiresAt = tokens.expiresIn * 1000; // 转换为毫秒

    if (expiresAt - now < this.REFRESH_THRESHOLD) {
      // 令牌即将过期，尝试刷新
      this.refreshToken().catch(() => {
        // 刷新失败，返回原令牌
      });
    }

    return tokens.accessToken;
  }

  /**
   * 获取刷新令牌
   */
  static getRefreshToken(): string | null {
    const tokens = this.getTokens();
    return tokens?.refreshToken || null;
  }

  /**
   * 获取完整令牌信息
   */
  static getTokens(): AuthTokens | null {
    try {
      const tokenData = localStorage.getItem(this.TOKEN_KEY);
      return tokenData ? JSON.parse(tokenData) : null;
    } catch {
      return null;
    }
  }

  /**
   * 获取当前用户（从本地存储）
   */
  static getCurrentUserFromStorage(): User | null {
    try {
      const userData = localStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  /**
   * 检查用户是否已认证
   */
  static isAuthenticated(): boolean {
    const tokens = this.getTokens();
    const user = this.getCurrentUserFromStorage();

    if (!tokens || !user) {
      return false;
    }

    // 检查令牌是否过期
    const now = Date.now();
    const expiresAt = tokens.expiresIn * 1000;

    return expiresAt > now;
  }

  /**
   * 检查用户是否为管理员
   */
  static isAdmin(): boolean {
    const user = this.getCurrentUserFromStorage();
    return user?.role === 'admin';
  }

  /**
   * 保存认证数据
   */
  private static saveAuthData(data: AuthResponse): void {
    this.saveTokens(data.tokens);
    this.saveUser(data.user);
  }

  /**
   * 保存令牌
   */
  private static saveTokens(tokens: AuthTokens): void {
    localStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokens));
  }

  /**
   * 保存用户信息
   */
  private static saveUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * 清除认证数据
   */
  private static clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * 验证令牌格式
   */
  static validateTokenFormat(token: string): boolean {
    // JWT令牌格式验证
    const parts = token.split('.');
    return parts.length === 3;
  }

  /**
   * 解码JWT令牌（获取payload）
   */
  static decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(window.atob(base64));
    } catch {
      return null;
    }
  }

  /**
   * 获取令牌剩余有效时间（秒）
   */
  static getTokenRemainingTime(): number {
    const tokens = this.getTokens();
    if (!tokens) {
      return 0;
    }

    const now = Math.floor(Date.now() / 1000);
    const remaining = tokens.expiresIn - now;

    return Math.max(0, remaining);
  }
}
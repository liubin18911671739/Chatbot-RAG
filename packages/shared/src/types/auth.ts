/**
 * 认证相关的TypeScript类型定义
 */

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastActivity: number;
}

export interface AuthActions {
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
  changePassword: (passwordData: PasswordChangeRequest) => Promise<void>;
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  nickname: string;
  acceptTerms: boolean;
  agreePrivacy: boolean;
}

export interface PasswordResetFormData {
  email: string;
}

export interface PasswordResetConfirmFormData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordChangeFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ProfileFormData {
  nickname: string;
  avatar?: string;
  preferences: UserPreferences;
}

// 验证规则
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  message: string;
}

export interface FormValidationRules {
  [key: string]: ValidationRule[];
}

// 认证错误代码
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_DISABLED = 'USER_DISABLED',
  PASSWORD_MISMATCH = 'PASSWORD_MISMATCH',
  PASSWORD_TOO_SHORT = 'PASSWORD_TOO_SHORT',
  PASSWORD_WEAK = 'PASSWORD_WEAK',
  EMAIL_EXISTS = 'EMAIL_EXISTS',
  INVALID_EMAIL = 'INVALID_EMAIL',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  NO_REFRESH_TOKEN = 'NO_REFRESH_TOKEN',
  NOT_AUTHENTICATED = 'NOT_AUTHENTICATED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  TERMS_NOT_ACCEPTED = 'TERMS_NOT_ACCEPTED',
}

// 权限级别
export enum Permission {
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin',
}

// 角色权限映射
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  user: [Permission.READ, Permission.WRITE],
  admin: [Permission.READ, Permission.WRITE, Permission.ADMIN],
};

// 密码强度枚举
export enum PasswordStrength {
  WEAK = 'weak',
  MEDIUM = 'medium',
  STRONG = 'strong',
}

// 认证状态枚举
export enum AuthStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}
/**
 * 表单验证工具函数
 */

import { ValidationRule, FormValidationRules, AuthErrorCode } from '../types/auth';

/**
 * 常用验证规则
 */
export const validationRules = {
  required: {
    required: true,
    message: '此字段为必填项',
  },

  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: '请输入有效的邮箱地址',
  },

  password: {
    required: true,
    minLength: 8,
    message: '密码长度至少为8位',
  },

  strongPassword: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    message: '密码必须包含大小写字母、数字和特殊字符',
  },

  nickname: {
    required: true,
    minLength: 2,
    maxLength: 20,
    pattern: /^[\u4e00-\u9fa5a-zA-Z0-9_-]+$/,
    message: '昵称只能包含中文、英文、数字、下划线和连字符',
  },

  terms: {
    required: true,
    message: '请同意服务条款和隐私政策',
  },
};

/**
 * 登录表单验证规则
 */
export const loginValidationRules: FormValidationRules = {
  email: [validationRules.email],
  password: [validationRules.password],
};

/**
 * 注册表单验证规则
 */
export const registerValidationRules: FormValidationRules = {
  email: [validationRules.email],
  password: [
    validationRules.password,
    {
      minLength: 8,
      message: '密码长度不能少于8位',
    },
    {
      pattern: /^(?=.*[a-z])(?=.*[A-Z])/,
      message: '密码必须包含大小写字母',
    },
    {
      pattern: /^(?=.*\d)/,
      message: '密码必须包含数字',
    },
  ],
  confirmPassword: [
    validationRules.required,
    {
      validate: (value: string, formData: any) => value === formData.password,
      message: '两次输入的密码不一致',
    },
  ],
  nickname: [validationRules.nickname],
  acceptTerms: [validationRules.terms],
};

/**
 * 密码重置表单验证规则
 */
export const passwordResetValidationRules: FormValidationRules = {
  email: [validationRules.email],
};

/**
 * 密码修改表单验证规则
 */
export const passwordChangeValidationRules: FormValidationRules = {
  currentPassword: [validationRules.required],
  newPassword: [validationRules.password],
  confirmPassword: [
    validationRules.required,
    {
      validate: (value: string, formData: any) => value === formData.newPassword,
      message: '两次输入的密码不一致',
    },
  ],
};

/**
 * 个人资料表单验证规则
 */
export const profileValidationRules: FormValidationRules = {
  nickname: [validationRules.nickname],
  avatar: [
    {
      pattern: /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i,
      message: '请输入有效的图片URL',
    },
  ],
};

/**
 * 表单验证器类
 */
export class FormValidator {
  private rules: FormValidationRules;
  private errors: Record<string, string[]> = {};

  constructor(rules: FormValidationRules) {
    this.rules = rules;
  }

  /**
   * 验证单个字段
   */
  validateField(fieldName: string, value: any, formData?: any): string[] {
    const fieldRules = this.rules[fieldName] || [];
    const errors: string[] = [];

    for (const rule of fieldRules) {
      // 必填验证
      if (rule.required && (!value || value.toString().trim() === '')) {
        errors.push(rule.message);
        continue;
      }

      // 如果字段为空且不是必填，跳过其他验证
      if (!value || value.toString().trim() === '') {
        continue;
      }

      // 最小长度验证
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(rule.message);
      }

      // 最大长度验证
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(rule.message);
      }

      // 正则表达式验证
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(rule.message);
      }

      // 自定义验证函数
      if (rule.validate && typeof rule.validate === 'function') {
        try {
          const isValid = rule.validate(value, formData);
          if (!isValid) {
            errors.push(rule.message);
          }
        } catch (error) {
          errors.push(rule.message);
        }
      }
    }

    return errors;
  }

  /**
   * 验证整个表单
   */
  validate(formData: Record<string, any>): { isValid: boolean; errors: Record<string, string[]> } {
    this.errors = {};
    let isValid = true;

    for (const fieldName in this.rules) {
      const fieldErrors = this.validateField(fieldName, formData[fieldName], formData);
      if (fieldErrors.length > 0) {
        this.errors[fieldName] = fieldErrors;
        isValid = false;
      }
    }

    return { isValid, errors: this.errors };
  }

  /**
   * 获取字段错误信息
   */
  getFieldErrors(fieldName: string): string[] {
    return this.errors[fieldName] || [];
  }

  /**
   * 检查字段是否有错误
   */
  hasFieldError(fieldName: string): boolean {
    return (this.errors[fieldName] || []).length > 0;
  }

  /**
   * 获取第一条字段错误信息
   */
  getFirstFieldError(fieldName: string): string | null {
    const errors = this.errors[fieldName];
    return errors && errors.length > 0 ? errors[0] : null;
  }

  /**
   * 清除字段错误
   */
  clearFieldError(fieldName: string): void {
    delete this.errors[fieldName];
  }

  /**
   * 清除所有错误
   */
  clearAllErrors(): void {
    this.errors = {};
  }
}

/**
 * 密码强度检查器
 */
export class PasswordStrengthChecker {
  /**
   * 检查密码强度
   */
  static checkStrength(password: string): {
    score: number;
    level: 'weak' | 'medium' | 'strong';
    feedback: string[];
  } {
    let score = 0;
    const feedback: string[] = [];

    // 长度检查
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('密码长度至少8位');
    }

    if (password.length >= 12) {
      score += 1;
    }

    // 字符类型检查
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('包含小写字母');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('包含大写字母');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('包含数字');
    }

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 1;
    } else {
      feedback.push('包含特殊字符');
    }

    // 复杂度检查
    if (!/(.)\1{2,}/.test(password)) {
      score += 1;
    } else {
      feedback.push('避免连续重复字符');
    }

    let level: 'weak' | 'medium' | 'strong' = 'weak';
    if (score >= 5) {
      level = 'strong';
    } else if (score >= 3) {
      level = 'medium';
    }

    return { score, level, feedback };
  }

  /**
   * 获取密码强度颜色
   */
  static getStrengthColor(level: 'weak' | 'medium' | 'strong'): string {
    switch (level) {
      case 'weak':
        return '#ff4d4f';
      case 'medium':
        return '#faad14';
      case 'strong':
        return '#52c41a';
      default:
        return '#d9d9d9';
    }
  }

  /**
   * 获取密码强度文本
   */
  static getStrengthText(level: 'weak' | 'medium' | 'strong'): string {
    switch (level) {
      case 'weak':
        return '弱';
      case 'medium':
        return '中';
      case 'strong':
        return '强';
      default:
        return '';
    }
  }
}

/**
 * 邮箱验证器
 */
export const EmailValidator = {
  /**
   * 验证邮箱格式
   */
  isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * 检查是否为常用邮箱域名
   */
  isCommonDomain(email: string): boolean {
    const commonDomains = [
      'gmail.com',
      'outlook.com',
      'yahoo.com',
      'qq.com',
      '163.com',
      '126.com',
      'sina.com',
      'hotmail.com',
      'icloud.com',
    ];
    const domain = email.split('@')[1]?.toLowerCase();
    return commonDomains.includes(domain);
  },

  /**
   * 检查是否为教育邮箱
   */
  isEducational(email: string): boolean {
    const eduDomains = ['.edu.cn', '.edu', '.ac.cn'];
    const domain = email.toLowerCase();
    return eduDomains.some(eduDomain => domain.includes(eduDomain));
  },
};

/**
 * 用户名验证器
 */
export const UsernameValidator = {
  /**
   * 验证用户名格式
   */
  isValid(username: string): boolean {
    // 用户名只能包含中英文、数字、下划线和连字符
    const usernameRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_-]+$/;
    return usernameRegex.test(username) && username.length >= 2 && username.length <= 20;
  },

  /**
   * 检查用户名是否包含敏感词
   */
  containsSensitiveWords(username: string): boolean {
    const sensitiveWords = [
      'admin', 'administrator', 'root', 'system', 'test', 'guest',
      '客服', '官方', '管理', '系统', '测试',
    ];
    const lowerUsername = username.toLowerCase();
    return sensitiveWords.some(word => lowerUsername.includes(word));
  },
};

/**
 * 综合验证器
 */
export const Validators = {
  /**
   * 验证登录表单
   */
  validateLoginForm: (formData: any) => {
    const validator = new FormValidator(loginValidationRules);
    return validator.validate(formData);
  },

  /**
   * 验证注册表单
   */
  validateRegisterForm: (formData: any) => {
    const validator = new FormValidator(registerValidationRules);
    const result = validator.validate(formData);

    // 额外验证
    if (EmailValidator.isValid(formData.email) && EmailValidator.isCommonDomain(formData.email)) {
      // 常用邮箱，可能需要额外验证
    }

    if (UsernameValidator.containsSensitiveWords(formData.nickname)) {
      result.isValid = false;
      result.errors.nickname = ['昵称包含敏感词汇，请更换'];
    }

    return result;
  },

  /**
   * 验证密码重置表单
   */
  validatePasswordResetForm: (formData: any) => {
    const validator = new FormValidator(passwordResetValidationRules);
    return validator.validate(formData);
  },

  /**
   * 验证密码修改表单
   */
  validatePasswordChangeForm: (formData: any) => {
    const validator = new FormValidator(passwordChangeValidationRules);
    const result = validator.validate(formData);

    // 检查新密码是否与当前密码相同
    if (formData.currentPassword === formData.newPassword) {
      result.isValid = false;
      result.errors.newPassword = ['新密码不能与当前密码相同'];
    }

    return result;
  },

  /**
   * 验证个人资料表单
   */
  validateProfileForm: (formData: any) => {
    const validator = new FormValidator(profileValidationRules);
    return validator.validate(formData);
  },
};
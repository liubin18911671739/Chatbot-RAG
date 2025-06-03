/**
 * 校园共建提交服务
 * 处理问题和答案的提交、错误处理、用户反馈等
 */

import axios from 'axios';

// API 基础配置
const API_BASE_URL = 'http://localhost:5000';

/**
 * 校园共建服务类
 */
class ContributionService {
  constructor() {
    // 创建 axios 实例，配置默认参数
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000, // 10秒超时
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      withCredentials: false,
      proxy: false // 禁用代理
    });

    // 添加请求拦截器
    this.api.interceptors.request.use(
      config => {
        console.log('📤 发送校园共建请求:', config);
        return config;
      },
      error => {
        console.error('❌ 请求拦截器错误:', error);
        return Promise.reject(error);
      }
    );

    // 添加响应拦截器
    this.api.interceptors.response.use(
      response => {
        console.log('📥 收到服务器响应:', response.status, response.data);
        return response;
      },
      error => {
        console.error('❌ 响应拦截器错误:', error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * 提交校园共建内容
   * @param {Object} formData - 表单数据
   * @param {string} formData.question - 问题内容
   * @param {string} formData.answer - 答案内容
   * @param {string} userId - 用户ID（可选）
   * @returns {Promise<Object>} 提交结果
   */
  async submitContribution(formData, userId = null) {
    try {
      // 验证输入数据
      this.validateFormData(formData);

      // 获取用户ID
      const actualUserId = userId || localStorage.getItem('userId') || '匿名用户';
      
      // 构建提交数据
      const submitData = {
        question: formData.question.trim(),
        answer: formData.answer.trim(),
        userid: actualUserId,
        status: 'unreview' // 校园共建提交的内容都是未审核状态
      };

      console.log('🚀 提交校园共建数据:', submitData);      // 发送请求
      const response = await this.api.post('/api/insert', submitData);

      // 处理成功响应
      if (response.data && response.data.status === 'success') {
        console.log('✅ 提交成功:', response.data);
        return {
          success: true,
          message: '提交成功！感谢您的贡献。',
          data: response.data
        };
      } else {
        throw new Error((response.data && response.data.message) || '提交失败');
      }

    } catch (error) {
      console.error('❌ 提交校园共建内容时出错:', error);
      return this.handleSubmissionError(error);
    }
  }

  /**
   * 验证表单数据
   * @param {Object} formData - 表单数据
   * @throws {Error} 验证失败时抛出错误
   */
  validateFormData(formData) {
    if (!formData) {
      throw new Error('表单数据不能为空');
    }

    if (!formData.question || !formData.question.trim()) {
      throw new Error('问题内容不能为空');
    }

    if (!formData.answer || !formData.answer.trim()) {
      throw new Error('答案内容不能为空');
    }

    // 长度验证
    if (formData.question.trim().length < 5) {
      throw new Error('问题内容至少需要5个字符');
    }

    if (formData.answer.trim().length < 5) {
      throw new Error('答案内容至少需要5个字符');
    }

    // 长度上限验证
    if (formData.question.trim().length > 500) {
      throw new Error('问题内容不能超过500个字符');
    }

    if (formData.answer.trim().length > 2000) {
      throw new Error('答案内容不能超过2000个字符');
    }
  }

  /**
   * 处理提交错误
   * @param {Error} error - 错误对象
   * @returns {Object} 格式化的错误响应
   */
  handleSubmissionError(error) {
    let errorMessage = '提交失败';
    let errorType = 'unknown';

    if (error.response) {
      // 服务器返回了错误响应
      const statusCode = error.response.status;
      const errorData = error.response.data;      errorType = 'server';

      if (statusCode === 409 && errorData && errorData.message === "问题已存在") {
        // 处理重复问题的特殊情况
        errorMessage = `问题已存在: ${errorData.existing_question || ''}`;
        errorType = 'duplicate';
      } else if (statusCode === 400) {
        errorMessage = `请求参数错误: ${(errorData && errorData.message) || '请检查输入内容'}`;
        errorType = 'validation';
      } else if (statusCode === 401) {
        errorMessage = '身份验证失败，请重新登录';
        errorType = 'auth';
      } else if (statusCode === 403) {
        errorMessage = '权限不足，无法提交';
        errorType = 'permission';
      } else if (statusCode >= 500) {
        errorMessage = '服务器内部错误，请稍后重试';
        errorType = 'server';      } else {
        errorMessage = (errorData && errorData.message) || error.response.statusText || '提交失败';
      }

    } else if (error.request) {
      // 请求已发送但没有收到响应
      errorMessage = '网络连接失败，请检查网络后重试';
      errorType = 'network';

    } else if (error.code === 'ECONNABORTED') {
      // 请求超时
      errorMessage = '请求超时，请稍后再试';
      errorType = 'timeout';

    } else if (error.code === 'ECONNREFUSED') {
      // 连接被拒绝
      errorMessage = '无法连接到服务器，请检查服务器状态';
      errorType = 'connection';

    } else {
      // 其他错误（包括验证错误）
      errorMessage = error.message || '未知错误';
      errorType = error.name === 'ValidationError' ? 'validation' : 'unknown';
    }

    return {
      success: false,
      message: errorMessage,
      type: errorType,
      originalError: error
    };
  }

  /**
   * 获取错误处理建议
   * @param {string} errorType - 错误类型
   * @returns {string} 处理建议
   */
  getErrorSuggestion(errorType) {
    const suggestions = {
      duplicate: '请检查是否已经提交过相同的问题，或者修改问题内容后重新提交。',
      validation: '请检查输入内容是否符合要求，确保问题和答案都有足够的内容。',
      auth: '请刷新页面重新登录后再试。',
      permission: '请联系管理员获取提交权限。',
      server: '服务器暂时繁忙，请稍后重试。如问题持续，请联系技术支持。',
      network: '请检查网络连接是否正常，确保能够访问服务器。',
      timeout: '网络响应较慢，请检查网络状况后重试。',
      connection: '无法连接到服务器，请稍后重试或联系技术支持。',
      unknown: '遇到未知错误，请重试或联系技术支持。'
    };

    return suggestions[errorType] || suggestions.unknown;
  }

  /**
   * 检查服务连接状态
   * @returns {Promise<boolean>} 连接状态
   */
  async checkConnection() {
    try {
      const response = await this.api.get('/api/health', { timeout: 3000 });
      return response.status === 200;
    } catch (error) {
      console.warn('⚠️ 校园共建服务连接检查失败:', error.message);
      return false;
    }
  }

  /**
   * 获取提交统计信息
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 统计信息
   */
  async getSubmissionStats(userId) {
    try {
      const actualUserId = userId || localStorage.getItem('userId');
      if (!actualUserId || actualUserId === '匿名用户') {
        return {
          totalSubmissions: 0,
          approvedSubmissions: 0,
          pendingSubmissions: 0
        };
      }

      const response = await this.api.get(`/api/user/${actualUserId}/stats`);
      return response.data;
    } catch (error) {
      console.warn('⚠️ 获取提交统计失败:', error);
      return {
        totalSubmissions: 0,
        approvedSubmissions: 0,
        pendingSubmissions: 0
      };
    }
  }
}

// 创建单例实例
const contributionService = new ContributionService();

// 导出服务实例和类
export default contributionService;
export { ContributionService };

// 便捷的函数式 API
export const submitContribution = (formData, userId) => {
  return contributionService.submitContribution(formData, userId);
};

export const checkConnectionStatus = () => {
  return contributionService.checkConnection();
};

export const getSubmissionStats = (userId) => {
  return contributionService.getSubmissionStats(userId);
};

export const getErrorSuggestion = (errorType) => {
  return contributionService.getErrorSuggestion(errorType);
};

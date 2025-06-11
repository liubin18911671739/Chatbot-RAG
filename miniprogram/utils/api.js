// utils/api.js
import networkValidator from './network-validator.js'
const { getConfig } = require('../config/env.js')

class ApiService {
  constructor() {
    this.baseUrl = ''
    this.timeout = 40000  // 40秒超时
    this.config = null
  }

  // 初始化API配置
  init() {
    this.config = getConfig()
    this.baseUrl = this.config.baseURL || 'http://10.10.15.211:5000'
    this.timeout = this.config.timeout || 40000
    console.log('API服务初始化:', {
      baseUrl: this.baseUrl,
      timeout: this.timeout,
      environment: this.config.environment
    })
  }  // 通用请求方法
  request(options) {
    return new Promise(async (resolve, reject) => {
      try {
        // 确保API已初始化
        if (!this.baseUrl) {
          this.init()
        }

        // 在发送请求前验证网络环境
        const networkCheck = await this.validateNetworkAccess()
        if (!networkCheck.valid) {
          reject(new Error(networkCheck.message))
          return
        }

        // 构建完整URL
        const url = options.url.startsWith('http') 
          ? options.url 
          : `${this.baseUrl}${options.url}`
        
        console.log(`[API请求] ${options.method || 'GET'} ${url}`)
        
        wx.request({
          url,
          method: options.method || 'GET',
          data: options.data || {},
          header: {
            'Content-Type': 'application/json',
            ...options.header
          },
          timeout: this.timeout,
          success: (res) => {
            console.log(`[API响应] ${url}`, res.data)
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(res.data)
            } else {
              reject(new Error(`请求失败: ${res.statusCode}`))
            }
          },
          fail: (err) => {
            console.error(`[API错误] ${url}`, err)
            reject(err)
          }
        })
      } catch (error) {
        console.error(`[API异常] ${options.url}`, error)
        reject(error)
      }
    })
  }

  // GET请求
  get(url, params = {}) {
    const queryString = Object.keys(params).length > 0 
      ? '?' + Object.keys(params).map(key => `${key}=${encodeURIComponent(params[key])}`).join('&')
      : ''
    
    return this.request({
      url: url + queryString,
      method: 'GET'
    })
  }

  // POST请求
  post(url, data = {}) {
    return this.request({
      url,
      method: 'POST',
      data
    })
  }  // 聊天API - 统一使用配置的baseUrl
  async sendMessage(prompt, userId = 'miniprogram_user', sceneId = 'general', retryCount = 0) {
    const maxRetries = 3; // 减少重试次数，提高响应速度
    
    try {
      // 确保API已初始化
      if (!this.baseUrl) {
        this.init()
      }

      const payload = { prompt: prompt.trim() };
      // 默认使用 'general' 场景，如果传入了其他场景则使用传入的值
      payload.scene_id = sceneId || 'general';

      // 设置请求配置
      const requestOptions = {
        url: '/api/chat', // 使用相对路径，让request方法处理完整URL
        method: 'POST',
        data: payload,
        header: {
          'Content-Type': 'application/json'
        }
      };

      const response = await this.request(requestOptions);

      // 检查响应是否有效
      if (response && response.response) {
        // 处理响应内容
        let responseText = response.response;
        
        // 去除深度思考标签
        responseText = responseText.replace(/<深度思考>[\s\S]*?<\/深度思考>/g, '');
        
        // 格式化响应
        responseText = responseText
          .replace(/\n{3,}/g, '\n\n') // 将3个及以上连续换行符替换为2个
          .trim(); // 去除首尾空白
        
        return {
          ...response,
          response: responseText
        };
      } else {
        // 响应格式不正确，需要重试
        console.warn(`第${retryCount + 1}次请求响应格式不正确，response:`, response);
        
        if (retryCount < maxRetries - 1) {
          console.log(`响应格式不正确，准备进行第${retryCount + 2}次重试...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // 递增延迟
          return this.sendMessage(prompt, userId, sceneId, retryCount + 1);
        } else {
          throw new Error('服务器响应格式异常，请稍后重试');
        }
      }
    } catch (error) {
      console.error(`第${retryCount + 1}次发送聊天消息失败:`, error);
      
      // 如果还有重试次数，进行重试
      if (retryCount < maxRetries - 1) {
        console.log(`第${retryCount + 1}次请求失败，准备进行第${retryCount + 2}次重试...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // 递增延迟
        return this.sendMessage(prompt, userId, sceneId, retryCount + 1);
      }
      
      // 所有重试都失败了，抛出错误
      if (error.errMsg && error.errMsg.includes('timeout')) {
        throw new Error('服务器响应超时，请稍后重试');
      } else if (error.errMsg && error.errMsg.includes('fail')) {
        throw new Error('网络连接失败，请检查网络设置');
      } else {
        throw new Error(error.message || '发送消息失败，请稍后重试');
      }
    }
  }  // 获取场景列表
  async getScenes() {
    try {
      const response = await this.get('/api/scenes');
      return response;
    } catch (error) {
      console.error('获取场景列表失败:', error);
      // 返回默认场景列表
      return {
        scenes: [
          { id: 'general', name: '通用助手', description: '通用AI助手' },
          { id: 'study', name: '学习辅导', description: '学习问题解答' },
          { id: 'life', name: '生活助手', description: '生活问题咨询' }
        ]
      }
    }
  }
  // 获取欢迎消息
  async getGreeting() {
    try {
      const response = await this.post('/api/greeting');
      return response;
    } catch (error) {
      console.error('获取欢迎消息失败:', error);
      return { greeting: '欢迎使用棠心问答AI辅导员！我将为您提供学习和生活上的帮助。' };
    }
  }
  // 获取建议问题
  async getSuggestions() {
    try {
      const response = await this.get('/api/suggestions');
      return response;
    } catch (error) {
      console.error('获取建议问题失败:', error);
      return { suggestions: [] };
    }
  }
  // 提交反馈
  async submitFeedback(feedbackData) {
    try {
      const response = await this.post('/api/feedback', feedbackData);
      return response;
    } catch (error) {
      console.error('提交反馈失败:', error);
      throw error
    }
  }
  // 搜索问题
  async searchQuestions(query, options = {}) {
    try {
      const params = {
        query: query,
        ...options
      }
      const response = await this.post('/api/search', params);
      return response;
    } catch (error) {
      console.error('搜索问题失败:', error);
      throw error;
    }
  }
  // 验证网络访问权限
  async validateNetworkAccess() {
    try {
      // 确保配置已加载
      if (!this.config) {
        this.init()
      }

      // 检查是否在开发环境或配置中禁用了校园网限制
      const systemInfo = wx.getSystemInfoSync()
      const isDevelopment = systemInfo.platform === 'devtools' || this.config.env === 'development'
      const campusRestrictionDisabled = !this.config.campusRestriction

      if (isDevelopment || campusRestrictionDisabled) {
        return {
          valid: true,
          reason: 'development_environment_or_restriction_disabled',
          message: '开发环境或校园网限制已禁用'
        }
      }

      // 使用网络验证器检查校园网环境
      const validation = await networkValidator.validateCampusNetwork()
      
      if (!validation.isValid) {
        return {
          valid: false,
          reason: validation.reason,
          message: validation.message
        }
      }

      return {
        valid: true,
        reason: 'campus_network_verified',
        message: '校园网环境验证通过'
      }
    } catch (error) {
      console.error('网络验证失败:', error)
      
      // 开发环境下验证失败时允许继续
      const systemInfo = wx.getSystemInfoSync()
      if (systemInfo.platform === 'devtools') {
        return {
          valid: true,
          reason: 'development_fallback',
          message: '开发环境验证失败但允许继续'
        }
      }
      
      return {
        valid: false,
        reason: 'validation_error',
        message: '网络环境验证失败'
      }
    }
  }
}

// 创建全局API实例
const apiService = new ApiService()

export default apiService

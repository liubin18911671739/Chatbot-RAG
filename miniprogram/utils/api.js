// utils/api.js
const app = getApp()
import networkValidator from './network-validator.js'

class ApiService {  constructor() {
    this.baseUrl = ''
    this.timeout = 40000  // 40秒超时，与参考代码一致
  }

  // 初始化API配置
  init() {
    this.baseUrl = app.globalData.apiBaseUrl
  }
  // 通用请求方法
  request(options) {
    return new Promise(async (resolve, reject) => {
      // 在发送请求前验证网络环境
      const networkCheck = await this.validateNetworkAccess()
      if (!networkCheck.valid) {
        reject(new Error(networkCheck.message))
        return
      }

      // 确保URL正确
      const url = options.url.startsWith('http') ? options.url : `${this.baseUrl}${options.url}`
      
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
  }
  // 聊天API - 参考前端实现的重试机制和格式化处理
  async sendMessage(prompt, userId = 'miniprogram_user', sceneId = null, retryCount = 0) {
    const maxRetries = 5;
    
    try {
      const payload = { prompt: prompt.trim() };
      if (sceneId) {
        payload.scene_id = sceneId;
      }

      // 设置请求配置
      const requestOptions = {
        url: '/chat',
        method: 'POST',
        data: payload,
        header: {
          'Content-Type': 'application/json'
        }
      };

      const response = await this.request(requestOptions);

      // 检查响应是否有效
      if (response && response.response) {
        // 使用正则表达式去除<深度思考>标签及其内容
        response.response = response.response.replace(/<深度思考>[\s\S]*?<\/深度思考>/g, '');

        // 格式化响应，使其更像ChatGPT的格式（去除多余空行，优化段落间距）
        response.response = response.response
          .replace(/\n{3,}/g, '\n\n') // 将3个及以上连续换行符替换为2个
          .trim(); // 去除首尾空白
        
        return response;
      } else {
        // 响应格式不正确，需要重试
        console.warn(`第${retryCount + 1}次请求响应格式不正确，response:`, response);
        
        if (retryCount < maxRetries - 1) {
          console.log(`响应格式不正确，准备进行第${retryCount + 2}次重试...`);
          await new Promise(resolve => setTimeout(resolve, 100 * (retryCount + 1))); // 递增延迟
          return this.sendMessage(prompt, userId, sceneId, retryCount + 1);
        } else {
          throw new Error('服务器响应超时，稍后再试...');
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
      
      // 所有重试都失败了，返回默认错误消息
      if (error.errMsg && error.errMsg.includes('timeout')) {
        throw new Error('服务器响应超时，稍后再试...');
      } else if (!error.errMsg) {
        throw new Error('服务器响应超时，稍后再试...');
      } else {
        throw new Error('网络连接失败，请检查网络设置');
      }
    }
  }

  // 获取场景列表
  async getScenes() {
    try {
      const response = await this.get('/scenes')
      return response
    } catch (error) {
      console.error('获取场景列表失败:', error)
      throw error
    }
  }

  // 获取欢迎消息
  async getGreeting() {
    try {
      const response = await this.get('/greeting')
      return response
    } catch (error) {
      console.error('获取欢迎消息失败:', error)
      return { greeting: '欢迎使用棠心问答AI辅导员！我将为您提供学习和生活上的帮助。' }
    }
  }

  // 获取建议问题
  async getSuggestions() {
    try {
      const response = await this.get('/suggestions')
      return response
    } catch (error) {
      console.error('获取建议问题失败:', error)
      return { suggestions: [] }
    }
  }

  // 提交反馈
  async submitFeedback(feedbackData) {
    try {
      const response = await this.post('/feedback', feedbackData)
      return response
    } catch (error) {
      console.error('提交反馈失败:', error)
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
      const response = await this.get('/search', params)
      return response
    } catch (error) {
      console.error('搜索问题失败:', error)
      throw error
    }
  }

  // 验证网络访问权限
  async validateNetworkAccess() {
    try {
      // 检查是否在开发环境
      const systemInfo = wx.getSystemInfoSync()
      if (systemInfo.platform === 'devtools') {
        return {
          valid: true,
          reason: 'development_environment',
          message: '开发环境跳过网络验证'
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

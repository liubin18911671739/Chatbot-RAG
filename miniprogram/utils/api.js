// utils/api.js
const app = getApp()

class ApiService {
  constructor() {
    this.baseUrl = ''
    this.timeout = 30000
  }

  // 初始化API配置
  init() {
    this.baseUrl = app.globalData.apiBaseUrl
  }

  // 通用请求方法
  request(options) {
    return new Promise((resolve, reject) => {
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

  // 聊天API
  async sendMessage(prompt, userId = 'miniprogram_user', sceneId = null) {
    try {
      const data = {
        prompt: prompt.trim(),
        user_id: userId
      }
      
      if (sceneId) {
        data.scene_id = sceneId
      }

      const response = await this.post('/chat', data)
      return response
    } catch (error) {
      console.error('发送消息失败:', error)
      throw error
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
}

// 创建全局API实例
const apiService = new ApiService()

export default apiService

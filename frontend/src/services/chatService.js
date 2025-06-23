import axios from 'axios';

// 环境配置
const getConfig = () => {
  return {
    baseURL: 'http://localhost:5000',
    backupURLs: [
      'http://10.10.15.210:5000',
      'http://10.10.15.211:5000'
    ],
    timeout: 60000,
    environment: process.env.NODE_ENV || 'development',
    campusRestriction: false
  };
};

class ChatService {
  constructor() {
    this.baseUrl = '';
    this.timeout = 60000;
    this.config = null;
    this.conversationHistory = [];
    this.init();
  }

  // 初始化API配置
  init() {
    this.config = getConfig();
    this.baseUrl = 'http://localhost:5000';
    this.timeout = this.config.timeout || 60000;
    
    console.log('API服务初始化:', {
      baseUrl: this.baseUrl,
      timeout: this.timeout,
      environment: this.config.environment,
      backupURLs: this.config.backupURLs
    });

    // 创建axios实例
    this.api = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // 设置拦截器
    this.setupInterceptors();
  }

  // 设置请求和响应拦截器
  setupInterceptors() {
    // 添加请求拦截器
    this.api.interceptors.request.use(
      (config) => {
        console.log(`[API请求] ${config.method ? config.method.toUpperCase() : 'GET'} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[API请求错误]', error);
        return Promise.reject(error);
      }
    );

    // 添加响应拦截器
    this.api.interceptors.response.use(
      (response) => {
        console.log(`[API响应] ${response.config.url}`, response.data);
        return response;
      },
      (error) => {
        console.error(`[API错误] ${error.config && error.config.url ? error.config.url : 'unknown'}`, error.message);
        return Promise.reject(error);      }
    );
  }

  async checkApiConnection() {
    try {
      console.log('正在检查API连接...');
      
      // 确保API已初始化
      if (!this.baseUrl) {
        this.init();
      }

      // 先尝试主要地址的greeting端点
      const response = await this.api.get('/api/health');
      console.log('API连接成功:', response.status, response.data);
      return true;
    } catch (error) {
      console.error('主API地址连接失败:', this.baseUrl, error.message);

      // 尝试备用地址
      // if (this.config.backupURLs && this.config.backupURLs.length > 0) {
      //   console.log('尝试备用API地址...');
        
      //   for (const backupUrl of this.config.backupURLs) {
      //     try {
      //       console.log(`尝试连接备用地址: ${backupUrl}`);
      //       const testResponse = await axios.get(`${backupUrl}/api/greeting`, {
      //         timeout: 5000 // 备用地址使用较短超时
      //       });
            
      //       console.log(`备用地址连接成功: ${backupUrl}`);
            
      //       // 更新配置使用成功的备用地址
      //       this.baseUrl = backupUrl;
      //       this.api = axios.create({
      //         baseURL: this.baseUrl,
      //         timeout: this.timeout,
      //         headers: { 'Content-Type': 'application/json' }
      //       });
            
      //       // 重新添加拦截器
      //       this.setupInterceptors();
            
      //       return true;
      //     } catch (backupError) {
      //       console.error(`备用地址连接失败: ${backupUrl}`, backupError.message);
      //     }
      //   }
      // }

      // return false;
    }
  }

  // 发送消息方法 (sendMessage)
  async sendMessage(message, sceneId = 'general', abortController = null) {
    try {
      return await this.sendChatMessage(message, sceneId, abortController);
    } catch (error) {
      console.error('发送消息失败:', error);
      throw error;
    }
  }

  // 聊天API - 发送聊天消息
  async sendChatMessage(prompt, sceneId = 'general', abortController = null, retryCount = 0) {
    const maxRetries = 2;
    
    try {
      // 确保API已初始化
      if (!this.baseUrl) {
        this.init();
      }

      const payload = { prompt: prompt.trim() };
      payload.scene_id = sceneId || 'general';

      console.log(`🚀 开始发送消息 (第${retryCount + 1}次尝试)`);
      console.log(`📝 消息内容: "${prompt}"`);
      console.log(`🏷️ 场景ID: ${sceneId}`);

      // 设置请求配置
      const requestConfig = {
        timeout: this.timeout
      };
      
      if (abortController) {
        requestConfig.signal = abortController.signal;
      }

      const response = await this.api.post('/api/chat', payload, requestConfig);

      // 检查响应是否有效
      if (response.data && response.data.response) {
        // 处理响应内容
        let responseText = response.data.response;
        
        // 去除深度思考标签
        responseText = responseText.replace(/<深度思考>[\s\S]*?<\/深度思考>/g, '');
        
        // 格式化响应
        responseText = responseText
          .replace(/\n{3,}/g, '\n\n')
          .trim();
        
        console.log(`✅ 消息发送成功!`);
        console.log(`💬 AI回复: ${responseText.substring(0, 100)}...`);
        
        return {
          ...response.data,
          response: responseText
        };
      } else {
        console.warn(`⚠️ 第${retryCount + 1}次请求响应格式不正确`);
        
        if (retryCount < maxRetries - 1) {
          console.log(`🔄 准备进行第${retryCount + 2}次重试...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return this.sendChatMessage(prompt, sceneId, abortController, retryCount + 1);
        } else {
          throw new Error('服务器响应格式异常，请稍后重试');
        }
      }
    } catch (error) {
      console.error(`❌ 第${retryCount + 1}次发送聊天消息失败:`, error.message);
      
      // 如果是用户取消的请求，直接抛出错误
      if (error.name === 'AbortError' || error.name === 'CanceledError') {
        throw error;
      }
      
      // 如果还有重试次数，进行重试
      if (retryCount < maxRetries - 1) {
        console.log(`🔄 第${retryCount + 1}次请求失败，准备进行第${retryCount + 2}次重试...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.sendChatMessage(prompt, sceneId, abortController, retryCount + 1);
      }
      
      // 所有重试都失败了，抛出错误
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('服务器响应超时，请稍后重试');
      } else if (error.message.includes('Network Error') || !error.response) {
        throw new Error('网络连接失败，请检查网络设置');
      } else {
        throw new Error(error.message || '发送消息失败，请稍后重试');
      }
    }
  }

  // 获取场景列表
  async getScenes() {
    try {
      const response = await this.api.get('/api/scenes');
      return response.data;
    } catch (error) {
      console.error('获取场景列表失败:', error);
      // 返回默认场景列表
      return {
        scenes: [
          { id: 'general', name: '通用助手', description: '通用AI助手' },
          { id: 'study', name: '学习辅导', description: '学习问题解答' },
          { id: 'life', name: '生活助手', description: '生活问题咨询' }
        ]
      };
    }
  }

  // 获取欢迎消息
  async getGreeting() {
    try {
      const response = await this.api.post('/api/greeting');
      return response.data;
    } catch (error) {
      console.error('获取欢迎消息失败:', error);
      return { greeting: '你好！我是棠心问答AI辅导员，随时为你提供帮助～可以解答思想困惑、学业指导、心理调适等成长问题，也能推荐校园资源。请随时告诉我你的需求，我会用AI智慧陪伴你成长！✨' };
    }
  }

  // 获取建议问题
  async getSuggestions() {
    try {
      const response = await this.api.get('/api/suggestions');
      return response.data;
    } catch (error) {
      console.error('获取建议问题失败:', error);
      return { suggestions: [] };
    }
  }

  // 提交反馈
  async submitFeedback(feedbackData) {
    try {
      const response = await this.api.post('/api/feedback', feedbackData);
      return response.data;
    } catch (error) {
      console.error('提交反馈失败:', error);
      throw error;
    }
  }

  // 搜索问题
  async searchQuestions(query, options = {}) {
    try {
      const params = {
        query: query,
        ...options
      };
      const response = await this.api.post('/api/search', params);
      return response.data;
    } catch (error) {
      console.error('搜索问题失败:', error);
      throw error;
    }
  }

  // 验证网络访问权限（前端版本简化）
  async validateNetworkAccess() {
    try {
      // 确保配置已加载
      if (!this.config) {
        this.init();
      }

      // 检查是否在开发环境或配置中禁用了校园网限制
      const isDevelopment = this.config.environment === 'development';
      const campusRestrictionDisabled = !this.config.campusRestriction;

      if (isDevelopment || campusRestrictionDisabled) {
        return {
          valid: true,
          reason: 'development_environment_or_restriction_disabled',
          message: '开发环境或校园网限制已禁用'
        };
      }

      // 前端项目简化网络验证，直接返回成功
      return {
        valid: true,
        reason: 'frontend_validation_passed',
        message: '前端网络验证通过'
      };
    } catch (error) {
      console.error('网络验证失败:', error);
      
      // 开发环境下验证失败时允许继续
      if (this.config && this.config.environment === 'development') {
        return {
          valid: true,
          reason: 'development_fallback',
          message: '开发环境验证失败但允许继续'
        };
      }
      
      return {
        valid: false,
        reason: 'validation_error',
        message: '网络环境验证失败'
      };
    }
  }
}

// 模拟API响应数据（移到类外部）
const mockApiResponse = {
  "status": "success",
  "suggestions": [
    "党政办公室综合事务的电话是多少？",
    "党政办公室综合事务的办公室是？",
    "65778005是哪个部门的电话？",
    "明德楼303是哪个部门的办公室？",
    "党政办公室党办事务的电话是多少？",
    "党政办公室党办事务的办公室是？",
    "65778315是哪个部门的电话？",
    "明德楼316是哪个部门的办公室？",
    "党政办公室发展规划的电话是多少？",
    "党政办公室发展规划的办公室是？",
    "65778312是哪个部门的电话？",
    "明德楼312是哪个部门的办公室？",
    "党政办公室法律事务的电话是多少？"
  ]
};

// 提取 suggestions 数据的函数（移到类外部）
function extractSuggestions(apiResponse) {
  console.log('🔍 提取 suggestions 数据...\n');
  
  // 检查响应格式
  if (apiResponse && apiResponse.status === 'success' && apiResponse.suggestions) {
    const Suggestions = apiResponse.suggestions;
    
    console.log('✅ 成功提取 suggestions 数据:');
    console.log('数据类型:', typeof Suggestions);
    console.log('是否为数组:', Array.isArray(Suggestions));
    console.log('数组长度:', Suggestions.length);
    console.log('\n📋 Suggestions 内容:');
    
    Suggestions.forEach((suggestion, index) => {
      console.log(`${index + 1}. ${suggestion}`);
    });
    
    return Suggestions;
  } else {
    console.log('❌ 无法提取 suggestions 数据，响应格式不正确');
    return [];
  }
}

export default new ChatService();
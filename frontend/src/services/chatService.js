import axios from 'axios';

// 创建带超时配置的axios实例
const api = axios.create({
  timeout: 600000, // 设置所有请求的默认超时时间为600秒
  // retry: 1, // 最大重试次数
  // retryDelay: 1000 // 重试间隔时间
});

// 添加请求拦截器
api.interceptors.request.use(function (config) {
  return config;
}, function (error) {
  return Promise.reject(error);
});

// 添加响应拦截器，处理超时和其他错误
api.interceptors.response.use(null, async function (error) {
  const config = error.config;
  
  // 如果是超时错误
  if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
    console.log('请求超时，准备重试...');
  }
  
  // 如果请求没有重试配置或已达最大重试次数，则拒绝
  if (!config || !config.retry || config._retryCount >= config.retry) {
    return Promise.reject(error);
  }
  
  // 增加重试计数
  config._retryCount = config._retryCount || 0;
  config._retryCount++;
  
  // 创建新的Promise来处理重试延迟
  const delayRetry = new Promise(resolve => {
    setTimeout(() => {
      console.log(`正在进行第 ${config._retryCount} 次重试...`);
      resolve();
    }, config.retryDelay || 1000);
  });
  
  // 等待延迟后重新发送请求
  await delayRetry;
  return api(config);
});

class ChatService {
  constructor() {
    // 初始化对话历史数组，用于存储最近的三轮对话
    this.conversationHistory = [];
  }

  async checkApiConnection() {
    try {
      console.log('正在检查API连接...');
      // 先尝试greeting端点
      const response = await api.get('/api/greeting');
      console.log('API连接成功:', response.status, response.data);
      return true;
    } catch (error) {
      console.error('API连接失败详情:', error);
      
      // 提供详细的错误信息以便调试
      if (error.response) {
        // 服务器返回了非2xx响应
        console.error(`服务器返回错误码: ${error.response.status}`);
        console.error('响应数据:', error.response.data);
      } else if (error.request) {
        // 请求已发送但没有收到响应
        console.error('未收到服务器响应，可能API服务未运行或网络问题');
        console.error('请求详情:', error.request);
      } else {
        // 请求设置有问题
        console.error('请求设置错误:', error.message);
      }
      
      // 尝试备用健康检查端点
      // try {
      //   console.log('尝试备用API健康检查...');
      //   const healthResponse = await api.get('/api/health');
      //   console.log('备用API连接成功:', healthResponse.status);
      //   return true;
      // } catch (healthError) {
      //   console.error('备用API连接也失败');
      //   return false;
      // }
    }
  }

  async sendChatMessage(prompt, sceneId = null) {
    try {
      const payload = { prompt };
      if (sceneId) {
        payload.scene_id = sceneId;
      }
      
      // 不再添加对话历史到请求中
      // if (this.conversationHistory.length > 0) {
      //   payload.history = this.conversationHistory;
      // }
      
      const response = await api.post('/api/chat', payload);
      
      // 处理响应，移除<深度思考>标签中的内容
      if (response.data && response.data.response) {
        // 使用正则表达式去除<深度思考>标签及其内容
        response.data.response = response.data.response.replace(/<深度思考>[\s\S]*?<\/深度思考>/g, '');
        
        // 格式化响应，使其更像ChatGPT的格式（去除多余空行，优化段落间距）
        response.data.response = response.data.response
          .replace(/\n{3,}/g, '\n\n') // 将3个及以上连续换行符替换为2个
          .trim(); // 去除首尾空白
      }
      
      // 不再将当前对话添加到历史记录中
      // this.conversationHistory.push({
      //   user: prompt,
      //   assistant: response.data.response || ''
      // });
      
      // 不再维护历史记录
      // if (this.conversationHistory.length > 3) {
      //   this.conversationHistory.shift(); // 移除最早的一轮对话
      // }
      
      return response.data;
    } catch (error) {
      console.error('发送聊天消息失败:', error);
        // 针对不同类型的错误提供更具体的信息
      if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
        // throw new Error('无法连接到API服务器: 请求超时，服务器响应时间过长');
        throw new Error('请求超时');
      } else if (!error.response) {
        // throw new Error('无法连接到API服务器: 服务可能不可用或网络问题');
        throw new Error('网络连接问题');
      } else {
        throw error;
      }
    }
  }

  // 清除对话历史
  clearConversationHistory() {
    this.conversationHistory = [];
    return true;
  }

  // 获取当前对话历史
  getConversationHistory() {
    return [...this.conversationHistory]; // 返回副本以防止外部修改
  }

  async getScenes() {
    try {
      const response = await api.get('/api/scenes');
      return response.data;
    } catch (error) {
      console.error('获取场景列表失败:', error);
      throw error;
    }
  }
  
  async sendFeedback(feedbackData) {
    try {
      const response = await api.post('/api/feedback', feedbackData);
      return response.data;
    } catch (error) {
      console.error('发送反馈失败:', error);
      throw error;
    }
  }
  
  async getGreeting() {
    try {
      const response = await api.get('/api/greeting');
      return response;
    } catch (error) {
      console.error('获取欢迎消息失败:', error);
      return { data: { greeting: '你好！我是棠心问答AI辅导员，随时为你提供帮助～可以解答思想困惑、学业指导、心理调适等成长问题，也能推荐校园资源。请随时告诉我你的需求，我会用AI智慧陪伴你成长！✨' } };
    }
  }
  // 获取自动完成建议
  async getSuggestions(query) {
    try {
      if (!query || query.trim().length < 2) {
        return { data: [] };
      }
      
      const response = await api.get(`/api/suggestions?query=${encodeURIComponent(query)}`, {
        timeout: 3000 // 较短的超时时间，确保响应迅速
      });
      
      return response;
    } catch (error) {
      console.warn('获取建议失败:', error);
      // 失败时返回空数组，不影响用户体验
      return { data: [] };
    }
  }

  // 从API获取建议数据，支持回退到本地建议
  async fetchSuggestions(localSuggestions = []) {
    try {
      const response = await api.get('/api/suggestions', {
        timeout: 5000 // 5秒超时
      });
      
      if (response.data) {
        // 检查响应格式并提取建议数据
        if (response.data.status === 'success' && response.data.data) {
          console.log('Successfully fetched suggestions from API:', response.data.data);
          return response.data.data;
        } else if (Array.isArray(response.data)) {
          // 如果直接返回数组格式
          console.log('Successfully fetched suggestions from API (array format):', response.data);
          return response.data;
        } else {
          console.warn('API response format unexpected, using local suggestions');
          return localSuggestions;
        }
      } else {
        console.warn('Failed to fetch suggestions from API, using local suggestions');
        return localSuggestions;
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      console.log('Using local suggestions due to API error');
      return localSuggestions;
    }
  }
}

export default new ChatService();
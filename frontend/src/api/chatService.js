// src/api/chatService.js
import axios from 'axios';

// 网络状态检测函数
const checkNetworkStatus = async (url = 'http://10.101.0.208:5000/api/greeting') => {
  try {
    const response = await fetch(url, { 
      method: 'GET',
      // 移除 no-cors 模式以便正确检测响应
      cache: 'no-cache',
      timeout: 3000
    });
    // 检查响应状态是否正常
    return response.ok;
  } catch (error) {
    console.error('API服务器连接失败:', error);
    return false;
  }
};

// 创建axios实例
const apiClient = axios.create({
  baseURL: process.env.VUE_APP_API_URL || 'http://10.101.0.208:5000/api',  // 保持这个配置，因为您的vue.config.js已经正确设置
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

// 请求重试配置
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// 方案2: 使用响应拦截器实现请求失败自动重试
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // 安全检查metadata对象
    if (!originalRequest.metadata) {
      originalRequest.metadata = { retryCount: 0 };
    }
    
    // 检查是否网络错误且未超过重试次数
    if ((error.message.includes('Network Error') || !error.response) && 
        originalRequest.metadata.retryCount < MAX_RETRIES) {
        
      originalRequest.metadata.retryCount++;
      console.log(`重试请求 (${originalRequest.metadata.retryCount}/${MAX_RETRIES}): ${originalRequest.url}`);
      
      // 延迟重试
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return apiClient(originalRequest);
    }
    
    return Promise.reject(error);
  }
);

export const chatService = {
  /**
   * 发送聊天消息
   * @param {string} studentId - 用户ID
   * @param {string} prompt - 用户输入的问题
   * @param {string|null} cardPinyin - 场景ID
   * @param {string|null} chatId - 对话ID（可选）
   * @returns {Promise} 聊天响应承诺
   */
  sendChatMessage(studentId = '未知用户', prompt, cardPinyin = null, chatId = null) {
    // 添加基本参数验证
    if (!prompt || prompt.trim() === '') {
      return Promise.reject(new Error('提问内容不能为空'));
    }
    
    // 构建与后端API接口匹配的参数
    const payload = {
      student_id: studentId,
      prompt: prompt.trim(),
      card_pinyin: cardPinyin
    };
    
    // 如果有对话ID，添加到请求中
    if (chatId) {
      payload.chat_id = chatId;
    }
    
    console.log('发送聊天请求:', payload);
    
    return apiClient.post('/chat', payload)
      .catch(error => {
        if (error.response) {
          console.error('请求错误:', {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers
          });
          
          if (error.response.status === 400) {
            const errorMsg = error.response.data.message || '请求参数错误，请检查输入';
            throw new Error(errorMsg);
          }
        }
        throw error;
      });
  },
  
  /**
   * 获取所有场景信息
   * @returns {Promise} 场景信息响应
   */
  getScenes() {
    return apiClient.get('/scenes')
      .then(response => {
        // 将后端返回的场景对象转换为数组格式
        const scenesData = response.data;
        if (typeof scenesData === 'object' && !Array.isArray(scenesData)) {
          const scenesArray = Object.entries(scenesData).map(([name, data]) => ({
            id: data.id || name.toLowerCase().replace(/\s+/g, '_'),
            name: name,
            description: data.description || '',
            iconUrl: `/icons/${data.icon || '🎓'}.png`,
            bannerUrl: `/banners/${data.id || name.toLowerCase().replace(/\s+/g, '_')}.jpg`,
            prompts: [],
            icon: data.icon || '🎓'
          }));
          return { data: scenesArray };
        }
        return response;
      });
  },
  
  /**
   * 发送反馈
   * @param {Object} feedbackData - 反馈数据
   * @returns {Promise} 反馈响应
   */
  sendFeedback(feedbackData) {
    const payload = {
      feedback: {
        score: feedbackData.score || 0,
        text: feedbackData.comment || ''
      },
      question: feedbackData.question || '',
      answer: feedbackData.answer || '',
      scene: feedbackData.scene || '默认场景'
    };
    
    return apiClient.post('/feedback', payload);
  },
  
  /**
   * 获取欢迎语
   * @returns {Promise} 欢迎语响应
   */
  getGreeting() {
    return apiClient.get('/greeting');
  },
  
  /**
   * 创建新对话
   * @param {string} studentId - 用户ID
   * @param {string} sceneId - 场景ID
   * @returns {Promise} 新对话响应
   */
  createNewChat(studentId = '未知用户', sceneId = 'general') {
    const payload = {
      student_id: studentId,
      scene_id: sceneId
    };
    
    return apiClient.post('/chats/new', payload);
  },
  
  /**
   * 检查API连接状态
   * @returns {Promise<boolean>} 连接状态
   */
  async checkApiConnection() {
    return await checkNetworkStatus();
  },
  
  /**
   * 获取备用欢迎语（网络连接失败时使用）
   */
  async getFallbackGreeting() {
    return { 
      data: { 
        message: "网络连接失败，但您仍可以输入问题，我们会在网络恢复后处理。" 
      } 
    };
  }
};


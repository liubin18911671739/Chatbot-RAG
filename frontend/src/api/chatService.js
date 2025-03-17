// src/api/chatService.js
import axios from 'axios';

// 创建axios实例
const apiClient = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || '/api',  // 保持这个配置，因为您的vue.config.js已经正确设置
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

// 请求拦截器 - 添加token等信息
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

export const chatService = {
  /**
   * 发送聊天请求到后端
   * @param {string} studentId - 用户ID
   * @param {string} prompt - 用户输入的问题
   * @param {string|null} cardPinyin - 场景ID
   * @returns {Promise} 聊天响应承诺
   */
  sendChatMessage(studentId = '未知用户', prompt, cardPinyin = null) {
    return apiClient.post('/chat', {
      student_id: studentId,
      prompt: prompt,
      card_pinyin: cardPinyin
    });
  },
  
  // 其他API方法...
  getScenes() {
    return apiClient.get('/scenes');
  },
  
  sendFeedback(feedbackData) {
    return apiClient.post('/feedback', feedbackData);
  },
  
  getGreeting() {
    return apiClient.get('/greeting');
  }
};


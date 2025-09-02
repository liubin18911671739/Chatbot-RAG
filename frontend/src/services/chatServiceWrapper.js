// Chat Service Wrapper - 智能切换真实服务和模拟服务
import chatService from './chatService';
import mockChatService from './mockChatService';

class ChatServiceWrapper {
  constructor() {
    this.useMock = false;
    this.currentService = chatService;
    this.init();
  }

  // 初始化
  init() {
    // 检查环境变量或本地存储中的模拟设置
    const mockSetting = localStorage.getItem('use_mock_chat');
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // 在开发环境中默认允许模拟模式
    if (mockSetting === 'true' || (isDevelopment && mockSetting !== 'false')) {
      this.enableMock();
    } else {
      this.disableMock();
    }

    console.log(`🔧 Chat Service Wrapper 初始化完成 - ${this.useMock ? '模拟模式' : '真实模式'}`);
  }

  // 启用模拟模式
  enableMock() {
    this.useMock = true;
    this.currentService = mockChatService;
    localStorage.setItem('use_mock_chat', 'true');
    console.log('🎭 已启用模拟聊天模式');
  }

  // 禁用模拟模式
  disableMock() {
    this.useMock = false;
    this.currentService = chatService;
    localStorage.setItem('use_mock_chat', 'false');
    console.log('🌐 已启用真实聊天模式');
  }

  // 切换模式
  toggleMode() {
    if (this.useMock) {
      this.disableMock();
    } else {
      this.enableMock();
    }
    return this.useMock;
  }

  // 获取当前模式
  getCurrentMode() {
    return this.useMock ? 'mock' : 'real';
  }

  // 检查是否为模拟模式
  isMockMode() {
    return this.useMock;
  }

  // 以下方法代理到当前活动的服务

  async sendMessage(message, sceneId = 'general', abortController = null) {
    console.log(`📤 发送消息 [${this.getCurrentMode()}]: ${message.substring(0, 50)}...`);
    return await this.currentService.sendMessage(message, sceneId, abortController);
  }

  async sendChatMessage(prompt, sceneId = 'general', abortController = null) {
    return await this.currentService.sendChatMessage(prompt, sceneId, abortController);
  }

  async getScenes() {
    return await this.currentService.getScenes();
  }

  async getGreeting() {
    return await this.currentService.getGreeting();
  }

  async getSuggestions(sceneId = 'general') {
    return await this.currentService.getSuggestions(sceneId);
  }

  async submitFeedback(rating, comment) {
    return await this.currentService.submitFeedback(rating, comment);
  }

  async checkApiConnection() {
    return await this.currentService.checkApiConnection();
  }

  async healthCheck() {
    return await this.currentService.healthCheck();
  }

  // 模拟模式专用方法（仅在模拟模式下可用）
  setMockDelay(delay) {
    if (this.useMock && this.currentService.setMockDelay) {
      this.currentService.setMockDelay(delay);
    } else {
      console.warn('⚠️ setMockDelay 只在模拟模式下可用');
    }
  }

  getConversationHistory() {
    if (this.useMock && this.currentService.getConversationHistory) {
      return this.currentService.getConversationHistory();
    } else {
      console.warn('⚠️ getConversationHistory 只在模拟模式下可用');
      return [];
    }
  }

  clearConversationHistory() {
    if (this.useMock && this.currentService.clearConversationHistory) {
      this.currentService.clearConversationHistory();
    } else {
      console.warn('⚠️ clearConversationHistory 只在模拟模式下可用');
    }
  }

  // 性能监控方法
  getPerformanceStats() {
    return {
      mode: this.getCurrentMode(),
      service: this.useMock ? 'MockChatService' : 'ChatService',
      conversationHistory: this.useMock ? this.currentService.getConversationHistory() : [],
      timestamp: new Date().toISOString()
    };
  }

  // 自动模式切换（基于网络状态）
  async autoSwitchMode() {
    try {
      // 尝试连接真实服务
      await chatService.checkApiConnection();
      // 如果成功，使用真实服务
      this.disableMock();
      return false; // 返回false表示使用真实服务
    } catch (error) {
      // 如果失败，切换到模拟服务
      console.log('🔄 真实服务不可用，自动切换到模拟模式');
      this.enableMock();
      return true; // 返回true表示使用模拟服务
    }
  }

  // 混合模式：先尝试真实服务，失败时自动回退到模拟服务
  async sendMessageWithFallback(message, sceneId = 'general', abortController = null) {
    // 如果当前是模拟模式，直接使用模拟服务
    if (this.useMock) {
      return await this.sendMessage(message, sceneId, abortController);
    }

    try {
      // 先尝试真实服务
      const response = await chatService.sendMessage(message, sceneId, abortController);
      console.log('✅ 真实服务响应成功');
      return response;
    } catch (error) {
      console.log('❌ 真实服务失败，回退到模拟服务:', error.message);
      
      // 临时切换到模拟服务
      const originalMode = this.useMock;
      this.enableMock();
      
      try {
        const mockResponse = await mockChatService.sendMessage(message, sceneId, abortController);
        // 在响应中标记这是回退响应
        if (mockResponse.data) {
          mockResponse.data.special_note = '⚠️ 真实服务不可用，响应来自备用模拟服务';
        }
        return mockResponse;
      } finally {
        // 恢复原始模式设置
        if (!originalMode) {
          this.disableMock();
        }
      }
    }
  }
}

// 创建单例实例
const chatServiceWrapper = new ChatServiceWrapper();

export default chatServiceWrapper;
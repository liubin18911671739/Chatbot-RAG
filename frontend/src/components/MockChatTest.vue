<template>
  <div class="mock-chat-test">
    <div class="test-header">
      <h2>🎭 前端聊天功能模拟测试</h2>
      <div class="test-controls">
        <button @click="toggleMockMode" :class="['toggle-btn', mockMode ? 'active' : '']">
          {{ mockMode ? '🎭 模拟模式' : '🌐 真实模式' }}
        </button>
        <button @click="clearHistory" class="clear-btn">🗑️ 清除历史</button>
        <button @click="runAutoTest" class="auto-test-btn" :disabled="autoTesting">
          {{ autoTesting ? '⏳ 自动测试中...' : '🚀 自动测试' }}
        </button>
      </div>
    </div>

    <div class="test-content">
      <!-- 场景选择 -->
      <div class="scene-selector">
        <h3>选择场景：</h3>
        <div class="scene-buttons">
          <button 
            v-for="scene in scenes" 
            :key="scene.id"
            @click="selectScene(scene.id)"
            :class="['scene-btn', currentScene === scene.id ? 'active' : '']"
          >
            {{ scene.name }}
          </button>
        </div>
      </div>

      <!-- 聊天界面 -->
      <div class="chat-container">
        <div class="chat-messages" ref="messagesContainer">
          <div 
            v-for="(msg, index) in messages" 
            :key="index"
            :class="['message', msg.type]"
          >
            <div class="message-content">
              <div class="message-text">{{ msg.content }}</div>
              <div class="message-meta">
                {{ formatTime(msg.timestamp) }}
                <span v-if="msg.sceneId" class="scene-tag">{{ getSceneName(msg.sceneId) }}</span>
              </div>
            </div>
          </div>
          
          <!-- 加载指示器 -->
          <div v-if="isLoading" class="message assistant loading">
            <div class="message-content">
              <div class="loading-dots">
                <span></span><span></span><span></span>
              </div>
              <div class="message-meta">AI正在思考中...</div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="chat-input">
          <div class="input-row">
            <input 
              v-model="userInput" 
              @keyup.enter="sendMessage"
              placeholder="请输入您的问题..."
              :disabled="isLoading"
              class="message-input"
            >
            <button 
              @click="sendMessage" 
              :disabled="isLoading || !userInput.trim()"
              class="send-btn"
            >
              {{ isLoading ? '⏳' : '📤' }}
            </button>
          </div>
          
          <!-- 建议问题 -->
          <div class="suggestions" v-if="suggestions.length > 0 && !isLoading">
            <h4>💡 建议问题：</h4>
            <div class="suggestion-buttons">
              <button 
                v-for="suggestion in suggestions" 
                :key="suggestion"
                @click="sendSuggestion(suggestion)"
                class="suggestion-btn"
              >
                {{ suggestion }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 测试统计 -->
      <div class="test-stats">
        <h3>📊 测试统计</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ totalMessages }}</div>
            <div class="stat-label">消息总数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ averageResponseTime }}ms</div>
            <div class="stat-label">平均响应时间</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ successRate }}%</div>
            <div class="stat-label">成功率</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ mockMode ? '模拟' : '真实' }}</div>
            <div class="stat-label">当前模式</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import mockChatService from '../services/mockChatService';
import chatService from '../services/chatService';

export default {
  name: 'MockChatTest',
  data() {
    return {
      mockMode: true, // 默认使用模拟模式
      currentScene: 'general',
      userInput: '',
      messages: [],
      suggestions: [],
      scenes: [],
      isLoading: false,
      autoTesting: false,
      
      // 测试统计数据
      responseTimes: [],
      successCount: 0,
      totalRequests: 0
    };
  },
  computed: {
    currentService() {
      return this.mockMode ? mockChatService : chatService;
    },
    totalMessages() {
      return this.messages.length;
    },
    averageResponseTime() {
      if (this.responseTimes.length === 0) return 0;
      const sum = this.responseTimes.reduce((a, b) => a + b, 0);
      return Math.round(sum / this.responseTimes.length);
    },
    successRate() {
      if (this.totalRequests === 0) return 100;
      return Math.round((this.successCount / this.totalRequests) * 100);
    }
  },
  async mounted() {
    await this.initializeTest();
  },
  methods: {
    async initializeTest() {
      try {
        // 加载场景列表
        await this.loadScenes();
        // 加载建议问题
        await this.loadSuggestions();
        // 添加欢迎消息
        this.addMessage('assistant', '欢迎使用聊天功能测试！请选择场景并开始对话。');
      } catch (error) {
        console.error('初始化测试失败:', error);
      }
    },

    async loadScenes() {
      try {
        const response = await this.currentService.getScenes();
        this.scenes = response.data.scenes || [];
      } catch (error) {
        console.error('加载场景失败:', error);
        // 使用默认场景
        this.scenes = [
          { id: 'general', name: '通用助手' },
          { id: 'db_xuexizhidao', name: '学习指导' },
          { id: 'db_zhihuisizheng', name: '思政学习' },
          { id: 'db_keyanfuzhu', name: '科研辅助' },
          { id: 'db_wangshangbanshiting', name: '网上办事厅' }
        ];
      }
    },

    async loadSuggestions() {
      try {
        const response = await this.currentService.getSuggestions(this.currentScene);
        this.suggestions = response.data.suggestions || [];
      } catch (error) {
        console.error('加载建议失败:', error);
      }
    },

    selectScene(sceneId) {
      this.currentScene = sceneId;
      this.addMessage('system', `已切换到场景：${this.getSceneName(sceneId)}`);
      this.loadSuggestions();
    },

    getSceneName(sceneId) {
      const scene = this.scenes.find(s => s.id === sceneId);
      return scene ? scene.name : sceneId;
    },

    async sendMessage() {
      if (!this.userInput.trim() || this.isLoading) return;

      const message = this.userInput.trim();
      this.userInput = '';
      
      // 添加用户消息
      this.addMessage('user', message);
      this.isLoading = true;
      
      const startTime = Date.now();
      this.totalRequests++;

      try {
        // 发送消息
        const response = await this.currentService.sendMessage(message, this.currentScene);
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // 记录响应时间
        this.responseTimes.push(responseTime);
        this.successCount++;
        
        // 添加助手回复
        this.addMessage('assistant', response.data.response, {
          responseTime,
          specialNote: response.data.special_note
        });
        
      } catch (error) {
        console.error('发送消息失败:', error);
        this.addMessage('assistant', '抱歉，消息发送失败：' + error.message, {
          isError: true
        });
      } finally {
        this.isLoading = false;
        this.scrollToBottom();
      }
    },

    sendSuggestion(suggestion) {
      this.userInput = suggestion;
      this.sendMessage();
    },

    addMessage(type, content, meta = {}) {
      this.messages.push({
        type,
        content,
        timestamp: new Date(),
        sceneId: this.currentScene,
        ...meta
      });
      this.$nextTick(() => {
        this.scrollToBottom();
      });
    },

    scrollToBottom() {
      const container = this.$refs.messagesContainer;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    },

    formatTime(timestamp) {
      return new Date(timestamp).toLocaleTimeString();
    },

    toggleMockMode() {
      this.mockMode = !this.mockMode;
      this.addMessage('system', `已切换到${this.mockMode ? '模拟' : '真实'}模式`);
      this.initializeTest();
    },

    clearHistory() {
      this.messages = [];
      this.responseTimes = [];
      this.successCount = 0;
      this.totalRequests = 0;
      this.addMessage('system', '历史记录已清除');
    },

    async runAutoTest() {
      this.autoTesting = true;
      this.clearHistory();
      
      const testMessages = [
        '你好',
        '学校有什么专业？',
        '图书馆在哪里？',
        '如何申请奖学金？',
        '谢谢你的帮助'
      ];

      for (let i = 0; i < testMessages.length; i++) {
        this.userInput = testMessages[i];
        await this.sendMessage();
        // 等待一段时间再发送下一条
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      this.autoTesting = false;
      this.addMessage('system', '自动测试完成！');
    }
  }
};
</script>

<style scoped>
.mock-chat-test {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.test-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  color: white;
}

.test-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.test-controls {
  display: flex;
  gap: 10px;
}

.toggle-btn, .clear-btn, .auto-test-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  transition: all 0.3s;
}

.toggle-btn:hover, .clear-btn:hover, .auto-test-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.toggle-btn.active {
  background: rgba(255, 255, 255, 0.9);
  color: #667eea;
}

.test-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
}

.scene-selector {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  height: fit-content;
}

.scene-selector h3 {
  margin-top: 0;
  color: #333;
}

.scene-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.scene-btn {
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
  text-align: left;
}

.scene-btn:hover {
  border-color: #667eea;
}

.scene-btn.active {
  border-color: #667eea;
  background: #f0f4ff;
  color: #667eea;
}

.chat-container {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 600px;
}

.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  border-bottom: 1px solid #eee;
}

.message {
  margin-bottom: 15px;
}

.message.user .message-content {
  background: #667eea;
  color: white;
  margin-left: auto;
  max-width: 80%;
  border-radius: 15px 15px 5px 15px;
}

.message.assistant .message-content {
  background: #f0f4ff;
  color: #333;
  max-width: 80%;
  border-radius: 15px 15px 15px 5px;
}

.message.system .message-content {
  background: #fff3cd;
  color: #856404;
  text-align: center;
  border-radius: 20px;
  font-style: italic;
  max-width: 60%;
  margin: 0 auto;
}

.message-content {
  padding: 12px 16px;
}

.message-text {
  margin-bottom: 5px;
}

.message-meta {
  font-size: 0.8rem;
  opacity: 0.7;
}

.scene-tag {
  background: rgba(255,255,255,0.3);
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 5px;
}

.loading .message-content {
  background: #f8f9fa;
}

.loading-dots {
  display: flex;
  gap: 4px;
}

.loading-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #667eea;
  animation: loading 1.4s infinite;
}

.loading-dots span:nth-child(1) { animation-delay: 0s; }
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes loading {
  0%, 60%, 100% { transform: scale(0.8); opacity: 0.5; }
  30% { transform: scale(1.2); opacity: 1; }
}

.chat-input {
  padding: 20px;
  background: #f8f9fa;
}

.input-row {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.message-input {
  flex: 1;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 25px;
  outline: none;
  font-size: 14px;
}

.message-input:focus {
  border-color: #667eea;
}

.send-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 25px;
  background: #667eea;
  color: white;
  cursor: pointer;
  transition: all 0.3s;
}

.send-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.suggestions h4 {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 0.9rem;
}

.suggestion-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.suggestion-btn {
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 15px;
  background: white;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.3s;
}

.suggestion-btn:hover {
  background: #667eea;
  color: white;
}

.test-stats {
  grid-column: span 2;
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-top: 20px;
}

.test-stats h3 {
  margin-top: 0;
  color: #333;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 10px;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
}

@media (max-width: 768px) {
  .test-content {
    grid-template-columns: 1fr;
  }
  
  .test-header {
    flex-direction: column;
    gap: 15px;
  }
}
</style>
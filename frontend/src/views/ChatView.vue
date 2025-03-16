<template>
  <div class="main-container">
    <!-- 左侧边栏 -->
    <div class="sidebar">
      <!-- 顶部按钮 -->
      <div class="sidebar-actions">
        <button class="action-button new-chat" @click="createNewChat">
          <i class="icon-plus"></i> 新建对话
        </button>
        <button class="action-button history" @click="toggleHistory">
          <i class="icon-history"></i> 历史对话
        </button>
      </div>

      <!-- 场景选择列表 -->
      <div class="scene-list">
        <div 
          v-for="(scene, index) in scenes" 
          :key="index" 
          :class="['scene-item', currentScene.id === scene.id ? 'active' : '']"
          @click="selectScene(scene)"
        >
          <div class="scene-icon">
            <img :src="scene.iconUrl" :alt="scene.name" />
          </div>
          <div class="scene-name">{{ scene.name }}</div>
        </div>
      </div>
    </div>

    <!-- 右侧内容区 -->
    <div class="content">
      <!-- 场景图片展示 -->
      <div class="scene-banner">
        <img :src="currentScene.bannerUrl" :alt="currentScene.name" />
        <h2>{{ currentScene.name }}</h2>
      </div>

      <!-- 提示词区域 -->
      <div class="prompt-suggestions">
        <h3>可能的提示词:</h3>
        <div class="prompt-chips">
          <span 
            v-for="(prompt, i) in currentScene.prompts" 
            :key="i" 
            class="prompt-chip"
            @click="usePrompt(prompt)"
          >
            {{ prompt }}
          </span>
        </div>
      </div>

      <!-- 聊天消息区域 -->
      <div class="chat-messages" ref="messagesContainer">
        <div v-for="(message, index) in currentMessages" :key="index" 
             :class="['message', message.sender === 'user' ? 'user-message' : 'ai-message']">
          <div class="message-content">{{ message.content }}</div>
        </div>
        <div v-if="loading" class="loading-indicator">
          <span>思考中...</span>
        </div>
      </div>
      
      <!-- 输入区域 -->
      <div class="chat-input">
        <input 
          v-model="userInput" 
          @keyup.enter="sendMessage" 
          placeholder="请输入您的问题..."
          :disabled="loading"
        />
        <button @click="sendMessage" :disabled="loading || !userInput.trim()">
          发送
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ChatView',
  data() {
    return {
      scenes: [
        { 
          id: 'general',
          name: '通用场景',
          iconUrl: '/icons/general.png',
          bannerUrl: '/banners/general.jpg',
          prompts: ['请介绍下你们学校的历史', '学校的专业设置有哪些?', '如何申请奖学金?']
        },
        { 
          id: 'china-arab',
          name: '中阿场景',
          iconUrl: '/icons/china-arab.png',
          bannerUrl: '/banners/china-arab.jpg',
          prompts: ['中阿旅游合作现状如何?', '沙特阿拉伯有哪些著名景点?', '阿拉伯文化的特点是什么?']
        },
        { 
          id: 'ideological',
          name: '思政场景',
          iconUrl: '/icons/ideological.png',
          bannerUrl: '/banners/ideological.jpg',
          prompts: ['如何理解中国特色社会主义?', '什么是民族复兴的中国梦?', '如何培养爱国情怀?']
        },
        { 
          id: 'regional',
          name: '区域国别场景',
          iconUrl: '/icons/regional.png',
          bannerUrl: '/banners/regional.jpg',
          prompts: ['一带一路倡议的主要内容是什么?', '中东地区的主要国家有哪些?', '北非地区的文化特色是什么?']
        },
        { 
          id: 'digital-human',
          name: '阿拉伯名人数字人',
          iconUrl: '/icons/digital-human.png',
          bannerUrl: '/banners/digital-human.jpg',
          prompts: ['伊本·西那的主要贡献是什么?', '阿维森纳在医学上有哪些成就?', '阿拉伯黄金时代有哪些著名学者?']
        }
      ],
      currentScene: null,
      messagesHistory: {}, // 按场景ID存储消息历史
      userInput: '',
      loading: false,
      showHistory: false
    }
  },
  computed: {
    currentMessages() {
      if (!this.currentScene) return [];
      return this.messagesHistory[this.currentScene.id] || [];
    }
  },
  created() {
    // 初始化选择第一个场景
    this.currentScene = this.scenes[0];
    
    // 初始化每个场景的消息历史
    this.scenes.forEach(scene => {
      this.messagesHistory[scene.id] = [];
    });
  },
  methods: {
    selectScene(scene) {
      this.currentScene = scene;
      this.scrollToBottom();
    },
    createNewChat() {
      // 清空当前场景的消息
      if (this.currentScene) {
        this.messagesHistory[this.currentScene.id] = [];
      }
    },
    toggleHistory() {
      this.showHistory = !this.showHistory;
      // 这里需要添加查看历史对话的逻辑
      // 可能需要从后端API获取历史对话
    },
    usePrompt(prompt) {
      this.userInput = prompt;
    },
    async sendMessage() {
      if (!this.userInput.trim() || this.loading) return;
      
      // 添加用户消息到聊天记录
      const sceneId = this.currentScene.id;
      this.messagesHistory[sceneId].push({
        content: this.userInput,
        sender: 'user'
      });
      
      const userQuestion = this.userInput;
      this.userInput = '';
      this.loading = true;
      
      try {
        // 发送请求到后端API，包含场景信息
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            question: userQuestion,
            scene: sceneId
          })
        });
        
        const data = await response.json();
        
        // 添加AI回复到聊天记录
        this.messagesHistory[sceneId].push({
          content: data.answer,
          sender: 'ai'
        });
      } catch (error) {
        console.error('获取回答时出错:', error);
        this.messagesHistory[sceneId].push({
          content: '抱歉，获取回答时出现问题，请稍后再试。',
          sender: 'ai'
        });
      } finally {
        this.loading = false;
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      }
    },
    scrollToBottom() {
      this.$nextTick(() => {
        if (this.$refs.messagesContainer) {
          this.$refs.messagesContainer.scrollTop = this.$refs.messagesContainer.scrollHeight;
        }
      });
    }
  }
}
</script>

<style scoped>
/* 主容器 */
.main-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* 左侧边栏样式 */
.sidebar {
  width: 250px;
  background-color: #f5f5f5;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  padding: 15px;
}

.sidebar-actions {
  display: flex;
  margin-bottom: 20px;
  gap: 10px;
}

.action-button {
  flex: 1;
  padding: 10px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-button.history {
  background-color: #2196f3;
}

.scene-list {
  flex: 1;
  overflow-y: auto;
}

.scene-item {
  display: flex;
  align-items: center;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.scene-item:hover {
  background-color: #e0e0e0;
}

.scene-item.active {
  background-color: #dcedc8;
}

.scene-icon {
  width: 40px;
  height: 40px;
  margin-right: 10px;
  border-radius: 50%;
  overflow: hidden;
}

.scene-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scene-name {
  font-weight: 500;
  flex: 1;
}

/* 右侧内容区域样式 */
.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 15px;
  overflow: hidden;
}

.scene-banner {
  height: 150px;
  position: relative;
  margin-bottom: 15px;
  border-radius: 8px;
  overflow: hidden;
}

.scene-banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scene-banner h2 {
  position: absolute;
  bottom: 10px;
  left: 15px;
  color: white;
  text-shadow: 0 0 5px rgba(0,0,0,0.8);
  margin: 0;
}

.prompt-suggestions {
  margin-bottom: 15px;
}

.prompt-suggestions h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #666;
}

.prompt-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.prompt-chip {
  padding: 6px 12px;
  background-color: #e8f5e9;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
}

.prompt-chip:hover {
  background-color: #c8e6c9;
}

/* 聊天区域样式 */
.chat-messages {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
}

.message {
  padding: 10px 15px;
  border-radius: 18px;
  max-width: 70%;
  word-break: break-word;
}

.user-message {
  align-self: flex-end;
  background-color: #dcf8c6;
}

.ai-message {
  align-self: flex-start;
  background-color: #f1f0f0;
  max-height: 150px;
  overflow-y: auto;
}

.loading-indicator {
  align-self: flex-start;
  padding: 10px;
  font-style: italic;
  color: #888;
}

.chat-input {
  display: flex;
  gap: 10px;
  height: 50px;
}

.chat-input input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
}

.chat-input button {
  padding: 10px 20px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.chat-input button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style>
<template>
  <div class="main-container">
    <!-- 历史对话面板 -->
    <HistoryPanel v-if="showHistory" :selectedChatId="currentChatId" @select-chat="loadChat"
      @create-new-chat="createNewChat" @chat-deleted="handleChatDeleted" class="history-panel" />

    <!-- 左侧边栏 -->
    <div class="sidebar">
      <!-- 顶部按钮 -->
      <div class="sidebar-actions">
        <button class="action-button new-chat" @click="createNewChat">
          <i class="icon-plus"></i> 新建对话
        </button>
        <router-link to="/admin" class="action-button admin">
          <i class="icon-settings"></i> 管理后台
        </router-link>
      </div>

      <!-- 场景选择列表 -->
      <div class="scene-list">
        <div v-for="(scene, index) in scenes" :key="index"
          :class="['scene-item', currentScene.id === scene.id ? 'active' : '']" @click="selectScene(scene)">
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

      <!-- 增强的网络状态指示器 -->
      <div v-if="!isApiConnected" class="network-status-warning">
        <el-alert
          title="网络连接中断"
          type="error"
          description="无法连接到后端API服务，请检查网络或联系管理员"
          show-icon
          :closable="false"
        >
          <!-- <template #default>
            <span>网络连接中断，部分功能可能不可用</span>
            <el-button @click="checkApiConnection" type="danger" size="small" class="retry-button">
              重试连接
            </el-button>
          </template> -->
        </el-alert>
      </div>

      <!-- 提示词区域 -->
      <div class="prompt-suggestions">
        <h3>可能的提示词:</h3>
        <div class="prompt-chips">
          <span v-for="(prompt, i) in currentScene.prompts" :key="i" class="prompt-chip" @click="usePrompt(prompt)">
            {{ prompt }}
          </span>
        </div>
      </div>

      <!-- 聊天消息区域 -->
      <div class="chat-messages" ref="messagesContainer">
        <div v-if="!currentMessages.length && !loading" class="welcome-message">
          <div class="message ai-message">
            <div class="message-content">{{ welcomeMessage }}</div>
          </div>
        </div>
        <div v-for="(message, index) in currentMessages" :key="index"
          :class="['message', message.sender === 'user' ? 'user-message' : 'ai-message']">
          <div class="message-content">{{ message.content }}</div>

          <!-- 附件展示区 -->
          <div v-if="message.attachments && message.attachments.length">
            <div v-for="(attachment, i) in message.attachments" :key="i" class="attachment">
              <img v-if="isImageAttachment(attachment.name)" :src="`data:image/png;base64,${attachment.data}`"
                :alt="attachment.name" />
              <a v-else @click="downloadAttachment(attachment)" href="javascript:void(0)">
                <span class="attachment-icon"></span>
                {{ attachment.name }}
              </a>
            </div>
          </div>

          <!-- 来源信息展示区 -->
          <div v-if="message.sources && message.sources.length" class="sources">
            <div class="sources-title">参考来源：</div>
            <ul>
              <li v-for="(source, i) in message.sources" :key="i">
                <a v-if="source.url" :href="source.url" target="_blank">
                  {{ source.title || source.document || '未知来源' }}
                </a>
                <span v-else>
                  {{ source.title || source.document || '未知来源' }}
                </span>
              </li>
            </ul>
          </div>
        </div>
        <div v-if="loading" class="loading-indicator">
          <span>思考中...</span>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="chat-input">
  <input
    v-model="userInput"
    @keyup.enter="!loading && (userInput.trim() || selectedFile) && sendMessage()"
    @keydown.up="recallLastMessage"
    placeholder="请输入您的问题..."
    :disabled="loading"
    ref="inputField"
  />

  <!-- 附件按钮 -->
  <!-- <div class="attachment-button">
    <input type="file" id="file-upload" ref="fileInput" @change="handleFileSelected" style="display:none" />
    <button class="attach-button" @click="triggerFileUpload" :disabled="loading">
      <i class="icon-paperclip"></i>
      <span>附件</span>
    </button> -->
    <!-- 文件预览 -->
    <!-- <div v-if="selectedFile" class="selected-file">
      <span>{{ selectedFile.name }}</span>
      <button class="remove-file" @click="removeSelectedFile">✕</button>
    </div>
  </div> -->

  <button
    @click="sendMessage"
    :disabled="(loading || (!userInput.trim() && !selectedFile))"
    class="send-button"
    :title="loading ? '正在发送...' : '发送消息'"
  >
    <span v-if="!loading" class="button-text">发送</span>
    <span v-else class="loading-dots"></span>
    <i :class="loading ? 'icon-loading' : 'icon-send'"></i>
  </button>
</div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick, watch } from 'vue';
import HistoryPanel from '@/components/HistoryPanel.vue';
import chatService from '@/services/chatService'; // 导入chatService

export default {
  name: 'ChatView',
  components: {
    HistoryPanel
  },
  data() {
    return {
      scenes: [], // 改为空数组，将通过API加载
      currentScene: null,
      messagesHistory: {}, // 按场景ID存储消息历史
      userInput: '',
      loading: false,
      showHistory: false,
      currentChatId: null,
      welcomeMessage: '你好！我是您的AI助手，请问有什么我可以帮您的？', // 默认欢迎消息
      selectedFile: null // 新增：用于存储选中的文件
    }
  },
  computed: {
    currentMessages() {
      if (!this.currentScene) return [];
      return this.messagesHistory[this.currentScene.id] || [];
    }
  },
  async created() {
    await this.loadScenes();
    await this.loadWelcomeMessage();

    // 初始化每个场景的消息历史
    this.scenes.forEach(scene => {
      if (!this.messagesHistory[scene.id]) {
        this.messagesHistory[scene.id] = [];
      }
    });
  },
  setup() {
    const isApiConnected = ref(false);
    const apiCheckInProgress = ref(false);
    const retryCount = ref(0);
    const maxRetries = 3;

    const checkApiConnection = async () => {
      if (apiCheckInProgress.value) return;
      
      apiCheckInProgress.value = true;
      console.log('检查API连接状态...');
      
      try {
        isApiConnected.value = await chatService.checkApiConnection();
        console.log('API连接状态:', isApiConnected.value ? '已连接' : '未连接');
        
        // 如果连接失败且未超过最大重试次数，则自动重试
        if (!isApiConnected.value && retryCount.value < maxRetries) {
          retryCount.value++;
          console.log(`连接失败，${5000}ms后自动重试 (${retryCount.value}/${maxRetries})...`);
          setTimeout(checkApiConnection, 5000);
        }
      } finally {
        apiCheckInProgress.value = false;
      }
    };

    const isImageAttachment = (filename) => {
      if (!filename) return false;
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
      return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
    };

    const downloadAttachment = (attachment) => {
      const link = document.createElement('a');
      link.href = `data:application/octet-stream;base64,${attachment.data}`;
      link.download = attachment.name;
      link.click();
    };

    const handleApiError = (error) => {
      console.error('聊天请求失败:', error);
    };

    const sendMessage = async () => {
      // ...existing code...
      try {
        const sceneId = currentScene.value.id; 
        const response = await chatService.sendChatMessage(
          userQuestion,
          localStorage.getItem('studentId') || '未知用户',
          sceneId
        );
        // ...existing code...
      } catch (err) {
        handleApiError(err);
      } finally {
        // ...existing code...
      }
    };

    onMounted(async () => {
      console.log('ChatView组件已挂载，正在初始化...');
      await checkApiConnection();
    });

    // 添加网络在线状态监听
    window.addEventListener('online', () => {
      console.log('检测到网络已恢复');
      checkApiConnection();
    });
    
    window.addEventListener('offline', () => {
      console.log('检测到网络已断开');
      isApiConnected.value = false;
    });

    return {
      isApiConnected,
      checkApiConnection,
      isImageAttachment,
      downloadAttachment,
      handleApiError,
      sendMessage
    };
  },
  methods: {
    async loadScenes() {
      try {
        this.loading = true;
        const response = await chatService.getScenes();

        if (response.data && Array.isArray(response.data)) {
          this.scenes = response.data;
        } else {
          this.scenes = [
            {
              id: 'general',
              name: '通用场景',
              iconUrl: '/icons/general.png',
              bannerUrl: '/banners/general.jpg',
              prompts: ['请介绍下你们学校的历史', '学校的专业设置有哪些?', '如何申请奖学金?']
            },
            {
              id: 'ideological',
              name: '思政场景',
              iconUrl: '/icons/ideological.png',
              bannerUrl: '/banners/ideological.jpg',
              prompts: ['如何理解中国特色社会主义?', '什么是民族复兴的中国梦?', '如何培养爱国情怀?']
            }
          ];
        }

        if (this.scenes.length > 0) {
          this.currentScene = this.scenes[0];
        }
      } catch (error) {
        console.error('加载场景数据失败:', error);
        this.scenes = [
          {
            id: 'general',
            name: '通用场景',
            iconUrl: '/icons/general.png',
            bannerUrl: '/banners/general.jpg',
            prompts: ['请介绍下你们学校的历史', '学校的专业设置有哪些?', '如何申请奖学金?']
          },
          {
            id: 'ideological',
            name: '思政场景',
            iconUrl: '/icons/ideological.png',
            bannerUrl: '/banners/ideological.jpg',
            prompts: ['如何理解中国特色社会主义?', '什么是民族复兴的中国梦?', '如何培养爱国情怀?']
          }
        ];
        this.currentScene = this.scenes[0];
      } finally {
        this.loading = false;
      }
    },
    async loadWelcomeMessage() {
      try {
        const response = await chatService.getGreeting();
        if (response.data && response.data.greeting) {
          this.welcomeMessage = response.data.greeting;
        }
      } catch (error) {
        console.error('获取欢迎消息失败:', error);
      }
    },
    selectScene(scene) {
      this.currentScene = scene;
      this.scrollToBottom();
    },
    createNewChat() {
      if (this.currentScene) {
        this.messagesHistory[this.currentScene.id] = [];
      }
      this.currentChatId = null;
      if (this.showHistory && window.innerWidth < 768) {
        this.showHistory = false;
      }
    },
    toggleHistory() {
      this.showHistory = !this.showHistory;
    },
    async loadChat(chatId) {
      try {
        this.loading = true;
        this.currentChatId = chatId;

        const response = await fetch(`/api/chats/${chatId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        const chatData = await response.json();

        const sceneId = chatData.sceneId || 'general';
        this.currentScene = this.scenes.find(scene => scene.id === sceneId) || this.scenes[0];

        this.messagesHistory[sceneId] = chatData.messages || [];

        if (window.innerWidth < 768) {
          this.showHistory = false;
        }

      } catch (error) {
        console.error('加载对话失败:', error);
      } finally {
        this.loading = false;
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      }
    },
    handleChatDeleted() {
      this.currentChatId = null;
      this.createNewChat();
    },
    usePrompt(prompt) {
      this.userInput = prompt;
    },
    async sendMessage() {
      if (!this.userInput.trim() && !this.selectedFile || this.loading) return;

      const sceneId = this.currentScene.id;
      this.messagesHistory[sceneId].push({
        content: this.userInput,
        sender: 'user'
      });

      const userQuestion = this.userInput;
      this.userInput = '';
      this.loading = true;

      try {
        const response = await chatService.sendChatMessage(
          userQuestion, 
          sceneId 
        );

        const data = response;
        this.messagesHistory[sceneId].push({
          content: data.response || data.answer || '没有回答',
          sender: 'ai',
          attachments: data.attachment_data || [],
          sources: data.sources || []
        });

        if (!this.currentChatId && data.chat_id) {
          this.currentChatId = data.chat_id;
        }
      } catch (error) {
        console.error('获取回答时出错:', error);
        let errorMessage = '抱歉，获取回答时出现问题，请稍后再试。';
        
        this.messagesHistory[sceneId].push({
          content: errorMessage,
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
    },
    recallLastMessage() {
      if (!this.userInput.trim() && this.currentScene) {
        const messages = this.messagesHistory[this.currentScene.id] || [];
        for (let i = messages.length - 1; i >= 0; i--) {
          if (messages[i].sender === 'user') {
            this.userInput = messages[i].content;
            this.$nextTick(() => {
              this.$refs.inputField.focus();
              this.$refs.inputField.setSelectionRange(
                this.userInput.length,
                this.userInput.length
              );
            });
            break;
          }
        }
      }
    },
    triggerFileUpload() {
      this.$refs.fileInput.click();
    },
    handleFileSelected(event) {
      const file = event.target.files[0];
      if (file) {
        this.selectedFile = file;
      }
    },
    removeSelectedFile() {
      this.selectedFile = null;
      this.$refs.fileInput.value = '';
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
  position: relative;
}

/* 历史面板样式 */
.history-panel {
  position: absolute;
  height: 100vh;
  z-index: 10;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  animation: slide-in 0.3s ease;
}

@keyframes slide-in {
  from {
    transform: translateX(-100%);
  }

  to {
    transform: translateX(0);
  }
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
  text-shadow: 0 0 5px rgba(0, 0, 0, 0.8);
  margin: 0;
}

/* 添加欢迎消息横幅样式 */
.greeting-banner {
  padding: 12px 15px;
  background-color: #e8f5e9;
  border-radius: 8px;
  margin-bottom: 15px;
  border: 1px solid #c8e6c9;
}

.greeting-content {
  color: #2e7d32;
  font-size: 15px;
  text-align: center;
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

/* 发送按钮样式增强 */
.send-button {
  padding: 10px 20px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  transition: all 0.2s ease;
  min-width: 90px;
}

/* 按钮悬停效果 */
.send-button:not(:disabled):hover {
  background-color: #45a049;
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

/* 按钮按下效果 */
.send-button:not(:disabled):active {
  transform: translateY(1px);
  box-shadow: none;
}

/* 禁用状态 */
.send-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  opacity: 0.7;
}

/* 发送过程中样式 */
.send-button.sending {
  background-color: #2196f3;
  animation: pulse 1.5s infinite;
}

/* 图标样式 */
.icon-send {
  display: inline-block;
  width: 16px;
  height: 16px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M2.01 21L23 12 2.01 3 2 10l15 2-15 2z'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
}

.icon-loading {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

/* 加载中动画 */
.loading-dots:after {
  content: '';
  animation: loading-dots 1.5s infinite;
}

@keyframes loading-dots {
  0% {
    content: '.';
  }

  33% {
    content: '..';
  }

  66% {
    content: '...';
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.7;
  }

  100% {
    opacity: 1;
  }
}

/* 添加欢迎消息样式 */
.welcome-message {
  margin-top: 20px;
}

.network-status-warning {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ffeb3b;
  color: #000;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.retry-button {
  margin-left: 10px;
  background-color: #c62828;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
}

.attachment {
  margin-top: 10px;
}

.sources {
  margin-top: 10px;
}

.sources-title {
  font-weight: bold;
  margin-bottom: 5px;
}

.icon-paperclip {
  display: inline-block;
  width: 16px;
  height: 16px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='white' viewBox='0 0 24 24'%3E%3Cpath d='M16.58 8.09l-5.66 5.66a2 2 0 01-2.83 0 2 2 0 010-2.83l5.66-5.66a1 1 0 011.42 1.42l-5.66 5.66a.002.002 0 000 .004l-.004.004a.75.75 0 101.06 1.06l5.66-5.66A2.998 2.998 0 0012 2a2.998 2.998 0 00-2.12.88l-5.66 5.66a4 4 0 005.66 5.66l5.66-5.66a3 3 0 00-4.24-4.24l-3.54 3.54a1 1 0 101.42 1.42l3.54-3.54c.39-.39 1.02-.39 1.41 0 .38.38.38 1.02 0 1.41l-5.66 5.66a2.5 2.5 0 01-3.53-3.53l5.66-5.66A4 4 0 0116.58 8.09z'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  margin-right: 4px;
}

.action-button.admin {
  background-color: #614caf;
  margin-left: 10px;
}

.action-button.admin:hover {
  background-color: #4a3b7d;
}

.icon-settings {
  display: inline-block;
  width: 16px;
  height: 16px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  margin-right: 5px;
}
</style>
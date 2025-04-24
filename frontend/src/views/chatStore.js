import { defineStore } from 'pinia';
import chatService from '@/services/chatService';
import { ElMessage } from 'element-plus';

export const useChatStore = defineStore('chat', {
  state: () => ({
    scenes: [], // 场景列表
    currentScene: null, // 当前选中的场景
    messagesHistory: {}, // 按场景ID存储消息历史 {sceneId: [messages]}
    userInput: '', // 用户输入内容
    loading: false, // 是否正在加载中
    showHistory: false, // 是否显示历史面板
    currentChatId: null, // 当前聊天ID
    welcomeMessage: '你好！我是您的AI助手，请问有什么我可以帮您的？', // 默认欢迎消息
    selectedFile: null, // 用户选择的文件
    isApiConnected: false, // API连接状态
    apiCheckInProgress: false, // API连接检查状态
    retryCount: 0, // 重试次数
  }),

  getters: {
    // 当前场景的消息列表
    currentMessages: (state) => {
      if (!state.currentScene) return [];
      return state.messagesHistory[state.currentScene.id] || [];
    },
  },

  actions: {
    /**
     * 加载可用的聊天场景
     */
    async loadScenes() {
      try {
        this.loading = true;
        const response = await chatService.getScenes();

        if (response.data && Array.isArray(response.data)) {
          this.scenes = response.data;
        } else {
          // 加载失败时使用默认场景
          this.scenes = [
            {
              id: 'general',
              name: 'AI助手',
              iconUrl: '/icons/general.png',
              bannerUrl: '/banners/general.jpg',
              prompts: ['请介绍下北京第二外国语学院http://10.10.15.210:5000', '北京第二外国语学院的专业有哪些?', '北京第二外国语学院如何申请奖学金?']
            },
            {
              id: 'ideological',
              name: '智慧思政',
              iconUrl: '/icons/ideological.png',
              bannerUrl: '/banners/ideological.jpg',
              prompts: ['如何理解中国特色社会主义?', '什么是民族复兴的中国梦?', '如何培养爱国情怀?']
            },
            {
              id: 'digital-human',
              name: '8001',
              iconUrl: '/icons/digital-human.png',
              bannerUrl: '/banners/digital-human.jpg',
              prompts: ['如何报修网络?', '如何充值饭卡?', '如何充值网费?']
            }
          ];
        }

        // 设置默认选中的场景
        if (this.scenes.length > 0 && !this.currentScene) {
          this.currentScene = this.scenes[0];
          
          // 初始化消息历史结构
          this.scenes.forEach(scene => {
            if (!this.messagesHistory[scene.id]) {
              this.messagesHistory[scene.id] = [];
            }
          });
        }
      } catch (error) {
        console.error('加载场景数据失败:', error);
        // 加载失败时使用默认场景
        this.scenes = [
          {
            id: 'general',
            name: 'AI助手',
            iconUrl: '/icons/general.png',
            bannerUrl: '/banners/general.jpg',
            prompts: ['请介绍下北京第二外国语学院http://10.10.15.210:5000', '北京第二外国语学院的专业设置有哪些?', '如何申请北京第二外国语学院奖学金?']
          },
          {
            id: 'ideological',
            name: '智慧思政',
            iconUrl: '/icons/ideological.png',
            bannerUrl: '/banners/ideological.jpg',
            prompts: ['如何理解中国特色社会主义?', '什么是民族复兴的中国梦?', '如何培养爱国情怀?']
          },
          {
            id: 'digital-human',
            name: '8001',
            iconUrl: '/icons/digital-human.png',
            bannerUrl: '/banners/digital-human.jpg',
            prompts: ['如何报修网络?', '如何充值饭卡?', '如何充值网费?']
          }
        ];
        this.currentScene = this.scenes[0];
      } finally {
        this.loading = false;
      }
    },

    /**
     * 加载欢迎消息
     */
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

    /**
     * 选择一个场景
     */
    selectScene(scene) {
      this.currentScene = scene;
    },

    /**
     * 创建新的聊天
     */
    createNewChat() {
      if (this.currentScene) {
        this.messagesHistory[this.currentScene.id] = [];
      }
      this.currentChatId = null;
      if (this.showHistory && window.innerWidth < 768) {
        this.showHistory = false;
      }
    },

    /**
     * 切换历史记录面板的显示状态
     */
    toggleHistory() {
      this.showHistory = !this.showHistory;
    },

    /**
     * 加载指定ID的聊天记录
     */
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
        ElMessage.error('加载对话失败');
      } finally {
        this.loading = false;
      }
    },

    /**
     * 处理聊天被删除的情况
     */
    handleChatDeleted() {
      this.currentChatId = null;
      this.createNewChat();
    },

    /**
     * 使用提示词填充输入框
     */
    usePrompt(prompt) {
      this.userInput = prompt;
    },

    /**
     * 发送消息并获取AI回复
     */
    async sendMessage() {
      if ((!this.userInput.trim() && !this.selectedFile) || this.loading) return;

      const sceneId = this.currentScene.id;
      this.messagesHistory[sceneId] = this.messagesHistory[sceneId] || [];
      
      // 添加用户消息到历史
      this.messagesHistory[sceneId].push({
        content: this.userInput,
        sender: 'user'
      });

      const userQuestion = this.userInput;
      this.userInput = '';
      this.loading = true;

      try {
        // 调用API发送消息
        const response = await chatService.sendChatMessage(
          userQuestion, 
          sceneId 
        );

        const data = response;
        
        // 添加AI回复到历史
        this.messagesHistory[sceneId].push({
          content: data.response || data.answer || '没有回答',
          sender: 'ai',
          attachments: data.attachment_data || [],
          sources: data.sources || []
        });

        // 如果是新的对话，保存对话ID
        if (!this.currentChatId && data.chat_id) {
          this.currentChatId = data.chat_id;
        }
      } catch (error) {
        console.error('获取回答时出错:', error);
        let errorMessage = '抱歉，获取回答时出现问题，请稍后再试。';
        
        // 添加错误消息到历史
        this.messagesHistory[sceneId].push({
          content: errorMessage,
          sender: 'ai'
        });
        
        ElMessage.error(errorMessage);
      } finally {
        this.loading = false;
      }
    },

    /**
     * 当用户按上箭头键时，恢复上一次的输入
     */
    recallLastMessage() {
      if (!this.userInput.trim() && this.currentScene) {
        const messages = this.messagesHistory[this.currentScene.id] || [];
        for (let i = messages.length - 1; i >= 0; i--) {
          if (messages[i].sender === 'user') {
            this.userInput = messages[i].content;
            break;
          }
        }
      }
    },

    /**
     * 设置用户选择的文件
     */
    handleFileSelected(file) {
      this.selectedFile = file;
    },

    /**
     * 移除用户选择的文件
     */
    removeSelectedFile() {
      this.selectedFile = null;
    },

    /**
     * 检查API连接状态
     */
    async checkApiConnection() {
      if (this.apiCheckInProgress) return;
      
      this.apiCheckInProgress = true;
      console.log('检查API连接状态...');
      
      try {
        this.isApiConnected = await chatService.checkApiConnection();
        console.log('API连接状态:', this.isApiConnected ? '已连接' : '未连接');
        
        const maxRetries = 3;
        // 如果连接失败且未超过最大重试次数，则自动重试
        if (!this.isApiConnected && this.retryCount < maxRetries) {
          this.retryCount++;
          console.log(`连接失败，5000ms后自动重试 (${this.retryCount}/${maxRetries})...`);
          setTimeout(() => this.checkApiConnection(), 5000);
        }
      } finally {
        this.apiCheckInProgress = false;
      }
    },

    /**
     * 是否是图片附件
     */
    isImageAttachment(filename) {
      if (!filename) return false;
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
      return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
    },

    /**
     * 下载附件
     */
    downloadAttachment(attachment) {
      const link = document.createElement('a');
      link.href = `data:application/octet-stream;base64,${attachment.data}`;
      link.download = attachment.name;
      link.click();
    },

    /**
     * 处理API错误
     */
    handleApiError(error) {
      console.error('聊天请求失败:', error);
      ElMessage.error('请求失败，请检查网络连接');
    },

    /**
     * 初始化store
     */
    async initialize() {
      await this.loadScenes();
      await this.loadWelcomeMessage();
      await this.checkApiConnection();
      
      // 添加网络事件监听
      window.addEventListener('online', () => {
        console.log('检测到网络已恢复');
        this.checkApiConnection();
      });
      
      window.addEventListener('offline', () => {
        console.log('检测到网络已断开');
        this.isApiConnected = false;
      });
    }
  }
});
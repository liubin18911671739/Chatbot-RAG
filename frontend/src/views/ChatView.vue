<template>
  <div class="main-container">
    <!-- 左侧边栏 -->
    <div class="sidebar">
      <!-- 学校Logo和系统名称 -->
      <div class="campus-logo-container">
        <img src="/haitang.png" alt="北外" class="campus-logo">
        <div class="campus-name">棠心问答</div>
      </div>
      
      <!-- 顶部按钮 -->
      <div class="sidebar-actions">
        <button class="campus-btn sidebar-btn new-chat" @click="createNewChat">
          <i class="icon-plus"></i>新对话
        </button>
      </div>

      <!-- 场景选择列表 -->
      <div class="scene-list-header">
        <span>服务分类</span>
        <div class="campus-semester">2025年春季学期</div>
      </div>
      
      <div class="scene-list">
        <div v-for="(scene, index) in scenes" :key="index"
          :class="['scene-item', currentScene && currentScene.id === scene.id ? 'active' : '']" @click="selectScene(scene)">
          <div class="scene-icon">
            <img :src="scene.iconUrl" :alt="scene.name" />
          </div>
          <div class="scene-name">{{ scene.name }}</div>
        </div>
      </div>
      
      <!-- 用户信息与退出 -->
      <div class="user-section">
        <div class="user-info">
          <div class="user-avatar">{{ getUserInitial() }}</div>
          <div class="user-detail">
            <div class="user-name">{{ getUserId() }}</div>
            <div class="user-role">{{ getUserRole() === 'admin' ? '管理员' : '学生' }}</div>
          </div>
        </div>
        <button @click="logoutSystem" class="logout-btn">
          <i class="icon-logout"></i>
        </button>
      </div>
    </div>

    <!-- 右侧内容区 -->
    <div class="content">
      <!-- 场景图片展示 -->
      <div v-if="currentScene" class="scene-banner">
        <img :src="currentScene.bannerUrl" :alt="currentScene.name" />
        <div class="banner-overlay"></div>
        <h2>{{ currentScene.name }}</h2>
        
        <!-- 校园元素装饰 -->
        <div class="campus-decoration">
          <div class="campus-badge">北京第二外国语学院</div>
        </div>
      </div>

      <!-- 增强的网络状态指示器 -->
      <div v-if="!isApiConnected" class="network-status-warning">
        <div class="warning-icon">!</div>
        <div class="warning-message">
          <div class="warning-title">网络连接中断</div>
          <div class="warning-desc">无法连接到校园服务器，请检查网络或联系信息中心</div>
        </div>
        <button @click="checkApiConnection" class="retry-button">重试</button>
      </div>

      <!-- 提示词区域 -->
      <div v-if="currentScene && currentScene.prompts && currentScene.prompts.length > 0" class="prompt-suggestions campus-card">
        <!-- <div class="prompt-header">
          <div class="prompt-title">常见问题:</div>
          <div class="school-term">北外二学期</div>
        </div> -->
        <div class="prompt-chips">
          <span v-for="(prompt, i) in currentScene.prompts" :key="i" class="prompt-chip" @click="usePrompt(prompt)">
            {{ prompt }}
          </span>
        </div>
      </div>

      <!-- 聊天消息区域 -->
      <div class="chat-messages" ref="messagesContainer">
        <div v-if="!currentMessages.length && !loading" class="welcome-message">
          <!-- <div class="campus-welcome-card">
            <div class="welcome-header">
              <img src="/haitang.png" alt="校徽" class="welcome-logo">
              <div class="welcome-title">欢迎使用北二外智慧校园助手</div>
            </div>
            <div class="welcome-body">
              {{ welcomeMessage }}
            </div>
            <div class="campus-tips">
              <div class="tip-item">
                <div class="tip-icon">💡</div>
                <div class="tip-text">可以向我询问校园生活、学习、政策等问题</div>
              </div>
              <div class="tip-item">
                <div class="tip-icon">📝</div>
                <div class="tip-text">左侧可选择不同场景获取相关帮助</div>
              </div>
            </div>
          </div> -->
        </div>
        
        <div v-for="(message, index) in currentMessages" :key="index"
          :class="['message', message.sender === 'user' ? 'user-message' : 'ai-message']">
          <div class="message-avatar">
            <div v-if="message.sender === 'user'" class="user-avatar">{{ getUserInitial() }}</div>
            <div v-else class="ai-avatar"><img src="/haitang.png" alt="校徽"></div>
          </div>
          <div class="message-content">
            <div class="message-header">
              <div class="message-sender">{{ message.sender === 'user' ? '你' : 'iBISU' }}</div>
              <div class="message-time">{{ formatTime(message.timestamp || Date.now()) }}</div>
            </div>
            <div class="message-body">
              <span v-if="message.sender === 'user'">{{ message.content }}</span>
              <TypewriterText 
                v-else 
                :content="renderMarkdown(message.content)" 
                :typing="enableTypewriter" 
                :speed="typingSpeed"
                :htmlContent="true"
                @typing-finished="onTypingFinished(message)"
              />
            </div>
          </div>

          <!-- 附件展示区 -->
          <div v-if="message.attachments && message.attachments.length" class="attachment-area">
            <div v-for="(attachment, i) in message.attachments" :key="i" class="attachment">
              <img v-if="isImageAttachment(attachment.name)" :src="`data:image/png;base64,${attachment.data}`"
                :alt="attachment.name" class="attachment-image" />
              <a v-else @click="downloadAttachment(attachment)" href="javascript:void(0)" class="attachment-file">
                <span class="attachment-icon"></span>
                {{ attachment.name }}
              </a>
            </div>
          </div>

          <!-- 来源信息展示区 -->
          <div v-if="message.sources && message.sources.length" class="sources">
            <div class="sources-title">参考来源：</div>
            <ul class="sources-list">
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
          <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div class="typing-text">正在思考中</div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="chat-input-container">
        <div class="chat-input">
          <div class="autocomplete-wrapper">
            <input
              v-model="userInput"
              @keyup.enter="!loading && (userInput.trim() || selectedFile) && sendMessage()"
              @keydown.up="navigateSuggestion('up')"
              @input="handleInputChange"
              @keydown.down="navigateSuggestion('down')"
              @keydown.up.prevent="navigateSuggestion('up')"
              @keydown.escape="closeSuggestions"
              placeholder="请输入您的问题..."
              :disabled="loading"
              ref="inputField"
              class="campus-input"
            />
            
            <!-- 自动补全下拉菜单 - 显示在上方 -->
            <div v-if="showSuggestions && filteredSuggestions.length > 0" class="autocomplete-dropdown autocomplete-above">
              <div 
                v-for="(suggestion, index) in filteredSuggestions" 
                :key="index" 
                @click="selectSuggestion(suggestion)"
                :class="['autocomplete-item', {'active': index === selectedSuggestionIndex}]"
              >
                <div class="suggestion-content">
                  <div v-if="suggestion.type === 'local'" class="suggestion-icon local">
                    <i class="icon-local"></i>
                  </div>
                  <div v-else class="suggestion-icon api">
                    <i class="icon-api"></i>
                  </div>
                  <div class="suggestion-text">{{ suggestion.text }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 附件按钮 -->
          <div v-if="false" class="attachment-button">
            <input type="file" id="file-upload" ref="fileInput" @change="handleFileSelected" style="display:none" />
            <button class="attach-button campus-btn" @click="triggerFileUpload" :disabled="loading">
              <i class="icon-paperclip"></i>
            </button>
          </div>

          <button
            @click="sendMessage"
            :disabled="(loading || (!userInput.trim() && !selectedFile))"
            class="campus-btn campus-btn-primary send-button"
          >
            <span v-if="!loading">发送</span>
            <span v-else class="sending-spinner"></span>
          </button>
        </div>
        
        <div class="campus-footer">
          <div class="campus-footer-text">© 2025 北京第二外国语学院 - 棠心问答</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick, watch, computed, reactive } from 'vue';
import chatService from '@/services/chatService';
import TypewriterText from '@/components/TypewriterText.vue';
import { ElMessage } from 'element-plus';
import MarkdownIt from 'markdown-it';

export default {
  name: 'ChatView',
  components: {
    TypewriterText
  },
  setup() {
    // 创建markdown解析器实例
    const md = new MarkdownIt({
      html: false,        // 禁用HTML标签
      breaks: true,       // 将\n转换为<br>
      linkify: true       // 自动将URL转为链接
    });
    
    // 创建响应式状态
    const scenes = ref([]);
    const currentScene = ref(null);
    const messagesHistory = ref({});
    const userInput = ref('');
    const loading = ref(false);
    const currentChatId = ref(null);
    const welcomeMessage = ref('你好！我是您的AI助手，请问有什么我可以帮您的？');
    const selectedFile = ref(null);
    const isApiConnected = ref(false);
    const apiCheckInProgress = ref(false);
    const retryCount = ref(0);
    
    // 添加打字机效果状态
    const enableTypewriter = ref(true); // 是否启用打字机效果
    const typingSpeed = ref(30); // 打字速度(ms)
    
    // DOM 引用
    const messagesContainer = ref(null);
    const inputField = ref(null);
    const fileInput = ref(null);

    // 计算属性
    const currentMessages = computed(() => {
      if (!currentScene.value) return [];
      return messagesHistory.value[currentScene.value.id] || [];
    });

    // 过滤后的建议列表
    const filteredSuggestions = computed(() => {
      if (!userInput.value || userInput.value.trim().length < 2) return [];
      return suggestions.value;
    });

    // 方法
    const loadScenes = async () => {
      try {
        loading.value = true;
        const response = await chatService.getScenes();

        if (response.data && Array.isArray(response.data)) {
          scenes.value = response.data;
        } else {
          // 加载失败时使用默认场景
          scenes.value = [
            {
              id: 'general',
              name: 'AI助手',
              iconUrl: '/icons/general.png',
              bannerUrl: '/banners/general.jpg',
              prompts: ['请介绍下北京第二外国语学院的历史', '北京第二外国语学院的专业设置有哪些?', '如何申请北京第二外国语学院奖学金?']
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
              prompts: ['北京第二外国语学院如何报修网络?', '北京第二外国语学院如何充值饭卡?', '如何充值网费?']
            }
          ];
        }

        // 设置默认选中的场景
        if (scenes.value.length > 0 && !currentScene.value) {
          currentScene.value = scenes.value[0];
          
          // 初始化消息历史结构
          scenes.value.forEach(scene => {
            if (!messagesHistory.value[scene.id]) {
              messagesHistory.value[scene.id] = [];
            }
          });
        }
      } catch (error) {
        console.error('加载场景数据失败:', error);
        // 加载失败时使用默认场景
        scenes.value = [
          {
            id: 'general',
            name: 'AI助手',
            iconUrl: '/icons/general.png',
            bannerUrl: '/banners/general.jpg',
            prompts: ['请介绍下北京第二外国语学院的历史', '北京第二外国语学院的专业有哪些?', '如何申请北京第二外国语学院奖学金?']
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
              prompts: ['北京第二外国语学院如何报修网络?', '北京第二外国语学院如何充值饭卡?', '北京第二外国语学院如何充值网费?']
            }
        ];
        currentScene.value = scenes.value[0];
      } finally {
        loading.value = false;
      }
    };

    const loadWelcomeMessage = async () => {
      try {
        const response = await chatService.getGreeting();
        if (response.data && response.data.greeting) {
          welcomeMessage.value = response.data.greeting;
        }
      } catch (error) {
        console.error('获取欢迎消息失败:', error);
      }
    };

    const selectScene = (scene) => {
      currentScene.value = scene;
    };

    const createNewChat = () => {
      if (currentScene.value) {
        messagesHistory.value[currentScene.value.id] = [];
      }
      currentChatId.value = null;
    };

    const usePrompt = (prompt) => {
      userInput.value = prompt;
    };

    const sendMessage = async () => {
      if ((!userInput.value.trim() && !selectedFile.value) || loading.value) return;

      const sceneId = currentScene.value.id;
      messagesHistory.value[sceneId] = messagesHistory.value[sceneId] || [];
      
      // 添加用户消息到历史
      messagesHistory.value[sceneId].push({
        content: userInput.value,
        sender: 'user'
      });

      const userQuestion = userInput.value;
      userInput.value = '';
      loading.value = true;

      try {
        // 调用API发送消息
        const response = await chatService.sendChatMessage(
          userQuestion, 
          sceneId 
        );

        const data = response;
        
        // 添加AI回复到历史
        messagesHistory.value[sceneId].push({
          content: data.response || data.answer || '没有回答',
          sender: 'ai',
          attachments: data.attachment_data || [],
          sources: data.sources || []
        });

        // 如果是新的对话，保存对话ID
        if (!currentChatId.value && data.chat_id) {
          currentChatId.value = data.chat_id;
        }
      } catch (error) {
        console.error('获取回答时出错:', error);
        let errorMessage = '抱歉，获取回答时出现问题，请稍后再试。';
        
        // 添加错误消息到历史
        messagesHistory.value[sceneId].push({
          content: errorMessage,
          sender: 'ai'
        });
        
        ElMessage.error(errorMessage);
      } finally {
        loading.value = false;
      }
    };

    const recallLastMessage = () => {
      if (!userInput.value.trim() && currentScene.value) {
        const messages = messagesHistory.value[currentScene.value.id] || [];
        for (let i = messages.length - 1; i >= 0; i--) {
          if (messages[i].sender === 'user') {
            userInput.value = messages[i].content;
            break;
          }
        }
      }
    };

    const handleFileSelected = (event) => {
      const file = event.target.files[0];
      if (file) {
        selectedFile.value = file;
      }
    };

    const removeSelectedFile = () => {
      selectedFile.value = null;
    };

    const checkApiConnection = async () => {
      if (apiCheckInProgress.value) return;
      
      apiCheckInProgress.value = true;
      console.log('检查API连接状态...');
      
      try {
        isApiConnected.value = await chatService.checkApiConnection();
        console.log('API连接状态:', isApiConnected.value ? '已连接' : '未连接');
        
        const maxRetries = 3;
        // 如果连接失败且未超过最大重试次数，则自动重试
        if (!isApiConnected.value && retryCount.value < maxRetries) {
          retryCount.value++;
          console.log(`连接失败，600000ms后自动重试 (${retryCount.value}/${maxRetries})...`);
          setTimeout(() => checkApiConnection(), 600000);
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
      ElMessage.error('请求失败，请检查网络连接');
    };

    const initialize = async () => {
      await loadScenes();
      await loadWelcomeMessage();
      await checkApiConnection();
      
      // 添加网络事件监听
      window.addEventListener('online', () => {
        console.log('检测到网络已恢复');
        checkApiConnection();
      });
      
      window.addEventListener('offline', () => {
        console.log('检测到网络已断开');
        isApiConnected.value = false;
      });
    };

    // 自动滚动到底部方法
    const scrollToBottom = () => {
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
        }
      });
    };

    // 触发文件上传
    const triggerFileUpload = () => {
      if (fileInput.value) {
        fileInput.value.click();
      }
    };

    // 监听消息变化，自动滚动到底部
    watch(() => currentMessages.value, () => {
      nextTick(() => {
        scrollToBottom();
      });
    }, { deep: true });

    // 退出系统功能
    const logoutSystem = () => {
      // 清除登录状态
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // 显示退出成功消息
      ElMessage.success('退出系统成功');
      
      // 跳转到登录页面
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    };

    // 格式化时间显示
    const formatTime = (timestamp) => {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    
    // 获取用户名首字母作为头像
    const getUserInitial = () => {
      const userId = getUserId();
      return userId ? userId.charAt(0).toUpperCase() : '用';
    };
    
    // 获取用户ID
    const getUserId = () => {
      return localStorage.getItem('userId') || '用户';
    };
    
    // 获取用户角色
    const getUserRole = () => {
      return localStorage.getItem('userRole') || 'user';
    };
    
    // 打字机效果完成后的回调
    const onTypingFinished = (message) => {
      // 可以添加一些效果，比如滚动到底部
      scrollToBottom();
      
      // 或者添加已读标记等
      if (message && !message.read) {
        message.read = true;
      }
    };

    // 处理输入框变化
    const handleInputChange = async (event) => {
      userInput.value = event.target.value;
      
      // 如果输入为空或者太短，不显示建议
      if (!userInput.value || userInput.value.trim().length < 2) {
        showSuggestions.value = false;
        return;
      }
      
      // 重置选中建议的索引
      selectedSuggestionIndex.value = 0;
      
      // 显示本地建议
      showSuggestions.value = true;
      
      // 检查本地建议
      const localMatches = localSuggestions.value.filter(
        s => s.text.toLowerCase().includes(userInput.value.toLowerCase())
      ).map(s => ({ ...s, type: 'local' }));
      
      // 根据输入更新建议
      suggestions.value = [...localMatches];
      
      // 延迟调用API获取建议，减少不必要的请求
      clearTimeout(apiRequestTimeout.value);
      apiRequestTimeout.value = setTimeout(async () => {
        try {
          // 如果输入已更改，不继续请求
          if (!userInput.value || userInput.value.trim().length < 2) return;
          
          // 获取API建议
          const response = await chatService.getSuggestions(userInput.value);
          
          // 如果请求返回时输入已变化，不更新建议
          if (response.data && Array.isArray(response.data) && userInput.value.trim().length >= 2) {
            // 将API结果转换为建议格式并添加到建议列表
            const apiSuggestions = response.data.map(item => ({
              text: item,
              type: 'api'
            }));
            
            // 更新建议列表，保留本地匹配并添加API结果
            suggestions.value = [...localMatches, ...apiSuggestions];
          }
        } catch (error) {
          console.warn('获取API建议失败:', error);
          // 保持本地匹配结果
        }
      }, 300); // 300ms延迟，减少频繁API调用
    };

    // 导航建议
    const navigateSuggestion = (direction) => {
      if (!showSuggestions.value || filteredSuggestions.value.length === 0) return;
      
      if (direction === 'down') {
        selectedSuggestionIndex.value = (selectedSuggestionIndex.value + 1) % filteredSuggestions.value.length;
      } else if (direction === 'up') {
        if (selectedSuggestionIndex.value <= 0) {
          selectedSuggestionIndex.value = filteredSuggestions.value.length - 1;
        } else {
          selectedSuggestionIndex.value -= 1;
        }
      }
    };

    // 选择建议
    const selectSuggestion = (suggestion) => {
      userInput.value = suggestion.text;
      showSuggestions.value = false;
      // 选择后聚焦回输入框
      nextTick(() => {
        if (inputField.value) {
          inputField.value.focus();
        }
      });
    };

    // 关闭建议
    const closeSuggestions = () => {
      showSuggestions.value = false;
    };

    // 响应式变量：建议相关
    const localSuggestions = ref([
      { text: '北京第二外国语学院简介', type: 'local' },
      { text: '北京第二外国语学院历史', type: 'local' },
      { text: '北京第二外国语学院专业设置', type: 'local' },
      { text: '北京第二外国语学院如何申请奖学金', type: 'local' },
      { text: '北京第二外国语学院校园卡充值方法', type: 'local' },
      { text: '北京第二外国语学院图书馆开放时间', type: 'local' },
      { text: '北京第二外国语学院选课系统使用指南', type: 'local' },
      { text: '北京第二外国语学院校内住宿申请流程', type: 'local' },
      { text: '北京第二外国语学院校车时刻表', type: 'local' },
      { text: '北京第二外国语学院网络故障报修', type: 'local' },
      { text: '北京第二外国语学院网络充值', type: 'local' },
      { text: '北京第二外国语学院网络', type: 'local' },
      { text: '北京第二外国语学院校园卡', type: 'local' },
      { text: '北京第二外国语学院图书馆', type: 'local' },
      { text: '北京第二外国语学院选课系统', type: 'local' },
      { text: '北京第二外国语学院住宿申请', type: 'local' },
      { text: '北京第二外国语学院校车时刻表', type: 'local' }
    ]);
    const suggestions = ref([]);
    const showSuggestions = ref(false);
    const selectedSuggestionIndex = ref(0);
    const apiRequestTimeout = ref(null);

    // 生命周期钩子
    onMounted(() => {
      console.log('ChatView组件已挂载，正在初始化...');
      // 初始化
      initialize();
    });

    const renderMarkdown = (content) => {
      return md.render(content);
    };

    return {
      scenes,
      currentScene,
      messagesHistory,
      userInput,
      loading,
      currentChatId,
      welcomeMessage,
      selectedFile,
      isApiConnected,
      currentMessages,
      messagesContainer,
      inputField,
      fileInput,
      loadScenes,
      loadWelcomeMessage,
      selectScene,
      createNewChat,
      usePrompt,
      sendMessage,
      recallLastMessage,
      handleFileSelected,
      removeSelectedFile,
      checkApiConnection,
      isImageAttachment,
      downloadAttachment,
      handleApiError,
      initialize,
      scrollToBottom,
      triggerFileUpload,
      logoutSystem,
      renderMarkdown,
      enableTypewriter,
      typingSpeed,
      formatTime,
      getUserInitial,
      getUserId,
      getUserRole,
      onTypingFinished,
      handleInputChange,
      navigateSuggestion,
      selectSuggestion,
      closeSuggestions,
      filteredSuggestions,
      suggestions,
      showSuggestions,
      selectedSuggestionIndex
    };
  }
}
</script>

<style scoped>
/* 主容器 - 校园风格 */
.main-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
  position: relative;
  background-color: var(--campus-secondary);
  color: var(--campus-neutral-800);
  font-family: var(--campus-font-sans);
}

/* 左侧边栏样式 - 校园风格 */
.sidebar {
  width: 260px;
  background-color: var(--campus-primary-dark);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  padding: 20px;
  color: white;
  position: relative;
  overflow: hidden;
}

/* 校园装饰元素 */
.sidebar::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><path fill="%23ffffff" opacity="0.03" d="M30,10C10,25,10,75,30,90C50,75,50,25,30,10Z"/></svg>');
  background-repeat: repeat;
  background-size: 100px;
  pointer-events: none;
  opacity: 0.15;
}

.campus-logo-container {
  display: flex;
  align-items: center;
  margin-bottom: 25px;
  background-color: rgba(255, 255, 255, 0.1);
  padding: 12px;
  border-radius: var(--campus-radius-lg);
}

.campus-logo {
  width: 36px;
  height: 36px;
  margin-right: 12px;
  border-radius: 50%;
  background-color: white;
  padding: 3px;
}

.campus-name {
  font-size: 18px;
  font-weight: bold;
  color: white;
  letter-spacing: 1px;
}

.sidebar-actions {
  display: flex;
  margin-bottom: 25px;
  gap: 10px;
}

.sidebar-btn {
  flex: 1;
  padding: 10px;
  border-radius: var(--campus-radius);
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--campus-transition);
  background-color: rgba(255, 255, 255, 0.15);
  color: white;
  border: none;
}

.sidebar-btn:hover {
  background-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}

.sidebar-btn.new-chat {
  background-color: var(--campus-primary-light);
}

.scene-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.scene-list-header .campus-semester {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  background-color: rgba(255, 255, 255, 0.15);
  padding: 5px 10px;
  border-radius: 12px;
}

.scene-list {
  flex: 1;
  overflow-y: auto;
  margin-top: 10px;
  padding-right: 5px;
  margin-bottom: 20px;
}

.scene-list::-webkit-scrollbar {
  width: 4px;
}

.scene-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.scene-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.scene-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 12px;
  border-radius: var(--campus-radius);
  cursor: pointer;
  transition: var(--campus-transition);
  background-color: rgba(255, 255, 255, 0.08);
}

.scene-item:hover {
  background-color: rgba(255, 255, 255, 0.15);
  transform: translateX(3px);
}

.scene-item.active {
  background-color: var(--campus-primary-light);
  box-shadow: var(--campus-shadow-md);
}

.scene-icon {
  width: 40px;
  height: 40px;
  min-width: 40px;
  margin-right: 12px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: var(--campus-shadow);
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: var(--campus-transition);
  background-color: white;
}

.scene-item.active .scene-icon {
  border: 2px solid white;
  transform: scale(1.1);
}

.scene-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scene-name {
  font-weight: 500;
  letter-spacing: 0.5px;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 用户信息区域样式 */
.user-section {
  margin-top: auto;
  background-color: rgba(0, 0, 0, 0.15);
  border-radius: var(--campus-radius);
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--campus-accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 10px;
  font-size: 16px;
}

.user-detail {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 500;
  font-size: 14px;
  color: white;
}

.user-role {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.logout-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.15);
  color: white;
  border: none;
  cursor: pointer;
  transition: var(--campus-transition);
}

.logout-btn:hover {
  background-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}

/* 右侧内容区域样式 - 校园风格 */
.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px;
  overflow: hidden;
  background-color: var(--campus-neutral-200);
  position: relative;
}

/* 场景横幅 - 校园风格 */
.scene-banner {
  height: 100px;
  position: relative;
  margin-bottom: 24px;
  border-radius: var(--campus-radius-lg);
  overflow: hidden;
  box-shadow: var(--campus-shadow-md);
  transition: var(--campus-transition);
  border: 1px solid var(--campus-neutral-300);
}

.scene-banner:hover {
  transform: translateY(-3px);
  box-shadow: var(--campus-shadow-lg);
}

.banner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.6));
  pointer-events: none;
  z-index: 1;
}

.scene-banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 5s ease;
}

.scene-banner:hover img {
  transform: scale(1.05);
}

.scene-banner h2 {
  position: absolute;
  bottom: 15px;
  left: 20px;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  margin: 0;
  font-size: 1.5rem;
  z-index: 2;
  font-family: var(--campus-font-serif);
}

/* 校园装饰元素 */
.campus-decoration {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 2;
}

.campus-badge {
  display: inline-block;
  padding: 8px 15px;
  background-color: rgba(255, 255, 255, 0.9);
  color: var(--campus-primary-dark);
  font-size: 14px;
  font-weight: 600;
  border-radius: 20px;
  box-shadow: var(--campus-shadow);
}

/* 网络状态警告 - 校园风格 */
.network-status-warning {
  display: flex;
  align-items: center;
  background-color: rgba(var(--campus-error), 0.1);
  padding: 15px;
  border-radius: var(--campus-radius);
  margin-bottom: 20px;
  border: 1px solid rgba(var(--campus-error), 0.3);
}

.warning-icon {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: var(--campus-error);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 15px;
}

.warning-message {
  flex: 1;
}

.warning-title {
  font-weight: 600;
  color: var(--campus-error);
  margin-bottom: 5px;
}

.warning-desc {
  font-size: 14px;
  color: var(--campus-neutral-700);
}

.retry-button {
  padding: 8px 15px;
  background-color: var(--campus-error);
  color: white;
  border: none;
  border-radius: var(--campus-radius);
  cursor: pointer;
  transition: var(--campus-transition);
  font-weight: 500;
  margin-left: 15px;
}

.retry-button:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

/* 提示词区域 - 校园风格 */
.prompt-suggestions {
  margin-bottom: 24px;
  padding: 0;
  border-radius: var(--campus-radius-lg);
  overflow: hidden;
  background-color: white;
  box-shadow: var(--campus-shadow);
  transition: var(--campus-transition);
}

.prompt-suggestions:hover {
  box-shadow: var(--campus-shadow-md);
}

.prompt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: var(--campus-primary);
  color: white;
}

.prompt-title {
  font-weight: 600;
  font-size: 16px;
}

.school-term {
  font-size: 13px;
  padding: 4px 12px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
}

.prompt-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 15px 20px;
}

.prompt-chip {
  padding: 8px 15px;
  background-color: var(--campus-neutral-200);
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: var(--campus-transition);
  border: 1px solid var(--campus-neutral-300);
  color: var(--campus-neutral-800);
}

.prompt-chip:hover {
  background-color: var(--campus-primary-light);
  color: white;
  transform: translateY(-2px);
  box-shadow: var(--campus-shadow);
  border-color: transparent;
}

/* 欢迎消息卡片 - 校园风格 */
.campus-welcome-card {
  background-color: white;
  border-radius: var(--campus-radius-lg);
  overflow: hidden;
  box-shadow: var(--campus-shadow);
  margin: 20px 0;
  transition: var(--campus-transition);
  border: 1px solid var(--campus-neutral-300);
}

.campus-welcome-card:hover {
  box-shadow: var(--campus-shadow-md);
  transform: translateY(-3px);
}

.welcome-header {
  display: flex;
  align-items: center;
  padding: 20px;
  background-color: var(--campus-primary);
  color: white;
}

.welcome-logo {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: white;
  padding: 3px;
  margin-right: 15px;
}

.welcome-title {
  font-size: 18px;
  font-weight: 600;
}

.welcome-body {
  padding: 20px;
  color: var(--campus-neutral-800);
  font-size: 16px;
  line-height: 1.6;
}

.campus-tips {
  background-color: var(--campus-neutral-200);
  padding: 15px 20px;
  border-top: 1px solid var(--campus-neutral-300);
}

.tip-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 10px;
}

.tip-item:last-child {
  margin-bottom: 0;
}

.tip-icon {
  margin-right: 10px;
  font-size: 18px;
}

.tip-text {
  flex: 1;
  color: var(--campus-neutral-700);
  font-size: 14px;
}

/* 聊天消息区域 - 校园风格 */
.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 20px;
  background-color: white;
  border-radius: var(--campus-radius-lg);
  box-shadow: var(--campus-shadow);
  border: 1px solid var(--campus-neutral-300);
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: var(--campus-neutral-200);
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: var(--campus-neutral-400);
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: var(--campus-neutral-500);
}

.message {
  display: flex;
  max-width: 85%;
  animation: message-appear 0.3s ease;
  position: relative;
}

.message-avatar {
  margin-right: 12px;
  align-self: flex-start;
}

.ai-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  overflow: hidden;
  background-color: var(--campus-primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-avatar img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.message-content {
  flex: 1;
  overflow: hidden;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.message-sender {
  font-weight: 600;
  font-size: 14px;
  color: var(--campus-neutral-700);
}

.message-time {
  font-size: 12px;
  color: var(--campus-neutral-500);
}

.message-body {
  padding: 12px 16px;
  border-radius: var(--campus-radius);
  word-break: break-word;
  box-shadow: var(--campus-shadow-sm);
}

.user-message .message-body {
  background-color: var(--campus-accent);
  color: white;
  border-top-right-radius: 0;
  margin-left: auto;
}

.user-message {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.user-message .message-avatar {
  margin-right: 0;
  margin-left: 12px;
}

.user-message .message-header {
  flex-direction: row-reverse;
}

.ai-message .message-body {
  background-color: var(--campus-neutral-200);
  color: var(--campus-neutral-900);
  border-top-left-radius: 0;
}

@keyframes message-appear {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 加载指示器 - 校园风格 */
.loading-indicator {
  align-self: flex-start;
  display: flex;
  align-items: center;
  background-color: var(--campus-neutral-200);
  padding: 10px 20px;
  border-radius: 20px;
  animation: pulse 1.5s infinite;
  margin-left: 50px;
}

.typing-dots {
  display: flex;
  align-items: center;
  margin-right: 10px;
}

.typing-dots span {
  display: inline-block;
  width: 8px;
  height: 8px;
  background-color: var(--campus-primary);
  border-radius: 50%;
  margin-right: 5px;
  animation: typing-dots 1.5s infinite;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

.typing-text {
  font-size: 14px;
  color: var(--campus-neutral-700);
}

@keyframes typing-dots {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
    background-color: var(--campus-primary-light);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* 输入区域 - 校园风格 */
.chat-input-container {
  display: flex;
  flex-direction: column;
}

.chat-input {
  display: flex;
  gap: 12px;
  padding: 15px;
  background-color: white;
  border-radius: var(--campus-radius);
  box-shadow: var(--campus-shadow); 
  border: 1px solid var(--campus-neutral-300);
}

.chat-input input {
  flex: 1;
  padding: 12px 20px;
  border: 1px solid var(--campus-neutral-400);
  width: 95%; /* 可以设置固定宽度或百分比 */
  border-radius: var(--campus-radius);
  font-size: 16px;
  background-color: white;
  color: var(--campus-neutral-900);
  transition: var(--campus-transition);
}

.chat-input input:focus {
  outline: none;
  border-color: var(--campus-primary);
  box-shadow: 0 0 0 3px rgba(62, 128, 85, 0.2);
}

.chat-input input::placeholder {
  color: var(--campus-neutral-500);
}

.send-button {
  padding: 12px 25px;
  background-color: var(--campus-primary);
  color: white;
  border: none;
  border-radius: var(--campus-radius);
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: var(--campus-transition);
  min-width: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-button:hover:not(:disabled) {
  background-color: var(--campus-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--campus-shadow);
}

.send-button:disabled {
  background-color: var(--campus-neutral-400);
  color: var(--campus-neutral-100);
  cursor: not-allowed;
}

.sending-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 附件相关样式 - 校园风格 */
.attachment-area {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.attachment {
  background-color: var(--campus-neutral-200);
  padding: 8px 12px;
  border-radius: var(--campus-radius);
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  border: 1px solid var(--campus-neutral-300);
}

.attachment-image {
  max-width: 200px;
  max-height: 150px;
  border-radius: var(--campus-radius);
}

.attachment-file {
  color: var(--campus-primary);
  text-decoration: none;
  display: flex;
  align-items: center;
  transition: var(--campus-transition);
}

.attachment-file:hover {
  color: var(--campus-primary-dark);
  text-decoration: underline;
}

.attachment-icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 6px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%233e8055' viewBox='0 0 24 24'%3E%3Cpath d='M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
}

/* 来源信息 - 校园风格 */
.sources {
  margin-top: 15px;
  padding: 12px 15px;
  background-color: var(--campus-neutral-200);
  border-radius: var(--campus-radius);
  font-size: 14px;
  border: 1px solid var(--campus-neutral-300);
}

.sources-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--campus-neutral-800);
  display: flex;
  align-items: center;
}

.sources-title::before {
  content: "";
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 8px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%233e8055' viewBox='0 0 24 24'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
}

.sources-list {
  margin: 0;
  padding-left: 24px;
  color: var(--campus-neutral-700);
}

.sources li {
  margin-bottom: 6px;
}

.sources a {
  color: var(--campus-primary);
  text-decoration: none;
  transition: var(--campus-transition);
}

.sources a:hover {
  color: var(--campus-primary-dark);
  text-decoration: underline;
}

/* 校园页脚 */
.campus-footer {
  margin-top: 15px;
  text-align: center;
  color: var(--campus-neutral-600);
  font-size: 12px;
}

/* 图标样式 */
.icon-plus, .icon-history, .icon-logout {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 8px;
  background-size: contain;
  background-repeat: no-repeat;
}

.icon-plus {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z'/%3E%3C/svg%3E");
}

.icon-history {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z'/%3E%3C/svg%3E");
}

.icon-logout {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z'/%3E%3C/svg%3E");
}

/* 自动补全样式 */
.autocomplete-wrapper {
  position: relative;
  flex: 1;
}

.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: white;
  border: 1px solid var(--campus-neutral-300);
  border-top: none;
  border-radius: 0 0 var(--campus-radius) var(--campus-radius);
  box-shadow: var(--campus-shadow-md);
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
}

.autocomplete-above {
  bottom: 100%;
  top: auto;
  border-radius: var(--campus-radius) var(--campus-radius) 0 0;
  border-bottom: none;
  border-top: 1px solid var(--campus-neutral-300);
  box-shadow: var(--campus-shadow-md);
  margin-bottom: 5px;
}

.autocomplete-item {
  padding: 10px 16px;
  cursor: pointer;
  transition: var(--campus-transition);
}

.autocomplete-item:hover, .autocomplete-item.active {
  background-color: var(--campus-neutral-200);
}

.suggestion-content {
  display: flex;
  align-items: center;
}

.suggestion-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
}

.suggestion-icon.local {
  background-color: var(--campus-neutral-300);
}

.suggestion-icon.api {
  background-color: var(--campus-primary-light);
  color: white;
}

.suggestion-icon .icon-local,
.suggestion-icon .icon-api {
  width: 14px;
  height: 14px;
  background-size: contain;
  background-repeat: no-repeat;
  display: inline-block;
}

.suggestion-icon .icon-local {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z'/%3E%3C/svg%3E");
}

.suggestion-icon .icon-api {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7v2H8v2h8v-2h-2v-2h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H3V4h18v12z'/%3E%3C/svg%3E");
}

.suggestion-text {
  font-size: 14px;
  color: var(--campus-neutral-800);
}

/* 响应式设计增强 - 校园风格 */
@media (max-width: 768px) {
  .sidebar {
    width: 80px;
    padding: 15px 10px;
  }

  .campus-logo-container {
    justify-content: center;
    padding: 10px;
  }
  
  .campus-logo {
    margin-right: 0;
  }
  
  .campus-name {
    display: none;
  }
  
  .scene-name {
    display: none;
  }
  
  .scene-icon {
    margin-right: 0;
  }
  
  .sidebar-btn {
    padding: 10px;
    justify-content: center;
  }
  
  .sidebar-btn .icon-plus,
  .sidebar-btn .icon-history {
    margin-right: 0;
  }
  
  .sidebar-btn span {
    display: none;
  }
  
  .scene-list-header {
    justify-content: center;
  }
  
  .scene-list-header span {
    display: none;
  }
  
  .campus-semester {
    display: none;
  }
  
  .user-detail {
    display: none;
  }
  
  .content {
    padding: 15px;
  }
  
  .message {
    max-width: 90%;
  }
  
  .chat-input {
    padding: 10px;
  }
  
  .send-button {
    min-width: auto;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    padding: 0;
    justify-content: center;
    align-items: center;
  }
  
  .send-button span {
    display: none;
  }
  
  .send-button::after {
    content: "";
    display: inline-block;
    width: 20px;
    height: 20px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M2.01 21L23 12 2.01 3 2 10l15 2-15 2z'/%3E%3C/svg%3E");
    background-size: contain;
    background-repeat: no-repeat;
  }
}
</style>
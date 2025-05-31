<template>
  <div class="main-container">
    <!-- 左侧边栏 -->
    <div class="sidebar">
      <!-- 学校Logo和系统名称 -->
      <div class="campus-logo-container">
        <img src="/robot.png" alt="北京第二外国语学院" class="campus-logo">
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
        <!-- <div class="campus-semester">2025年春季学期</div> -->
      </div>
      
      <div class="scene-list">
        <div v-for="(scene, index) in scenes" :key="index"
          :class="['scene-item', currentScene && currentScene.id === scene.id ? 'active' : '']" @click="selectScene(scene)">
          <div class="scene-icon">
            <img :src="scene.iconUrl" :alt="scene.name" />
          </div>
          <!-- <div class="scene-name">{{ scene.name }}</div> -->
        </div>
      </div>
        <!-- 校园共建按钮 -->
      <!-- <div class="campus-contribution-section">
        <button 
          :class="['campus-contribution-btn', {'active': isContributionFormVisible}]" 
          @click="showContributionForm"
        >
          <img src="/logo_construction.png" alt="校园共建" class="contribution-logo">
        </button>
      </div> -->
      
      <!-- 用户信息与退出 -->
      <div class="user-section">
        <div class="user-info">
          <!-- <div class="user-avatar">{{ "用户" }}</div> -->
          <div class="user-detail">
            <div class="user-name">{{ getUserId() }}</div>
            <!-- <div class="user-role">{{ getUserRole() === 'admin' ? '管理员' : '学生' }}</div> -->
          </div>
        </div>
        <button @click="logoutSystem" class="logout-btn">
          <i class="icon-logout"></i>
        </button>
      </div>
    </div>

    <!-- 右侧内容区 -->
    <div class="content">      <!-- 场景图片展示 -->
      <div v-if="currentScene" class="scene-banner">
        <div class="banner-text" style="white-space: normal; overflow-wrap: break-word; max-width: 100%;">世界语者 人文化成</div>
        <!-- <h2>{{ currentScene.name }}</h2> -->
        
        <!-- 校园元素装饰 -->
        <!-- <div class="campus-decoration">
          <div class="campus-badge">北京第二外国语学院</div>
        </div> -->
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
        <div class="prompt-header">
          <div class="prompt-title">{{ currentScene.name }}</div>
          <!-- <div class="school-term">北外二学期</div> -->
        </div> 

        <!-- <div class="prompt-chips">
          <span v-for="(prompt, i) in currentScene.prompts" :key="i" class="prompt-chip" @click="usePrompt(prompt)">
            {{ prompt }}
          </span>
        </div> -->
     <!-- 校园共建表单 -->
      <CampusContribution 
        v-if="isContributionFormVisible" 
        @contribution-submitted="toggleContributionForm" 
      />

      <!-- 聊天消息区域 -->
      <div class="chat-messages" ref="messagesContainer" v-show="!isContributionFormVisible">
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
            <!-- <div v-if="message.sender === 'user'" class="user-avatar">{{ getUserInitial() }}</div> -->
            <!-- <div v-else class="ai-avatar"><img src="/robot.png" alt="校徽"></div> -->
          </div> 
          <div class="message-content">
            <!-- <div class="message-header">
              <div class="message-sender">{{ message.sender === 'user' ? '你' : 'iBISU' }}</div>
              <div class="message-time">{{ formatTime(message.timestamp || Date.now()) }}</div>
            </div> -->
            <div class="message-body">
              <span v-if="message.sender === 'user'">{{ message.content }}</span>
              <TypewriterText 
                v-else 
                :content="renderMarkdown(message.content)" 
                :typing="enableTypewriter" 
                :speed="typingSpeed"
                :htmlContent="true"
                @typing-finished="onTypingFinished(message)"
                @typing-progress="handleTypingProgress"
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
      </div>      <!-- 输入区域 -->
      <div class="chat-input-container" v-show="!isContributionFormVisible">
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
import { ref, onMounted, onUnmounted, nextTick, watch, computed, reactive } from 'vue';
import chatService from '@/services/chatService';
import TypewriterText from '@/components/TypewriterText.vue';
import CampusContribution from '@/components/CampusContribution.vue'; // 导入校园共建组件
import { ElMessage } from 'element-plus';
import MarkdownIt from 'markdown-it';
import { useChatStore } from '@/stores/chatStore'; // 导入chatStore

export default {
  name: 'ChatView',
  components: {
    TypewriterText,
    CampusContribution
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
    const welcomeMessage = ref('你好！我是棠心问答AI辅导员，随时为你提供帮助～可以解答思想困惑、学业指导、心理调适等成长问题，也能推荐校园资源。请随时告诉我你的需求，我会用AI智慧陪伴你成长！✨');
    const selectedFile = ref(null);
    const isApiConnected = ref(false);
    const apiCheckInProgress = ref(false);
    const retryCount = ref(0);
      // 校园共建表单控制
    const isContributionFormVisible = ref(false);

    // 显示或隐藏校园共建表单
    const toggleContributionForm = () => {
      isContributionFormVisible.value = !isContributionFormVisible.value;
      // 如果显示表单，则可能需要重置消息输入框
      if (isContributionFormVisible.value) {
        userInput.value = '';
      }
      // 表单显示后滚动到顶部
      if (isContributionFormVisible.value) {
        nextTick(() => {
          if (messagesContainer.value) {
            messagesContainer.value.scrollTop = 0;
          }
        });
      }
    };
    
    // 校园共建表单显示方法
    const showContributionForm = () => {
      toggleContributionForm();
    };
    
    // 添加打字机效果状态
    const enableTypewriter = ref(true); // 是否启用打字机效果
    const typingSpeed = ref(30); // 打字速度(ms)

    // 平滑滚动设置
    const enableSmoothScroll = ref(true); // 默认启用平滑滚动
    
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
        } else {          // 加载失败时使用默认场景
          scenes.value = [
            {
              id: 'general',
              name: 'AI辅导员',
              iconUrl: iconUrl(),
              bannerUrl: '/banners/banner.png',
              prompts: ['怎么给一卡通充值?']
            },
            {
              id: 'ideological',
              name: '智慧思政',
              iconUrl: '/icons/ideological.png',
              bannerUrl: '/banners/banner.png',
              prompts: ['北京第二外国语学院的校训?']
            },
            {
              id: 'construction',
              name: '校园共建',
              iconUrl: '/icons/logo_construction.png',
              bannerUrl: '/banners/digital-human.jpg',
              prompts: ['北京第二外国语学院如何报修网络?', '北京第二外国语学院如何充值饭卡?', '北京第二外国语学院如何充值网费?']
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
        console.error('加载场景数据失败:', error);        // 加载失败时使用默认场景
        scenes.value = [
          {
            id: 'general',
            name: 'AI助手',
            iconUrl: iconUrl(),
            bannerUrl:'/banners/banner.png',
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
              id: 'construction',
              name: '校园共建',
              iconUrl: '/icons/logo_construction.png',
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
    };    const selectScene = (scene) => {
      currentScene.value = scene;
      // 如果选择的场景是校园共建，则显示校园共建表单
      if (scene.id === 'construction') {
        isContributionFormVisible.value = true;
      } else {
        isContributionFormVisible.value = false;
      }
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
      
      // 获取用户问题内容
      const userQuestion = userInput.value.trim();
      
      // 添加用户消息到历史
      messagesHistory.value[sceneId].push({
        content: userQuestion,
        sender: 'user',
        timestamp: Date.now()
      });

      userInput.value = '';
      loading.value = true;

      try {
        // 引入chatStore获取缓存功能
        const chatStore = useChatStore();
        
        // 1. 首先检查缓存中是否有相同问题的答案
        const cachedAnswer = chatStore.findCachedAnswer(userQuestion);
        
        if (cachedAnswer) {
          console.log('使用缓存的回答');
          
          // 如果有缓存的答案，直接使用缓存的答案
          messagesHistory.value[sceneId].push({
            content: cachedAnswer,
            sender: 'ai',
            timestamp: Date.now(),
            fromCache: true // 标记是来自缓存的答案
          });
          
        } else {
          console.log('没有缓存，调用API');
          
          // 没有缓存，调用API获取回答
          const response = await chatService.sendChatMessage(
            userQuestion, 
            sceneId 
          );

          const data = response;
          
          // 获取AI回复内容
          const aiResponse = data.response || data.answer || '没有回答';
          
          // 添加到缓存
          chatStore.addToQACache(userQuestion, aiResponse);
          
          // 添加AI回复到历史
          messagesHistory.value[sceneId].push({
            content: aiResponse,
            sender: 'ai',
            timestamp: Date.now(),
            attachments: data.attachment_data || [],
            sources: data.sources || []
          });

          // 如果是新的对话，保存对话ID
          if (!currentChatId.value && data.chat_id) {
            currentChatId.value = data.chat_id;
          }
        }
      } catch (error) {
        console.error('获取回答时出错:', error);
        let errorMessage = '抱歉，获取回答时出现问题，请稍后再试。';
        
        // 添加错误消息到历史
        messagesHistory.value[sceneId].push({
          content: errorMessage,
          sender: 'ai',
          timestamp: Date.now()
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

    // 一行一行平滑滚动到底部 - ChatGPT风格
    const smoothScrollToBottom = () => {
      if (!messagesContainer.value) return;
      
      const container = messagesContainer.value;
      const targetPosition = container.scrollHeight;
      const startPosition = container.scrollTop;
      const distance = targetPosition - startPosition;
      
      // 如果距离很小，直接滚动到底部
      if (distance < 20) {
        container.scrollTop = targetPosition;
        return;
      }

      // 使用更平滑的动画
      const duration = 300; // 滚动的总持续时间(ms)
      const startTime = performance.now();
      
      // 使用requestAnimationFrame来创建平滑的滚动动画
      const scrollAnimation = (currentTime) => {
        const elapsedTime = currentTime - startTime;
        
        if (elapsedTime >= duration) {
          container.scrollTop = targetPosition;
          return;
        }
        
        // 使用缓动函数使滚动更自然
        const progress = elapsedTime / duration;
        const easeInOutCubic = progress < 0.5 
          ? 4 * progress * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        container.scrollTop = startPosition + distance * easeInOutCubic;
        requestAnimationFrame(scrollAnimation);
      };
      
      requestAnimationFrame(scrollAnimation);
    };

    // 监听打字机效果的进度，实现实时滚动
    const handleTypingProgress = (progress) => {
      if (messagesContainer.value) {
        // 只有在接近底部时才自动滚动
        const container = messagesContainer.value;
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        
        if (isNearBottom) {
          // 轻微滚动让出现的新内容可见
          container.scrollTop = container.scrollHeight;
        }
      }
    };

    // 替换原来的scrollToBottom方法
    const scrollToBottom = () => {
      nextTick(() => {
        if (messagesContainer.value) {
          // 根据用户配置决定是否使用平滑滚动
          if (enableSmoothScroll.value) {
            smoothScrollToBottom();
          } else {
            // 传统的直接跳转
            messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
          }
        }
      });
    };

    // 监听消息变化，自动滚动到底部
    watch(() => currentMessages.value, () => {
      nextTick(() => {
        scrollToBottom();
      });
    }, { deep: true });
    
    // 监听loading状态变化，当加载结束后滚动到底部
    watch(() => loading.value, (newVal, oldVal) => {
      if (oldVal === true && newVal === false) {
        scrollToBottom();
      }
    });

    // 监听当前场景变化，切换场景后滚动到底部
    watch(() => currentScene.value, () => {
      nextTick(() => {
        scrollToBottom();
      });
    });

    // 设置自动检测内容高度变化并滚动到底部
    const observeContentChanges = () => {
      if (messagesContainer.value && window.ResizeObserver) {
        const resizeObserver = new ResizeObserver(() => {
          scrollToBottom();
        });
        resizeObserver.observe(messagesContainer.value);
        
        // 返回清理函数用于组件卸载时停止监听
        return () => {
          resizeObserver.disconnect();
        };
      }
      return null;
    };

    // 触发文件上传
    const triggerFileUpload = () => {
      if (fileInput.value) {
        fileInput.value.click();
      }
    };

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
      // return userId ? userId.charAt(0).toUpperCase() : '用户';
      return userId && /^\d{8}$/.test(userId) ? '教师' : '用户';

    };

    // 获取general 地址URL
    const iconUrl = () => {
      const userId = getUserId();
      return userId && /^\d{8}$/.test(userId) ? '/icons/general-teacher.png' : '/icons/general.png';
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
    const suggestion = [
       { text: '党政办公室综合事务的电话是多少？', type: 'local' },
    { text: '党政办公室综合事务的办公室是？', type: 'local' },
    { text: '65778005是哪个部门的电话？', type: 'local' },
    { text: '明德楼303是哪个部门的办公室？', type: 'local' },
    { text: '党政办公室党办事务的电话是多少？', type: 'local' },
    { text: '党政办公室党办事务的办公室是？', type: 'local' },
    { text: '65778315是哪个部门的电话？', type: 'local' },
    { text: '明德楼316是哪个部门的办公室？', type: 'local' },
    { text: '党政办公室发展规划的电话是多少？', type: 'local' },
    { text: '党政办公室发展规划的办公室是？', type: 'local' },
    { text: '65778312是哪个部门的电话？', type: 'local' },
    { text: '明德楼312是哪个部门的办公室？', type: 'local' },
    { text: '党政办公室法律事务的电话是多少？', type: 'local' },
    { text: '党政办公室法律事务的办公室是？', type: 'local' },
    { text: '65778596是哪个部门的电话？', type: 'local' },
    { text: '党政办公室机要保密的电话是多少？', type: 'local' },
    { text: '党政办公室机要保密的办公室是？', type: 'local' },
    { text: '65778485是哪个部门的电话？', type: 'local' },
    { text: '明德楼311是哪个部门的办公室？', type: 'local' },
    { text: '党政办公室综合档案的电话是多少？', type: 'local' },
    { text: '党政办公室综合档案的办公室是？', type: 'local' },
    { text: '65778458是哪个部门的电话？', type: 'local' },
    { text: '明德楼122是哪个部门的办公室？', type: 'local' },
    { text: '党政办公室传真的电话是多少？', type: 'local' },
    { text: '65761909是哪个部门的电话？', type: 'local' },
    { text: '党委组织部副处级组织员室的电话是多少？', type: 'local' },
    { text: '党委组织部副处级组织员室的办公室是？', type: 'local' },
    { text: '65778591是哪个部门的电话？', type: 'local' },
    { text: '明德楼317是哪个部门的办公室？', type: 'local' },
    { text: '党委组织部干部的电话是多少？', type: 'local' },
    { text: '党委组织部干部的办公室是？', type: 'local' },
    { text: '党委组织部组织的电话是多少？', type: 'local' },
    { text: '党委组织部组织的办公室是？', type: 'local' },
    { text: '65778592是哪个部门的电话？', type: 'local' },
    { text: '明德楼333是哪个部门的办公室？', type: 'local' },
    { text: '党委统战部统战的电话是多少？', type: 'local' },
    { text: '党委统战部统战的办公室是？', type: 'local' },
    { text: '65778731是哪个部门的电话？', type: 'local' },
    { text: '明德楼318是哪个部门的办公室？', type: 'local' },
    { text: '党委统战部督学的电话是多少？', type: 'local' },
    { text: '党委统战部督学的办公室是？', type: 'local' },
    { text: '人事处(党委教师工作部)人才工作办公室的电话是多少？', type: 'local' },
    { text: '人事处(党委教师工作部)人才工作办公室的办公室是？', type: 'local' },
    { text: '65778903是哪个部门的电话？', type: 'local' },
    { text: '明德楼207是哪个部门的办公室？', type: 'local' },
    { text: '人事处(党委教师工作部)党委教师工作部(教师发展中心)的电话是多少？', type: 'local' },
    { text: '人事处(党委教师工作部)党委教师工作部(教师发展中心)的办公室是？', type: 'local' },
    { text: '65778417是哪个部门的电话？', type: 'local' },
    { text: '明德楼335是哪个部门的办公室？', type: 'local' },
    { text: '人事处(党委教师工作部)师资的电话是多少？', type: 'local' },
    { text: '人事处(党委教师工作部)师资的办公室是？', type: 'local' },
    { text: '65778705是哪个部门的电话？', type: 'local' },
    { text: '明德楼205是哪个部门的办公室？', type: 'local' },
    { text: '人事处(党委教师工作部)劳资的电话是多少？', type: 'local' },
    { text: '人事处(党委教师工作部)劳资的办公室是？', type: 'local' },
    { text: '65778009是哪个部门的电话？', type: 'local' },
    { text: '明德楼215是哪个部门的办公室？', type: 'local' },
    { text: '人事处(党委教师工作部)社保的电话是多少？', type: 'local' },
    { text: '人事处(党委教师工作部)社保的办公室是？', type: 'local' },
    { text: '人事处(党委教师工作部)人事档案的电话是多少？', type: 'local' },
    { text: '人事处(党委教师工作部)人事档案的办公室是？', type: 'local' },
    { text: '65778354是哪个部门的电话？', type: 'local' },
    { text: '明德楼116是哪个部门的办公室？', type: 'local' },
    { text: '党委宣传部校史办的电话是多少？', type: 'local' },
    { text: '党委宣传部校史办的办公室是？', type: 'local' },
    { text: '65778374是哪个部门的电话？', type: 'local' },
    { text: '明德楼222是哪个部门的办公室？', type: 'local' },
    { text: '党委宣传部网络宣传的电话是多少？', type: 'local' },
    { text: '党委宣传部网络宣传的办公室是？', type: 'local' },
    { text: '65778307是哪个部门的电话？', type: 'local' },
    { text: '明德楼226是哪个部门的办公室？', type: 'local' },
    { text: '党委宣传部新闻中心的电话是多少？', type: 'local' },
    { text: '党委宣传部新闻中心的办公室是？', type: 'local' },
    { text: '65778482是哪个部门的电话？', type: 'local' },
    { text: '明德楼230是哪个部门的办公室？', type: 'local' },
    { text: '党委宣传部思政工作办公室的电话是多少？', type: 'local' },
    { text: '党委宣传部思政工作办公室的办公室是？', type: 'local' },
    { text: '65778481是哪个部门的电话？', type: 'local' },
    { text: '明德楼218是哪个部门的办公室？', type: 'local' },
    { text: '党委学生工作部武装部的电话是多少？', type: 'local' },
    { text: '党委学生工作部武装部的办公室是？', type: 'local' },
    { text: '65778488是哪个部门的电话？', type: 'local' },
    { text: '明德楼111是哪个部门的办公室？', type: 'local' },
    { text: '党委学生工作部学生资助中心的电话是多少？', type: 'local' },
    { text: '党委学生工作部学生资助中心的办公室是？', type: 'local' },
    { text: '党委学生工作部国际学生办(公费)的电话是多少？', type: 'local' },
    { text: '党委学生工作部国际学生办(公费)的办公室是？', type: 'local' },
    { text: '65767014是哪个部门的电话？', type: 'local' },
    { text: '党委学生工作部学生思政(信息化建设)的电话是多少？', type: 'local' },
    { text: '党委学生工作部学生思政(信息化建设)的办公室是？', type: 'local' },
    { text: '65778466是哪个部门的电话？', type: 'local' },
    { text: '明德楼117是哪个部门的办公室？', type: 'local' },
    { text: '党委学生工作部学生党建(辅导员队伍建设)的电话是多少？', type: 'local' },
    { text: '党委学生工作部学生党建(辅导员队伍建设)的办公室是？', type: 'local' },
    { text: '65778543是哪个部门的电话？', type: 'local' },
    { text: '党委学生工作部学生服务(学风建设、一站式建设)的电话是多少？', type: 'local' },
    { text: '党委学生工作部学生服务(学风建设、一站式建设)的办公室是？', type: 'local' },
    { text: '党委学生工作部就业事务、就业市场及档案管理的电话是多少？', type: 'local' },
    { text: '党委学生工作部就业事务、就业市场及档案管理的办公室是？', type: 'local' },
    { text: '65778480是哪个部门的电话？', type: 'local' },
    { text: '明德楼123是哪个部门的办公室？', type: 'local' },
    { text: '党委学生工作部就业指导及就业研究的电话是多少？', type: 'local' },
    { text: '党委学生工作部就业指导及就业研究的办公室是？', type: 'local' },
    { text: '65778584是哪个部门的电话？', type: 'local' },
    { text: '党委学生工作部心理咨询中心的电话是多少？', type: 'local' },
    { text: '党委学生工作部心理咨询中心的办公室是？', type: 'local' },
    { text: '65778194是哪个部门的电话？', type: 'local' },
    { text: '知行楼113是哪个部门的办公室？', type: 'local' },
    { text: '党委安全稳定工作部交通的电话是多少？', type: 'local' },
    { text: '党委安全稳定工作部交通的办公室是？', type: 'local' },
    { text: '65778530是哪个部门的电话？', type: 'local' },
    { text: '西马路平房004(内)是哪个部门的办公室？', type: 'local' },
    { text: '党委安全稳定工作部户籍内勤的电话是多少？', type: 'local' },
    { text: '党委安全稳定工作部户籍内勤的办公室是？', type: 'local' },
    { text: '65778373是哪个部门的电话？', type: 'local' },
    { text: '西马路平房004(外)是哪个部门的办公室？', type: 'local' },
    { text: '党委安全稳定工作部政保的电话是多少？', type: 'local' },
    { text: '党委安全稳定工作部政保的办公室是？', type: 'local' },
    { text: '65778372是哪个部门的电话？', type: 'local' },
    { text: '西马路平房011是哪个部门的办公室？', type: 'local' },
    { text: '党委安全稳定工作部治安的电话是多少？', type: 'local' },
    { text: '党委安全稳定工作部治安的办公室是？', type: 'local' },
    { text: '65778557是哪个部门的电话？', type: 'local' },
    { text: '西马路平房009是哪个部门的办公室？', type: 'local' },
    { text: '党委安全稳定工作部消防的电话是多少？', type: 'local' },
    { text: '党委安全稳定工作部消防的办公室是？', type: 'local' },
    { text: '纪检监察办公室纪检监察办公室的电话是多少？', type: 'local' },
    { text: '纪检监察办公室纪检监察办公室的办公室是？', type: 'local' },
    { text: '65778594是哪个部门的电话？', type: 'local' },
    { text: '明德楼412是哪个部门的办公室？', type: 'local' },
    { text: '巡察办公室巡察办公室的电话是多少？', type: 'local' },
    { text: '巡察办公室巡察办公室的办公室是？', type: 'local' },
    { text: '65778502是哪个部门的电话？', type: 'local' },
    { text: '明德楼407是哪个部门的办公室？', type: 'local' },
    { text: '教务处教学研究科的电话是多少？', type: 'local' },
    { text: '教务处教学研究科的办公室是？', type: 'local' },
    { text: '65778284是哪个部门的电话？', type: 'local' },
    { text: '明德楼214是哪个部门的办公室？', type: 'local' },
    { text: '教务处本科招生办公室的电话是多少？', type: 'local' },
    { text: '教务处本科招生办公室的办公室是？', type: 'local' },
    { text: '65778007是哪个部门的电话？', type: 'local' },
    { text: '明德楼202是哪个部门的办公室？', type: 'local' },
    { text: '教务处考试中心的电话是多少？', type: 'local' },
    { text: '教务处考试中心的办公室是？', type: 'local' },
    { text: '65778006是哪个部门的电话？', type: 'local' },
    { text: '教务处贯通培养管理科的电话是多少？', type: 'local' },
    { text: '教务处贯通培养管理科的办公室是？', type: 'local' },
    { text: '65778285是哪个部门的电话？', type: 'local' },
    { text: '教务处教学运行管理科办公室的电话是多少？', type: 'local' },
    { text: '教务处教学运行管理科办公室的办公室是？', type: 'local' },
    { text: '65778411是哪个部门的电话？', type: 'local' },
    { text: '明德楼208是哪个部门的办公室？', type: 'local' },
    { text: '教务处教学质量监控科的电话是多少？', type: 'local' },
    { text: '教务处教学质量监控科的办公室是？', type: 'local' },
    { text: '65475386是哪个部门的电话？', type: 'local' },
    { text: '65778924是哪个部门的电话？', type: 'local' },
    { text: '明德楼216是哪个部门的办公室？', type: 'local' },
    { text: '教务处教学运行管理科的电话是多少？', type: 'local' },
    { text: '教务处教学运行管理科的办公室是？', type: 'local' },
    { text: '教务处学籍学历管理科的电话是多少？', type: 'local' },
    { text: '教务处学籍学历管理科的办公室是？', type: 'local' },
    { text: '65778975是哪个部门的电话？', type: 'local' },
    { text: '明德楼220是哪个部门的办公室？', type: 'local' },
    { text: '科研处科研项目管理的电话是多少？', type: 'local' },
    { text: '科研处科研项目管理的办公室是？', type: 'local' },
    { text: '65778940是哪个部门的电话？', type: 'local' },
    { text: '明德楼405是哪个部门的办公室？', type: 'local' },
    { text: '科研处成果管理的电话是多少？', type: 'local' },
    { text: '科研处成果管理的办公室是？', type: 'local' },
    { text: '科研处信息管理的电话是多少？', type: 'local' },
    { text: '科研处信息管理的办公室是？', type: 'local' },
    { text: '科研处基地建设的电话是多少？', type: 'local' },
    { text: '科研处基地建设的办公室是？', type: 'local' },
    { text: '科研处科研院所综合事务管理办公室的电话是多少？', type: 'local' },
    { text: '科研处科研院所综合事务管理办公室的办公室是？', type: 'local' },
    { text: '65778385是哪个部门的电话？', type: 'local' },
    { text: '明德楼401是哪个部门的办公室？', type: 'local' },
    { text: '研究生院学科办的电话是多少？', type: 'local' },
    { text: '研究生院学科办的办公室是？', type: 'local' },
    { text: '65778470是哪个部门的电话？', type: 'local' },
    { text: '明德楼201是哪个部门的办公室？', type: 'local' },
    { text: '研究生院学位管理的电话是多少？', type: 'local' },
    { text: '研究生院学位管理的办公室是？', type: 'local' },
    { text: '65778471是哪个部门的电话？', type: 'local' },
    { text: '明德楼203是哪个部门的办公室？', type: 'local' },
    { text: '研究生院教学运行的电话是多少？', type: 'local' },
    { text: '研究生院教学运行的办公室是？', type: 'local' },
    { text: '65778146是哪个部门的电话？', type: 'local' },
    { text: '研究生院质量监控的电话是多少？', type: 'local' },
    { text: '研究生院质量监控的办公室是？', type: 'local' },
    { text: '研究生院学籍管理的电话是多少？', type: 'local' },
    { text: '研究生院学籍管理的办公室是？', type: 'local' },
    { text: '65773331是哪个部门的电话？', type: 'local' },
    { text: '明德楼211是哪个部门的办公室？', type: 'local' },
    { text: '研究生院研究生招生的电话是多少？', type: 'local' },
    { text: '研究生院研究生招生的办公室是？', type: 'local' },
    { text: '国际交流与合作处处长室的电话是多少？', type: 'local' },
    { text: '国际交流与合作处处长室的办公室是？', type: 'local' },
    { text: '65778343是哪个部门的电话？', type: 'local' },
    { text: '明德楼106是哪个部门的办公室？', type: 'local' },
    { text: '国际交流与合作处因公派出的电话是多少？', type: 'local' },
    { text: '国际交流与合作处因公派出的办公室是？', type: 'local' },
    { text: '65778564是哪个部门的电话？', type: 'local' },
    { text: '明德楼110是哪个部门的办公室？', type: 'local' },
    { text: '国际交流与合作处外教的电话是多少？', type: 'local' },
    { text: '国际交流与合作处外教的办公室是？', type: 'local' },
    { text: '国际交流与合作处孔子学院的电话是多少？', type: 'local' },
    { text: '国际交流与合作处孔子学院的办公室是？', type: 'local' },
    { text: '65778565是哪个部门的电话？', type: 'local' },
    { text: '国际交流与合作处国际交流的电话是多少？', type: 'local' },
    { text: '国际交流与合作处国际交流的办公室是？', type: 'local' },
    { text: '65778813是哪个部门的电话？', type: 'local' },
    { text: '明德楼102是哪个部门的办公室？', type: 'local' },
    { text: '国际交流与合作处学生派出的电话是多少？', type: 'local' },
    { text: '国际交流与合作处学生派出的办公室是？', type: 'local' },
    { text: '国际交流与合作处留学生招生的电话是多少？', type: 'local' },
    { text: '国际交流与合作处留学生招生的办公室是？', type: 'local' },
    { text: '65778827是哪个部门的电话？', type: 'local' },
    { text: '财务与资产处房管办的电话是多少？', type: 'local' },
    { text: '财务与资产处房管办的办公室是？', type: 'local' },
    { text: '65778474是哪个部门的电话？', type: 'local' },
    { text: '明德楼217是哪个部门的办公室？', type: 'local' },
    { text: '财务与资产处资产会计的电话是多少？', type: 'local' },
    { text: '财务与资产处资产会计的办公室是？', type: 'local' },
    { text: '65778559是哪个部门的电话？', type: 'local' },
    { text: '财务与资产处公积金、房补的电话是多少？', type: 'local' },
    { text: '财务与资产处公积金、房补的办公室是？', type: 'local' },
    { text: '财务与资产处招标管理的电话是多少？', type: 'local' },
    { text: '财务与资产处招标管理的办公室是？', type: 'local' },
    { text: '65778012是哪个部门的电话？', type: 'local' },
    { text: '明德楼219是哪个部门的办公室？', type: 'local' },
    { text: '财务与资产处资产采购的电话是多少？', type: 'local' },
    { text: '财务与资产处资产采购的办公室是？', type: 'local' },
    { text: '65778612是哪个部门的电话？', type: 'local' },
    { text: '财务与资产处资产管理的电话是多少？', type: 'local' },
    { text: '财务与资产处资产管理的办公室是？', type: 'local' },
    { text: '65778467是哪个部门的电话？', type: 'local' },
    { text: '财务与资产处计划管理中心的电话是多少？', type: 'local' },
    { text: '财务与资产处计划管理中心的办公室是？', type: 'local' },
    { text: '65778197是哪个部门的电话？', type: 'local' },
    { text: '明德楼227是哪个部门的办公室？', type: 'local' },
    { text: '65778191是哪个部门的电话？', type: 'local' },
    { text: '"财务与资产处财务核算中心', type: 'local' },
    { text: '教师业务的电话是多少？"', type: 'local' },
    { text: '"财务与资产处财务核算中心', type: 'local' },
    { text: '教师业务的办公室是？"', type: 'local' },
    { text: '65778528是哪个部门的电话？', type: 'local' },
    { text: '明德楼225是哪个部门的办公室？', type: 'local' },
    { text: '65778340是哪个部门的电话？', type: 'local' },
    { text: '65778115是哪个部门的电话？', type: 'local' },
    { text: '65778773是哪个部门的电话？', type: 'local' },
    { text: '65778745是哪个部门的电话？', type: 'local' },
    { text: '65778674是哪个部门的电话？', type: 'local' },
    { text: '65778396是哪个部门的电话？', type: 'local' },
    { text: '"财务与资产处财务核算中心', type: 'local' },
    { text: '学生业务的电话是多少？"', type: 'local' },
    { text: '"财务与资产处财务核算中心', type: 'local' },
    { text: '学生业务的办公室是？"', type: 'local' },
    { text: '65778116是哪个部门的电话？', type: 'local' },
    { text: '明德楼229是哪个部门的办公室？', type: 'local' },
    { text: '财务与资产处后勤财务中心的电话是多少？', type: 'local' },
    { text: '财务与资产处后勤财务中心的办公室是？', type: 'local' },
    { text: '65778506是哪个部门的电话？', type: 'local' },
    { text: '65778507是哪个部门的电话？', type: 'local' },
    { text: '财务与资产处综合办公室的电话是多少？', type: 'local' },
    { text: '财务与资产处综合办公室的办公室是？', type: 'local' },
    { text: '65778717是哪个部门的电话？', type: 'local' },
    { text: '后勤与基建处综合办公室的电话是多少？', type: 'local' },
    { text: '后勤与基建处综合办公室的办公室是？', type: 'local' },
    { text: '65778381是哪个部门的电话？', type: 'local' },
    { text: '1号楼125是哪个部门的办公室？', type: 'local' },
    { text: '后勤与基建处基建办公室的电话是多少？', type: 'local' },
    { text: '后勤与基建处基建办公室的办公室是？', type: 'local' },
    { text: '65778014是哪个部门的电话？', type: 'local' },
    { text: '1号楼126是哪个部门的办公室？', type: 'local' },
    { text: '后勤与基建处节能办公室的电话是多少？', type: 'local' },
    { text: '后勤与基建处节能办公室的办公室是？', type: 'local' },
    { text: '65778501是哪个部门的电话？', type: 'local' },
    { text: '1号楼124是哪个部门的办公室？', type: 'local' },
    { text: '65778334是哪个部门的电话？', type: 'local' },
    { text: '人文楼240是哪个部门的办公室？', type: 'local' },
    { text: '后勤与基建处质检办公室的电话是多少？', type: 'local' },
    { text: '后勤与基建处质检办公室的办公室是？', type: 'local' },
    { text: '65778407是哪个部门的电话？', type: 'local' },
    { text: '1号楼122是哪个部门的办公室？', type: 'local' },
    { text: '离退休工作处离休办公室的电话是多少？', type: 'local' },
    { text: '离退休工作处离休办公室的办公室是？', type: 'local' },
    { text: '65778534是哪个部门的电话？', type: 'local' },
    { text: '离退休工作处101是哪个部门的办公室？', type: 'local' },
    { text: '离退休工作处退休办公室的电话是多少？', type: 'local' },
    { text: '离退休工作处退休办公室的办公室是？', type: 'local' },
    { text: '65778535是哪个部门的电话？', type: 'local' },
    { text: '离退休工作处104是哪个部门的办公室？', type: 'local' },
    { text: '离退休工作处关工委的电话是多少？', type: 'local' },
    { text: '离退休工作处关工委的办公室是？', type: 'local' },
    { text: '65778104是哪个部门的电话？', type: 'local' },
    { text: '离退休工作处102是哪个部门的办公室？', type: 'local' },
    { text: '离退休工作处居委会的电话是多少？', type: 'local' },
    { text: '离退休工作处居委会的办公室是？', type: 'local' },
    { text: '65778589是哪个部门的电话？', type: 'local' },
    { text: '家属楼3号楼3单元3号是哪个部门的办公室？', type: 'local' },
    { text: '审计处财务工程审计的电话是多少？', type: 'local' },
    { text: '审计处财务工程审计的办公室是？', type: 'local' },
    { text: '65778593是哪个部门的电话？', type: 'local' },
    { text: '明德楼402是哪个部门的办公室？', type: 'local' },
    { text: '对外合作与产业管理处校友办的电话是多少？', type: 'local' },
    { text: '对外合作与产业管理处校友办的办公室是？', type: 'local' },
    { text: '65778266是哪个部门的电话？', type: 'local' },
    { text: '明德楼329是哪个部门的办公室？', type: 'local' },
    { text: '对外合作与产业管理处办公室的电话是多少？', type: 'local' },
    { text: '对外合作与产业管理处办公室的办公室是？', type: 'local' },
    { text: '65767683是哪个部门的电话？', type: 'local' },
    { text: '西马路平房002是哪个部门的办公室？', type: 'local' },
    { text: '对外合作与产业管理处基金会秘书处的电话是多少？', type: 'local' },
    { text: '对外合作与产业管理处基金会秘书处的办公室是？', type: 'local' },
    { text: '"对外合作与产业管理处国内合作、校企管理、非学历教育管理', type: 'local' },
    { text: '办公室的电话是多少？"', type: 'local' },
    { text: '"对外合作与产业管理处国内合作、校企管理、非学历教育管理', type: 'local' },
    { text: '办公室的办公室是？"', type: 'local' },
    { text: '65768281是哪个部门的电话？', type: 'local' },
    { text: '西马路平房003是哪个部门的办公室？', type: 'local' },
    { text: '"对外合作与产业管理处国内合作、校企管理、', type: 'local' },
    { text: '非学历教育管理办公室的电话是多少？"', type: 'local' },
    { text: '"对外合作与产业管理处国内合作、校企管理、', type: 'local' },
    { text: '非学历教育管理办公室的办公室是？"', type: 'local' },
    { text: '校工会常务副主席的电话是多少？', type: 'local' },
    { text: '校工会常务副主席的办公室是？', type: 'local' },
    { text: '65778909是哪个部门的电话？', type: 'local' },
    { text: '明德楼109是哪个部门的办公室？', type: 'local' },
    { text: '校工会工会办公室的电话是多少？', type: 'local' },
    { text: '校工会工会办公室的办公室是？', type: 'local' },
    { text: '65778599是哪个部门的电话？', type: 'local' },
    { text: '明德楼105是哪个部门的办公室？', type: 'local' },
    { text: '校团委办公室的电话是多少？', type: 'local' },
    { text: '校团委办公室的办公室是？', type: 'local' },
    { text: '65778595是哪个部门的电话？', type: 'local' },
    { text: '明德楼103室是哪个部门的办公室？', type: 'local' },
    { text: '校团委基层团建的电话是多少？', type: 'local' },
    { text: '校团委基层团建的办公室是？', type: 'local' },
    { text: '校团委国际志愿的电话是多少？', type: 'local' },
    { text: '校团委国际志愿的办公室是？', type: 'local' },
    { text: '网络与信息中心(图书馆)综合办公室的电话是多少？', type: 'local' },
    { text: '网络与信息中心(图书馆)综合办公室的办公室是？', type: 'local' },
    { text: '65778552是哪个部门的电话？', type: 'local' },
    { text: '图书馆306是哪个部门的办公室？', type: 'local' },
    { text: '65778574是哪个部门的电话？', type: 'local' },
    { text: '网络与信息中心(图书馆)文献资源部的电话是多少？', type: 'local' },
    { text: '网络与信息中心(图书馆)文献资源部的办公室是？', type: 'local' },
    { text: '65778794是哪个部门的电话？', type: 'local' },
    { text: '图书馆211是哪个部门的办公室？', type: 'local' },
    { text: '65778387是哪个部门的电话？', type: 'local' },
    { text: '图书馆210是哪个部门的办公室？', type: 'local' },
    { text: '65778576是哪个部门的电话？', type: 'local' },
    { text: '65778795是哪个部门的电话？', type: 'local' },
    { text: '网络与信息中心(图书馆)流通服务部的电话是多少？', type: 'local' },
    { text: '网络与信息中心(图书馆)流通服务部的办公室是？', type: 'local' },
    { text: '65778577是哪个部门的电话？', type: 'local' },
    { text: '图书馆109是哪个部门的办公室？', type: 'local' },
    { text: '65778797是哪个部门的电话？', type: 'local' },
    { text: '65778769是哪个部门的电话？', type: 'local' },
    { text: '图书馆111是哪个部门的办公室？', type: 'local' },
    { text: '网络与信息中心(图书馆)线上资源部的电话是多少？', type: 'local' },
    { text: '网络与信息中心(图书馆)线上资源部的办公室是？', type: 'local' },
    { text: '65778553是哪个部门的电话？', type: 'local' },
    { text: '求是楼401是哪个部门的办公室？', type: 'local' },
    { text: '网络与信息中心(图书馆)信息管理部的电话是多少？', type: 'local' },
    { text: '网络与信息中心(图书馆)信息管理部的办公室是？', type: 'local' },
    { text: '65778449是哪个部门的电话？', type: 'local' },
    { text: '人文楼326是哪个部门的办公室？', type: 'local' },
    { text: '65778934是哪个部门的电话？', type: 'local' },
    { text: '网络与信息中心(图书馆)网络建设部的电话是多少？', type: 'local' },
    { text: '网络与信息中心(图书馆)网络建设部的办公室是？', type: 'local' },
    { text: '65778941是哪个部门的电话？', type: 'local' },
    { text: '人文楼316是哪个部门的办公室？', type: 'local' },
    { text: '网络与信息中心(图书馆)卡务中心的电话是多少？', type: 'local' },
    { text: '网络与信息中心(图书馆)卡务中心的办公室是？', type: 'local' },
    { text: '65778646是哪个部门的电话？', type: 'local' },
    { text: '人文楼324是哪个部门的办公室？', type: 'local' },
    { text: '网络与信息中心(图书馆)人文楼中控室的电话是多少？', type: 'local' },
    { text: '网络与信息中心(图书馆)人文楼中控室的办公室是？', type: 'local' },
    { text: '65778133是哪个部门的电话？', type: 'local' },
    { text: '人文楼603是哪个部门的办公室？', type: 'local' },
    { text: '网络与信息中心(图书馆)求是楼中控室的电话是多少？', type: 'local' },
    { text: '网络与信息中心(图书馆)求是楼中控室的办公室是？', type: 'local' },
    { text: '65778464是哪个部门的电话？', type: 'local' },
    { text: '求是楼301是哪个部门的办公室？', type: 'local' },
    { text: '网络与信息中心(图书馆)公共保障部的电话是多少？', type: 'local' },
    { text: '网络与信息中心(图书馆)公共保障部的办公室是？', type: 'local' },
    { text: '65778416是哪个部门的电话？', type: 'local' },
    { text: '人文楼609是哪个部门的办公室？', type: 'local' },
    { text: '65778554是哪个部门的电话？', type: 'local' },
    { text: '65778352是哪个部门的电话？', type: 'local' },
    { text: '人文楼610是哪个部门的办公室？', type: 'local' },
    { text: '英语学院本科教学管理的电话是多少？', type: 'local' },
    { text: '英语学院本科教学管理的办公室是？', type: 'local' },
    { text: '65778423是哪个部门的电话？', type: 'local' },
    { text: '人文楼706是哪个部门的办公室？', type: 'local' },
    { text: '65778357是哪个部门的电话？', type: 'local' },
    { text: '英语学院研究生教学管理的电话是多少？', type: 'local' },
    { text: '英语学院研究生教学管理的办公室是？', type: 'local' },
    { text: '65778963是哪个部门的电话？', type: 'local' },
    { text: '人文楼726是哪个部门的办公室？', type: 'local' },
    { text: '英语学院学工办的电话是多少？', type: 'local' },
    { text: '英语学院学工办的办公室是？', type: 'local' },
    { text: '65778203是哪个部门的电话？', type: 'local' },
    { text: '人文楼710是哪个部门的办公室？', type: 'local' },
    { text: '65778421是哪个部门的电话？', type: 'local' },
    { text: '65778329是哪个部门的电话？', type: 'local' },
    { text: '人文楼708是哪个部门的办公室？', type: 'local' },
    { text: '英语学院办公室的电话是多少？', type: 'local' },
    { text: '英语学院办公室的办公室是？', type: 'local' },
    { text: '65778420是哪个部门的电话？', type: 'local' },
    { text: '人文楼703是哪个部门的办公室？', type: 'local' },
    { text: '英语学院继续教育办公室的电话是多少？', type: 'local' },
    { text: '英语学院继续教育办公室的办公室是？', type: 'local' },
    { text: '65778428是哪个部门的电话？', type: 'local' },
    { text: '人文楼743是哪个部门的办公室？', type: 'local' },
    { text: '英语学院继续教育教学管理的电话是多少？', type: 'local' },
    { text: '英语学院继续教育教学管理的办公室是？', type: 'local' },
    { text: '65778427是哪个部门的电话？', type: 'local' },
    { text: '人文楼739是哪个部门的办公室？', type: 'local' },
    { text: '英语学院丹麦研究中心的电话是多少？', type: 'local' },
    { text: '英语学院丹麦研究中心的办公室是？', type: 'local' },
    { text: '65778430是哪个部门的电话？', type: 'local' },
    { text: '人文楼767是哪个部门的办公室？', type: 'local' },
    { text: '日语学院教学管理的电话是多少？', type: 'local' },
    { text: '日语学院教学管理的办公室是？', type: 'local' },
    { text: '65778438是哪个部门的电话？', type: 'local' },
    { text: '人文楼204是哪个部门的办公室？', type: 'local' },
    { text: '日语学院学工办的电话是多少？', type: 'local' },
    { text: '日语学院学工办的办公室是？', type: 'local' },
    { text: '65778847是哪个部门的电话？', type: 'local' },
    { text: '人文楼227是哪个部门的办公室？', type: 'local' },
    { text: '日语学院办公室的电话是多少？', type: 'local' },
    { text: '日语学院办公室的办公室是？', type: 'local' },
    { text: '65778435是哪个部门的电话？', type: 'local' },
    { text: '人文楼228是哪个部门的办公室？', type: 'local' },
    { text: '亚洲学院教学管理、学工办的电话是多少？', type: 'local' },
    { text: '亚洲学院教学管理、学工办的办公室是？', type: 'local' },
    { text: '65778549是哪个部门的电话？', type: 'local' },
    { text: '人文楼303是哪个部门的办公室？', type: 'local' },
    { text: '亚洲学院办公室的电话是多少？', type: 'local' },
    { text: '亚洲学院办公室的办公室是？', type: 'local' },
    { text: '65778648是哪个部门的电话？', type: 'local' },
    { text: '人文楼309是哪个部门的办公室？', type: 'local' },
    { text: '亚洲学院朝鲜语系1的电话是多少？', type: 'local' },
    { text: '亚洲学院朝鲜语系1的办公室是？', type: 'local' },
    { text: '人文楼308是哪个部门的办公室？', type: 'local' },
    { text: '亚洲学院朝鲜语系2的电话是多少？', type: 'local' },
    { text: '亚洲学院朝鲜语系2的办公室是？', type: 'local' },
    { text: '65778722是哪个部门的电话？', type: 'local' },
    { text: '人文楼312是哪个部门的办公室？', type: 'local' },
    { text: '亚洲学院朝鲜语系3的电话是多少？', type: 'local' },
    { text: '亚洲学院朝鲜语系3的办公室是？', type: 'local' },
    { text: '65778450是哪个部门的电话？', type: 'local' },
    { text: '人文楼310是哪个部门的办公室？', type: 'local' },
    { text: '亚洲学院南亚东南亚语系(印地)的电话是多少？', type: 'local' },
    { text: '亚洲学院南亚东南亚语系(印地)的办公室是？', type: 'local' },
    { text: '65778714是哪个部门的电话？', type: 'local' },
    { text: '人文楼407是哪个部门的办公室？', type: 'local' },
    { text: '亚洲学院南亚东南亚语系(泰)的电话是多少？', type: 'local' },
    { text: '亚洲学院南亚东南亚语系(泰)的办公室是？', type: 'local' },
    { text: '65778840是哪个部门的电话？', type: 'local' },
    { text: '人文楼410是哪个部门的办公室？', type: 'local' },
    { text: '欧洲学院北部系的电话是多少？', type: 'local' },
    { text: '欧洲学院北部系的办公室是？', type: 'local' },
    { text: '65778544是哪个部门的电话？', type: 'local' },
    { text: '人文楼821是哪个部门的办公室？', type: 'local' },
    { text: '欧洲学院办公室的电话是多少？', type: 'local' },
    { text: '欧洲学院办公室的办公室是？', type: 'local' },
    { text: '65778874是哪个部门的电话？', type: 'local' },
    { text: '人文楼903是哪个部门的办公室？', type: 'local' },
    { text: '欧洲学院教学管理的电话是多少？', type: 'local' },
    { text: '欧洲学院教学管理的办公室是？', type: 'local' },
    { text: '65738198是哪个部门的电话？', type: 'local' },
    { text: '人文楼803是哪个部门的办公室？', type: 'local' },
    { text: '65778056是哪个部门的电话？', type: 'local' },
    { text: '欧洲学院学工办的电话是多少？', type: 'local' },
    { text: '欧洲学院学工办的办公室是？', type: 'local' },
    { text: '65778550是哪个部门的电话？', type: 'local' },
    { text: '人文楼800是哪个部门的办公室？', type: 'local' },
    { text: '65778545是哪个部门的电话？', type: 'local' },
    { text: '欧洲学院学工办(分团委)的电话是多少？', type: 'local' },
    { text: '欧洲学院学工办(分团委)的办公室是？', type: 'local' },
    { text: '65778824是哪个部门的电话？', type: 'local' },
    { text: '人文楼929是哪个部门的办公室？', type: 'local' },
    { text: '欧洲学院俄语教研室的电话是多少？', type: 'local' },
    { text: '欧洲学院俄语教研室的办公室是？', type: 'local' },
    { text: '65778542是哪个部门的电话？', type: 'local' },
    { text: '人文楼939是哪个部门的办公室？', type: 'local' },
    { text: '欧洲学院法语教研室的电话是多少？', type: 'local' },
    { text: '欧洲学院法语教研室的办公室是？', type: 'local' },
    { text: '65778267是哪个部门的电话？', type: 'local' },
    { text: '人文楼909是哪个部门的办公室？', type: 'local' },
    { text: '65778546是哪个部门的电话？', type: 'local' },
    { text: '人文楼904是哪个部门的办公室？', type: 'local' },
    { text: '欧洲学院意大利语教研室的电话是多少？', type: 'local' },
    { text: '欧洲学院意大利语教研室的办公室是？', type: 'local' },
    { text: '65778540是哪个部门的电话？', type: 'local' },
    { text: '人文楼910是哪个部门的办公室？', type: 'local' },
    { text: '欧洲学院葡萄牙语CAPLE考试中心的电话是多少？', type: 'local' },
    { text: '欧洲学院葡萄牙语CAPLE考试中心的办公室是？', type: 'local' },
    { text: '65778547是哪个部门的电话？', type: 'local' },
    { text: '人文楼937是哪个部门的办公室？', type: 'local' },
    { text: '中东学院办公室的电话是多少？', type: 'local' },
    { text: '中东学院办公室的办公室是？', type: 'local' },
    { text: '65778153是哪个部门的电话？', type: 'local' },
    { text: '人文楼804是哪个部门的办公室？', type: 'local' },
    { text: '中东学院学工办的电话是多少？', type: 'local' },
    { text: '中东学院学工办的办公室是？', type: 'local' },
    { text: '65778541是哪个部门的电话？', type: 'local' },
    { text: '人文楼824是哪个部门的办公室？', type: 'local' },
    { text: '高级翻译学院本科教学管理的电话是多少？', type: 'local' },
    { text: '高级翻译学院本科教学管理的办公室是？', type: 'local' },
    { text: '65778944是哪个部门的电话？', type: 'local' },
    { text: '人文楼764-2是哪个部门的办公室？', type: 'local' },
    { text: '高级翻译学院研究生教学管理的电话是多少？', type: 'local' },
    { text: '高级翻译学院研究生教学管理的办公室是？', type: 'local' },
    { text: '65778339是哪个部门的电话？', type: 'local' },
    { text: '高级翻译学院办公室的电话是多少？', type: 'local' },
    { text: '高级翻译学院办公室的办公室是？', type: 'local' },
    { text: '65778945是哪个部门的电话？', type: 'local' },
    { text: '人文楼764-1是哪个部门的办公室？', type: 'local' },
    { text: '高级翻译学院教授办公室的电话是多少？', type: 'local' },
    { text: '高级翻译学院教授办公室的办公室是？', type: 'local' },
    { text: '65778337是哪个部门的电话？', type: 'local' },
    { text: '人文楼756南是哪个部门的办公室？', type: 'local' },
    { text: '旅游科学学院办公室的电话是多少？', type: 'local' },
    { text: '旅游科学学院办公室的办公室是？', type: 'local' },
    { text: '65778440是哪个部门的电话？', type: 'local' },
    { text: '知行楼230是哪个部门的办公室？', type: 'local' },
    { text: '旅游科学学院研究生教学管理的电话是多少？', type: 'local' },
    { text: '旅游科学学院研究生教学管理的办公室是？', type: 'local' },
    { text: '65778253是哪个部门的电话？', type: 'local' },
    { text: '知行楼224是哪个部门的办公室？', type: 'local' },
    { text: '旅游科学学院本科教学管理的电话是多少？', type: 'local' },
    { text: '旅游科学学院本科教学管理的办公室是？', type: 'local' },
    { text: '65778164是哪个部门的电话？', type: 'local' },
    { text: '知行楼212是哪个部门的办公室？', type: 'local' },
    { text: '旅游科学学院学工办的电话是多少？', type: 'local' },
    { text: '旅游科学学院学工办的办公室是？', type: 'local' },
    { text: '65778409是哪个部门的电话？', type: 'local' },
    { text: '知行楼218是哪个部门的办公室？', type: 'local' },
    { text: '65778433是哪个部门的电话？', type: 'local' },
    { text: '知行楼210是哪个部门的办公室？', type: 'local' },
    { text: '旅游科学学院旅游管理系的电话是多少？', type: 'local' },
    { text: '旅游科学学院旅游管理系的办公室是？', type: 'local' },
    { text: '65778353是哪个部门的电话？', type: 'local' },
    { text: '知行楼421是哪个部门的办公室？', type: 'local' },
    { text: '旅游科学学院旅游营销与电子商务系的电话是多少？', type: 'local' },
    { text: '旅游科学学院旅游营销与电子商务系的办公室是？', type: 'local' },
    { text: '65778089是哪个部门的电话？', type: 'local' },
    { text: '知行楼415是哪个部门的办公室？', type: 'local' },
    { text: '旅游科学学院旅游规划系的电话是多少？', type: 'local' },
    { text: '旅游科学学院旅游规划系的办公室是？', type: 'local' },
    { text: '65778081是哪个部门的电话？', type: 'local' },
    { text: '知行楼417是哪个部门的办公室？', type: 'local' },
    { text: '旅游科学学院酒店管理系的电话是多少？', type: 'local' },
    { text: '旅游科学学院酒店管理系的办公室是？', type: 'local' },
    { text: '65778455是哪个部门的电话？', type: 'local' },
    { text: '知行楼407是哪个部门的办公室？', type: 'local' },
    { text: '旅游科学学院健康产业管理系的电话是多少？', type: 'local' },
    { text: '旅游科学学院健康产业管理系的办公室是？', type: 'local' },
    { text: '65795923是哪个部门的电话？', type: 'local' },
    { text: '知行楼403是哪个部门的办公室？', type: 'local' },
    { text: '旅游科学学院会展经济与管理系的电话是多少？', type: 'local' },
    { text: '旅游科学学院会展经济与管理系的办公室是？', type: 'local' },
    { text: '65778454是哪个部门的电话？', type: 'local' },
    { text: '知行楼411是哪个部门的办公室？', type: 'local' },
    { text: '商学院教学管理的电话是多少？', type: 'local' },
    { text: '商学院教学管理的办公室是？', type: 'local' },
    { text: '65778634是哪个部门的电话？', type: 'local' },
    { text: '知行楼510是哪个部门的办公室？', type: 'local' },
    { text: '商学院学工办的电话是多少？', type: 'local' },
    { text: '商学院学工办的办公室是？', type: 'local' },
    { text: '65778981是哪个部门的电话？', type: 'local' },
    { text: '知行楼520是哪个部门的办公室？', type: 'local' },
    { text: '商学院学生国际化管理的电话是多少？', type: 'local' },
    { text: '商学院学生国际化管理的办公室是？', type: 'local' },
    { text: '商学院办公室的电话是多少？', type: 'local' },
    { text: '商学院办公室的办公室是？', type: 'local' },
    { text: '65778448是哪个部门的电话？', type: 'local' },
    { text: '商学院研究管理办公室的电话是多少？', type: 'local' },
    { text: '商学院研究管理办公室的办公室是？', type: 'local' },
    { text: '65778379是哪个部门的电话？', type: 'local' },
    { text: '知行楼201是哪个部门的办公室？', type: 'local' },
    { text: '商学院MPAcc教育中心的电话是多少？', type: 'local' },
    { text: '商学院MPAcc教育中心的办公室是？', type: 'local' },
    { text: '65772180是哪个部门的电话？', type: 'local' },
    { text: '知行楼205是哪个部门的办公室？', type: 'local' },
    { text: '商学院MBA教育中心的电话是多少？', type: 'local' },
    { text: '商学院MBA教育中心的办公室是？', type: 'local' },
    { text: '65778472是哪个部门的电话？', type: 'local' },
    { text: '求是楼114是哪个部门的办公室？', type: 'local' },
    { text: '65771324是哪个部门的电话？', type: 'local' },
    { text: '经济学院教学管理的电话是多少？', type: 'local' },
    { text: '经济学院教学管理的办公室是？', type: 'local' },
    { text: '65778441是哪个部门的电话？', type: 'local' },
    { text: '知行楼307是哪个部门的办公室？', type: 'local' },
    { text: '经济学院学工办的电话是多少？', type: 'local' },
    { text: '经济学院学工办的办公室是？', type: 'local' },
    { text: '65778434是哪个部门的电话？', type: 'local' },
    { text: '知行楼317是哪个部门的办公室？', type: 'local' },
    { text: '经济学院办公室的电话是多少？', type: 'local' },
    { text: '经济学院办公室的办公室是？', type: 'local' },
    { text: '65778442是哪个部门的电话？', type: 'local' },
    { text: '知行楼303是哪个部门的办公室？', type: 'local' },
    { text: '经济学院国际文化贸易系的电话是多少？', type: 'local' },
    { text: '经济学院国际文化贸易系的办公室是？', type: 'local' },
    { text: '65778644是哪个部门的电话？', type: 'local' },
    { text: '知行楼305是哪个部门的办公室？', type: 'local' },
    { text: '经济学院国际贸易系的电话是多少？', type: 'local' },
    { text: '经济学院国际贸易系的办公室是？', type: 'local' },
    { text: '知行楼309是哪个部门的办公室？', type: 'local' },
    { text: '经济学院金融系的电话是多少？', type: 'local' },
    { text: '经济学院金融系的办公室是？', type: 'local' },
    { text: '知行楼315是哪个部门的办公室？', type: 'local' },
    { text: '经济学院经济学系的电话是多少？', type: 'local' },
    { text: '经济学院经济学系的办公室是？', type: 'local' },
    { text: '65778265是哪个部门的电话？', type: 'local' },
    { text: '知行楼325是哪个部门的办公室？', type: 'local' },
    { text: '政党外交学院教学管理的电话是多少？', type: 'local' },
    { text: '政党外交学院教学管理的办公室是？', type: 'local' },
    { text: '65773097是哪个部门的电话？', type: 'local' },
    { text: '竞先楼B110是哪个部门的办公室？', type: 'local' },
    { text: '政党外交学院学工办的电话是多少？', type: 'local' },
    { text: '政党外交学院学工办的办公室是？', type: 'local' },
    { text: '65778451是哪个部门的电话？', type: 'local' },
    { text: '竞先楼B111是哪个部门的办公室？', type: 'local' },
    { text: '政党外交学院办公室的电话是多少？', type: 'local' },
    { text: '政党外交学院办公室的办公室是？', type: 'local' },
    { text: '65778954是哪个部门的电话？', type: 'local' },
    { text: '竞先楼B112是哪个部门的办公室？', type: 'local' },
    { text: '政党外交学院教研室的电话是多少？', type: 'local' },
    { text: '政党外交学院教研室的办公室是？', type: 'local' },
    { text: '65773951是哪个部门的电话？', type: 'local' },
    { text: '竞先楼B108是哪个部门的办公室？', type: 'local' },
    { text: '65778043是哪个部门的电话？', type: 'local' },
    { text: '竞先楼B102是哪个部门的办公室？', type: 'local' },
    { text: '文化与传播学院本科教学管理的电话是多少？', type: 'local' },
    { text: '文化与传播学院本科教学管理的办公室是？', type: 'local' },
    { text: '65778424是哪个部门的电话？', type: 'local' },
    { text: '竞先楼A202是哪个部门的办公室？', type: 'local' },
    { text: '文化与传播学院研究生教学管理的电话是多少？', type: 'local' },
    { text: '文化与传播学院研究生教学管理的办公室是？', type: 'local' },
    { text: '65778347是哪个部门的电话？', type: 'local' },
    { text: '竞先楼A203是哪个部门的办公室？', type: 'local' },
    { text: '文化与传播学院学工办的电话是多少？', type: 'local' },
    { text: '文化与传播学院学工办的办公室是？', type: 'local' },
    { text: '65778426是哪个部门的电话？', type: 'local' },
    { text: '竞先楼A214是哪个部门的办公室？', type: 'local' },
    { text: '文化与传播学院办公室的电话是多少？', type: 'local' },
    { text: '文化与传播学院办公室的办公室是？', type: 'local' },
    { text: '文化与传播学院教师办公室的电话是多少？', type: 'local' },
    { text: '文化与传播学院教师办公室的办公室是？', type: 'local' },
    { text: '65778124是哪个部门的电话？', type: 'local' },
    { text: '竞先楼A306是哪个部门的办公室？', type: 'local' },
    { text: '65778127是哪个部门的电话？', type: 'local' },
    { text: '竞先楼A302是哪个部门的办公室？', type: 'local' },
    { text: '65778134是哪个部门的电话？', type: 'local' },
    { text: '竞先楼A305是哪个部门的办公室？', type: 'local' },
    { text: '65778136是哪个部门的电话？', type: 'local' },
    { text: '竞先楼A315是哪个部门的办公室？', type: 'local' },
    { text: '65778262是哪个部门的电话？', type: 'local' },
    { text: '竞先楼A104是哪个部门的办公室？', type: 'local' },
    { text: '65778844是哪个部门的电话？', type: 'local' },
    { text: '竞先楼A314是哪个部门的办公室？', type: 'local' },
    { text: '汉语学院教学管理的电话是多少？', type: 'local' },
    { text: '汉语学院教学管理的办公室是？', type: 'local' },
    { text: '65778362是哪个部门的电话？', type: 'local' },
    { text: '求是楼207是哪个部门的办公室？', type: 'local' },
    { text: '汉语学院办公室的电话是多少？', type: 'local' },
    { text: '汉语学院办公室的办公室是？', type: 'local' },
    { text: '65778561是哪个部门的电话？', type: 'local' },
    { text: '求是楼208是哪个部门的办公室？', type: 'local' },
    { text: '汉语学院留学生管理办公室的电话是多少？', type: 'local' },
    { text: '汉语学院留学生管理办公室的办公室是？', type: 'local' },
    { text: '65778351是哪个部门的电话？', type: 'local' },
    { text: '求是楼210是哪个部门的办公室？', type: 'local' },
    { text: '汉语学院第一教研室的电话是多少？', type: 'local' },
    { text: '汉语学院第一教研室的办公室是？', type: 'local' },
    { text: '65716996是哪个部门的电话？', type: 'local' },
    { text: '求是楼203是哪个部门的办公室？', type: 'local' },
    { text: '汉语学院第二教研室的电话是多少？', type: 'local' },
    { text: '汉语学院第二教研室的办公室是？', type: 'local' },
    { text: '65778753是哪个部门的电话？', type: 'local' },
    { text: '求是楼204是哪个部门的办公室？', type: 'local' },
    { text: '汉语学院预科教研室的电话是多少？', type: 'local' },
    { text: '汉语学院预科教研室的办公室是？', type: 'local' },
    { text: '65778468是哪个部门的电话？', type: 'local' },
    { text: '求是楼601是哪个部门的办公室？', type: 'local' },
    { text: '马克思主义学院办公室的电话是多少？', type: 'local' },
    { text: '马克思主义学院办公室的办公室是？', type: 'local' },
    { text: '65778567是哪个部门的电话？', type: 'local' },
    { text: '竞先楼207是哪个部门的办公室？', type: 'local' },
    { text: '马克思主义学院教学管理办公室的电话是多少？', type: 'local' },
    { text: '马克思主义学院教学管理办公室的办公室是？', type: 'local' },
    { text: '65778569是哪个部门的电话？', type: 'local' },
    { text: '竞先楼204是哪个部门的办公室？', type: 'local' },
    { text: '体育部教学管理、办公室的电话是多少？', type: 'local' },
    { text: '体育部教学管理、办公室的办公室是？', type: 'local' },
    { text: '65778913是哪个部门的电话？', type: 'local' },
    { text: '体育部103是哪个部门的办公室？', type: 'local' },
    { text: '基础科学部教学管理的电话是多少？', type: 'local' },
    { text: '基础科学部教学管理的办公室是？', type: 'local' },
    { text: '65778985是哪个部门的电话？', type: 'local' },
    { text: '知行楼215是哪个部门的办公室？', type: 'local' },
    { text: '基础科学部办公室的电话是多少？', type: 'local' },
    { text: '基础科学部办公室的办公室是？', type: 'local' },
    { text: '基础科学部计算机教学部的电话是多少？', type: 'local' },
    { text: '基础科学部计算机教学部的办公室是？', type: 'local' },
    { text: '知行楼221是哪个部门的办公室？', type: 'local' },
    { text: '基础科学部数学教学部的电话是多少？', type: 'local' },
    { text: '基础科学部数学教学部的办公室是？', type: 'local' },
    { text: '知行楼225是哪个部门的办公室？', type: 'local' },
    { text: '基础科学部法学部的电话是多少？', type: 'local' },
    { text: '基础科学部法学部的办公室是？', type: 'local' },
    { text: '知行楼203是哪个部门的办公室？', type: 'local' },
    { text: '基础科学部艺术教学部的电话是多少？', type: 'local' },
    { text: '基础科学部艺术教学部的办公室是？', type: 'local' },
    { text: '知行楼118是哪个部门的办公室？', type: 'local' },
    { text: '基础科学部通识素质与德育教学部的电话是多少？', type: 'local' },
    { text: '基础科学部通识素质与德育教学部的办公室是？', type: 'local' },
    { text: '延庆校区管委会办公室的电话是多少？', type: 'local' },
    { text: '延庆校区管委会办公室的办公室是？', type: 'local' },
    { text: '56177799是哪个部门的电话？', type: 'local' },
    { text: '德勤楼305西是哪个部门的办公室？', type: 'local' },
    { text: '56177797是哪个部门的电话？', type: 'local' },
    { text: '56177796是哪个部门的电话？', type: 'local' },
    { text: '德勤楼205是哪个部门的办公室？', type: 'local' },
    { text: '延庆校区管委会教学工作办公室的电话是多少？', type: 'local' },
    { text: '延庆校区管委会教学工作办公室的办公室是？', type: 'local' },
    { text: '56177794是哪个部门的电话？', type: 'local' },
    { text: '德勤楼203是哪个部门的办公室？', type: 'local' },
    { text: '延庆校区管委会学生工作办公室的电话是多少？', type: 'local' },
    { text: '延庆校区管委会学生工作办公室的办公室是？', type: 'local' },
    { text: '56177792是哪个部门的电话？', type: 'local' },
    { text: '德勤楼213是哪个部门的办公室？', type: 'local' },
    { text: '延庆校区管委会后勤服务办公室的电话是多少？', type: 'local' },
    { text: '延庆校区管委会后勤服务办公室的办公室是？', type: 'local' },
    { text: '56177780是哪个部门的电话？', type: 'local' },
    { text: '德勤楼107是哪个部门的办公室？', type: 'local' },
    { text: '延庆校区管委会安全保卫办公室的电话是多少？', type: 'local' },
    { text: '延庆校区管委会安全保卫办公室的办公室是？', type: 'local' },
    { text: '56177784是哪个部门的电话？', type: 'local' },
    { text: '德勤楼105是哪个部门的办公室？', type: 'local' },
    { text: '国际教育学院(国际培训学院)办公室的电话是多少？', type: 'local' },
    { text: '国际教育学院(国际培训学院)办公室的办公室是？', type: 'local' },
    { text: '65778444是哪个部门的电话？', type: 'local' },
    { text: '知行楼126是哪个部门的办公室？', type: 'local' },
    { text: '国际教育学院(国际培训学院)招生及出国留学咨询部的电话是多少？', type: 'local' },
    { text: '国际教育学院(国际培训学院)招生及出国留学咨询部的办公室是？', type: 'local' },
    { text: '65772800是哪个部门的电话？', type: 'local' },
    { text: '首都对外文化传播研究院北京对外文化传播研究基地的电话是多少？', type: 'local' },
    { text: '首都对外文化传播研究院北京对外文化传播研究基地的办公室是？', type: 'local' },
    { text: '65778604是哪个部门的电话？', type: 'local' },
    { text: '求是楼907是哪个部门的办公室？', type: 'local' },
    { text: '中阿文化和旅游合作研究中心办公室的电话是多少？', type: 'local' },
    { text: '中阿文化和旅游合作研究中心办公室的办公室是？', type: 'local' },
    { text: '65778964是哪个部门的电话？', type: 'local' },
    { text: '求是楼921是哪个部门的办公室？', type: 'local' },
    { text: '"首都国际交往中心研究院', type: 'local' },
    { text: '(文化和旅游部文化和旅游研究基地、国家文化贸易学术研究平', type: 'local' },
    { text: '台)办公室的电话是多少？"', type: 'local' },
    { text: '"首都国际交往中心研究院', type: 'local' },
    { text: '(文化和旅游部文化和旅游研究基地、国家文化贸易学术研究平', type: 'local' },
    { text: '台)办公室的办公室是？"', type: 'local' },
    { text: '65778155是哪个部门的电话？', type: 'local' },
    { text: '求是楼908是哪个部门的办公室？', type: 'local' },
    { text: '"中国服务贸易研究院', type: 'local' },
    { text: '(中国国际贸易学会服务贸易专业委员会)办公室的电话是多少？"', type: 'local' },
    { text: '"中国服务贸易研究院', type: 'local' },
    { text: '(中国国际贸易学会服务贸易专业委员会)办公室的办公室是？"', type: 'local' },
    { text: '65767468是哪个部门的电话？', type: 'local' },
    { text: '求是楼920是哪个部门的办公室？', type: 'local' },
    { text: '期刊社《二外学报》的电话是多少？', type: 'local' },
    { text: '期刊社《二外学报》的办公室是？', type: 'local' },
    { text: '65778734是哪个部门的电话？', type: 'local' },
    { text: '求是楼918是哪个部门的办公室？', type: 'local' },
    { text: '期刊社《旅游导刊》的电话是多少？', type: 'local' },
    { text: '期刊社《旅游导刊》的办公室是？', type: 'local' },
    { text: '65778838是哪个部门的电话？', type: 'local' },
    { text: '求是楼916是哪个部门的办公室？', type: 'local' },
    { text: '中国旅游人才发展研究院办公室的电话是多少？', type: 'local' },
    { text: '中国旅游人才发展研究院办公室的办公室是？', type: 'local' },
    { text: '65778412是哪个部门的电话？', type: 'local' },
    { text: '求是楼915是哪个部门的办公室？', type: 'local' },
    { text: '65778346是哪个部门的电话？', type: 'local' },
    { text: '"区域国别学院', type: 'local' },
    { text: '(中国“一带一路”战略研究院)办公室的电话是多少？"', type: 'local' },
    { text: '"区域国别学院', type: 'local' },
    { text: '(中国“一带一路”战略研究院)办公室的办公室是？"', type: 'local' },
    { text: '65778676是哪个部门的电话？', type: 'local' },
    { text: '求是楼904是哪个部门的办公室？', type: 'local' },
    { text: '中国文化和旅游产业研究院办公室的电话是多少？', type: 'local' },
    { text: '中国文化和旅游产业研究院办公室的办公室是？', type: 'local' },
    { text: '65771736是哪个部门的电话？', type: 'local' },
    { text: '求是楼1004是哪个部门的办公室？', type: 'local' },
    { text: '人工智能与语言认知实验室办公室的电话是多少？', type: 'local' },
    { text: '人工智能与语言认知实验室办公室的办公室是？', type: 'local' },
    { text: '求是楼806是哪个部门的办公室？', type: 'local' },
    { text: '中国漫画文创研究院办公室的电话是多少？', type: 'local' },
    { text: '中国漫画文创研究院办公室的办公室是？', type: 'local' },
    { text: '65778447是哪个部门的电话？', type: 'local' },
    { text: '求是楼1009是哪个部门的办公室？', type: 'local' },
    { text: '北京市翻译协会办公室的电话是多少？', type: 'local' },
    { text: '北京市翻译协会办公室的办公室是？', type: 'local' },
    { text: '65724832是哪个部门的电话？', type: 'local' },
    { text: '人文楼810是哪个部门的办公室？', type: 'local' },
    { text: '北京二外教育科技有限公司办公室的电话是多少？', type: 'local' },
    { text: '北京二外教育科技有限公司办公室的办公室是？', type: 'local' },
    { text: '85095581是哪个部门的电话？', type: 'local' },
    { text: '北门7号学生公寓底商是哪个部门的办公室？', type: 'local' },
    { text: '校医院总机的电话是多少？', type: 'local' },
    { text: '65778523是哪个部门的电话？', type: 'local' },
    { text: '校医院急诊的电话是多少？', type: 'local' },
    { text: '65778524是哪个部门的电话？', type: 'local' },
    { text: '校医院公费医疗的电话是多少？', type: 'local' },
    { text: '65778509是哪个部门的电话？', type: 'local' },
    { text: '校医院计划生育的电话是多少？', type: 'local' },
    { text: '65778280是哪个部门的电话？', type: 'local' },
    { text: '校医院保健科的电话是多少？', type: 'local' },
    { text: '65778264是哪个部门的电话？', type: 'local' },
    { text: '常用服务电话二外附中的电话是多少？', type: 'local' },
    { text: '65756119是哪个部门的电话？', type: 'local' },
    { text: '常用服务电话二外附小的电话是多少？', type: 'local' },
    { text: '65709825是哪个部门的电话？', type: 'local' },
    { text: '"常用服务电话二外附小', type: 'local' },
    { text: '定福分校的电话是多少？"', type: 'local' },
    { text: '65766206是哪个部门的电话？', type: 'local' },
    { text: '常用服务电话国交前台的电话是多少？', type: 'local' },
    { text: '65778311是哪个部门的电话？', type: 'local' },
    { text: '常用服务电话蜀园餐厅的电话是多少？', type: 'local' },
    { text: '65750188是哪个部门的电话？', type: 'local' },
    { text: '常用服务电话韩餐餐厅的电话是多少？', type: 'local' },
    { text: '65738901是哪个部门的电话？', type: 'local' },
    { text: '常用服务电话送水站的电话是多少？', type: 'local' },
    { text: '65778463是哪个部门的电话？', type: 'local' },
    { text: '常用服务电话车队的电话是多少？', type: 'local' },
    { text: '65778508是哪个部门的电话？', type: 'local' },
    { text: '常用服务电话校内报修的电话是多少？', type: 'local' },
    { text: '65778790是哪个部门的电话？', type: 'local' },
    { text: '常用服务电话宿舍楼值班室的电话是多少？', type: 'local' },
    { text: '65778514是哪个部门的电话？', type: 'local' },
    { text: '密集书库的图书可以外借吗', type: 'local' },
    { text: '期刊能外借吗', type: 'local' },
    { text: '我校图书馆有馆际互借服务吗', type: 'local' },
    { text: '图书馆可以自助借还吗？', type: 'local' },
    { text: '如何自助打印', type: 'local' },
    { text: '毕业了还能使用图书馆吗？', type: 'local' },
    { text: '可以在书上做标记吗？', type: 'local' },
    { text: '如何通过微信收到图书到期提醒？', type: 'local' },
    { text: '学校电子邮箱密码忘了怎么办？', type: 'local' },
    { text: '如何进入文献群？', type: 'local' },
    { text: '图书馆可以朗读吗？', type: 'local' },
    { text: '图书馆在哪儿？', type: 'local' },
    { text: '图书馆网站是什么？', type: 'local' },
    { text: '怎么查找英文资料？', type: 'local' },
    { text: '图书破损了怎么办？', type: 'local' },
    { text: '资料室也在图书馆吗？', type: 'local' },
    { text: '没带校园卡能否借书？', type: 'local' },
    { text: '无法登录数字校园怎么办？', type: 'local' },
    { text: '图书馆微信公众号是什么？', type: 'local' },
    { text: '图书馆各系统的登录账号和密码是什么？', type: 'local' },
    { text: '什么是CARSI？', type: 'local' },
    { text: '因为疫情原因无法到校归还图书怎么办？', type: 'local' },
    { text: '我校提供科技查新服务吗？', type: 'local' },
    { text: '图书馆的借阅证号是什么？', type: 'local' },
    { text: '座位签到时间是多长？', type: 'local' },
    { text: '座位预约用餐时间能暂离吗？', type: 'local' },
    { text: '座位预约能暂时离开座位吗？', type: 'local' },
    { text: '预约后座位预留多长时间？', type: 'local' },
    { text: '座位预约时长是多少？', type: 'local' },
    { text: '何时可以预约第二天的座位？', type: 'local' },
    { text: '座位预约提示无法签到和签退？', type: 'local' },
    { text: '座位预约为什么提示不在签到范围内？', type: 'local' },
    { text: '微门户中使用座位预约提示用户名密码错误？', type: 'local' },
    { text: '为什么APP中找不到座位预约呢？', type: 'local' },
    { text: '座位预约如何自动签退？', type: 'local' },
    { text: '座位预约违约几次会取消权限？', type: 'local' },
    { text: '如何查找和借阅图书内附有的配套光盘？', type: 'local' },
    { text: '借阅图书遗失如何处理？', type: 'local' },
    { text: '还书时间为节假日怎么办？', type: 'local' },
    { text: '借的书在哪儿还？', type: 'local' },
    { text: '如何向图书馆捐赠图书或其它文献资料？', type: 'local' },
    { text: '如何预约图书？', type: 'local' },
    { text: '怎样查看个人借书情况和还书期限？', type: 'local' },
    { text: '超期还书如何处理？', type: 'local' },
    { text: '如何借阅馆藏图书和期刊？', type: 'local' },
    { text: '如何向图书馆推荐购买新书和增订期刊？', type: 'local' },
    { text: '借的书到期后能马上再借吗？', type: 'local' },
    { text: '借书限制几本？可以借阅多久？', type: 'local' },
    { text: '图书馆哪些书不能外借？', type: 'local' },
    { text: '查询的书不在架上？', type: 'local' },
    { text: '可以向图书馆推荐购买数据库吗？', type: 'local' },
    { text: '如何查找纸本报纸？', type: 'local' },
    { text: '如何向图书馆推荐买书资源？', type: 'local' },
    { text: '向图书馆赠书需要与谁联系？', type: 'local' },
    { text: '院系项目图书报销具体有哪些程序？', type: 'local' },
    { text: '怎么推荐购买数据库？', type: 'local' },
    { text: '怎么推荐购买图书？', type: 'local' },
    { text: '怎么捐赠图书？', type: 'local' },
    { text: '图书馆有查重服务么？', type: 'local' },
    { text: '怎么参加图书馆的讲座？', type: 'local' },
    { text: '怎么使用馆际互借？', type: 'local' },
    { text: '怎么使用文献传递？', type: 'local' },
    { text: '数据库不能下载全文是怎么回事？', type: 'local' },
    { text: '怎么查找期刊的收录情况？', type: 'local' },
    { text: '从哪儿进去找数字资源？', type: 'local' },
    { text: '下载知网文章显示让登录是怎么回事？', type: 'local' },
    { text: '中国知网用不了了？', type: 'local' },
    { text: '在家可以使用电子资源吗？', type: 'local' },
    { text: '随书光盘可以下载吗？', type: 'local' },
    { text: '怎么查找本校的学位论文？', type: 'local' },
    { text: '怎么提交学位论文？', type: 'local' },
    { text: '图书馆可以打印吗？', type: 'local' },
    { text: '哪些图书不能借？', type: 'local' },
    { text: '每人能借多少书？', type: 'local' },
    { text: '书丢了怎么办？', type: 'local' },
    { text: '怎么续借图书？', type: 'local' },
    { text: '怎么找书？', type: 'local' },
    { text: '图书馆咨询电话是什么？', type: 'local' },
    { text: '图书馆微信有哪些功能？', type: 'local' },
    { text: '我能借几本书（借书册数）？能借多长时间？', type: 'local' },
    { text: '开馆时间？', type: 'local' },
    { text: '图书馆如何接受捐赠图书？', type: 'local' },
    { text: '校园网充值方法？', type: 'local' },
    { text: '如何连接BISUA？', type: 'local' },
    { text: '校园卡挂失？', type: 'local' },
    { text: '校园卡解挂？', type: 'local' },
    { text: '校园卡重置密码？', type: 'local' },
    { text: '校园信息门户登录密码错误？', type: 'local' },
    { text: '忘记上网登录密码？', type: 'local' },
    { text: '校园卡补办？', type: 'local' },
    { text: '校园卡注意事项？', type: 'local' },
    { text: '校园卡损坏？', type: 'local' },
    { text: '损坏校园卡的处置？', type: 'local' },
    { text: '校园卡消费？', type: 'local' },
    { text: '校园卡设置密码？', type: 'local' },
    { text: '校园卡借给他人？', type: 'local' },
    { text: '捡到校园卡？', type: 'local' },
    { text: '申领校园卡？', type: 'local' },
    { text: '连接校园网无线网？', type: 'local' },
    { text: '网络开户？', type: 'local' },
    { text: '校园网充值？', type: 'local' },
    { text: '无法访问学校主页？', type: 'local' },
    { text: '上不了网，本地连接异常？', type: 'local' },
    { text: '帐号成功登录认证成功，但无法上网？', type: 'local' },
    { text: '哪里能上网？', type: 'local' },
    { text: '网络接口坏了，无法连接校园网？', type: 'local' },
    { text: '更改上网套餐？', type: 'local' },
    { text: '校园网认证页面网址？', type: 'local' },
    { text: '校园网是否支持IPv6？', type: 'local' },
    { text: '无法建立网络连接？', type: 'local' },
    { text: '房间有线网包月？', type: 'local' },
    { text: '计费系统的计费顺序？', type: 'local' },
    { text: '上网欠费？', type: 'local' },
    { text: '计费周期？', type: 'local' },
    { text: '流量异常？', type: 'local' },
    { text: '客户端掉线？', type: 'local' },
    { text: '寒暑假暂停账号？', type: 'local' },
    { text: '校外无法访问教务或财务系统？', type: 'local' },
    { text: '外网VPN无法访问？', type: 'local' },
    { text: '网页不刷新？', type: 'local' },
    { text: '网页点击无反应或页面错乱？', type: 'local' },
    { text: '电脑设置导致网络故障？', type: 'local' },
    { text: '一个账号可以几个设备登陆？', type: 'local' },
    { text: '多个设备使用流量或时长？', type: 'local' },
    { text: '手机无法上网？', type: 'local' },
    { text: '上网时长或流量用完？', type: 'local' },
    { text: '电脑上网前的设置？', type: 'local' },
    { text: '没有用完的产品和套餐转移到下月继续使用？', type: 'local' },
    { text: '校内门户系统登录地址？', type: 'local' },
    { text: '校外登录数字二外？', type: 'local' },
    { text: '数字二外访问其他业务系统？', type: 'local' },
    { text: '数字二外直接登录哪些业务系统？', type: 'local' },
    { text: '访问数字二外？', type: 'local' },
    { text: '浏览器不支持或显示错位？', type: 'local' },
    { text: '数字化校园账户？', type: 'local' },
    { text: '获取电子邮箱？', type: 'local' },
    { text: 'SMTP服务器、POP3服务器、IMAP服务器地址？', type: 'local' },
    { text: '电子邮箱资费？', type: 'local' },
    { text: '电子邮件服务限制？', type: 'local' },
    { text: '更改邮箱密码？', type: 'local' },
    { text: '查询登录日志和收发邮件日志？', type: 'local' },
    { text: '电子邮箱无法接受邮件？', type: 'local' },
    { text: '邮箱保存多久？', type: 'local' },
    { text: '上传附件时，Ctrl键不能使用？', type: 'local' },
    { text: '垃圾邮件放在哪里？', type: 'local' },
    { text: '个人网盘作用？', type: 'local' },
    { text: '“大附件”没有达到上限，但不能收发？', type: 'local' },
    { text: '邮箱超大附件？', type: 'local' },
    { text: '无法发送电子邮件？', type: 'local' },
    { text: '收不到我发的邮件？', type: 'local' },
    { text: 'Outlook接收邮件时，附件无法下载？', type: 'local' },
    { text: '撤回已发的邮件？', type: 'local' },
    { text: '撤回邮件如何操作？', type: 'local' },
    { text: '邮箱系统如何访问？', type: 'local' },
    { text: '邮箱系统的账号及密码？', type: 'local' },
    { text: '邮箱账号与微信绑定？', type: 'local' },
    { text: '忘记邮箱密码？', type: 'local' },
    { text: '能否知道对方已收到并阅读邮件？', type: 'local' },
    { text: '什么是VPN？', type: 'local' },
    { text: 'VPN服务？', type: 'local' },
    { text: '校外访问VPN？', type: 'local' },
    { text: 'VPN用户名和密码？', type: 'local' },
    { text: 'webVPN用户名和密码？', type: 'local' },
    { text: 'VPN对桌面支持？', type: 'local' },
    { text: 'VPN对浏览器支持？', type: 'local' },
    { text: '上网密码修改？', type: 'local' },
    { text: '密集书库的图书可以外借吗?', type: 'local' },
    { text: '期刊能外借吗?', type: 'local' },
    { text: '怎样借书?', type: 'local' },
    { text: '我校图书馆有馆际互借服务吗?', type: 'local' },
    { text: '图书馆可以自助借还吗?', type: 'local' },
    { text: '如何自助打印?', type: 'local' },
    { text: '毕业了还能使用图书馆吗?', type: 'local' },
    { text: '可以在书上做标记吗?', type: 'local' },
    { text: '如何通过微信收到图书到期提醒?', type: 'local' },
    { text: '图书馆可以朗读吗?', type: 'local' },
    { text: '图书馆在哪儿?', type: 'local' },
    { text: '图书馆网站是什么?', type: 'local' },
    { text: '怎么查找英文资料?', type: 'local' },
    { text: '图书破损了怎么办?', type: 'local' },
    { text: '资料室也在图书馆吗?', type: 'local' },
    { text: '没带校园卡能否借书?', type: 'local' },
    { text: '图书馆微信公众号是什么?', type: 'local' },
    { text: '图书馆各系统的登录账号和密码是什么?', type: 'local' },
    { text: '什么是CARSI?', type: 'local' },
    { text: '我校提供科技查新服务吗?', type: 'local' },
    { text: '图书馆的借阅证号是什么?', type: 'local' },
    { text: '座位签到时间是多长?', type: 'local' },
    { text: '座位预约用餐时间能暂离吗?', type: 'local' },
    { text: '座位预约能暂时离开座位吗?', type: 'local' },
    { text: '预约后座位预留多长时间?', type: 'local' },
    { text: '座位预约时长是多少?', type: 'local' },
    { text: '何时可以预约第二天的座位?', type: 'local' },
    { text: '座位预约提示无法签到和签退?', type: 'local' },
    { text: '座位预约为什么提示不在签到范围内?', type: 'local' },
    { text: '微门户中使用座位预约提示用户名密码错误?', type: 'local' },
    { text: '为什么APP中找不到座位预约呢?', type: 'local' },
    { text: '座位预约如何自动签退?', type: 'local' },
    { text: '座位预约违约几次会取消权限?', type: 'local' },
    { text: '如何查找和借阅图书内附有的配套光盘?', type: 'local' },
    { text: '借阅图书遗失如何处理?', type: 'local' },
    { text: '还书时间为节假日怎么办?', type: 'local' },
    { text: '借的书在哪儿还?', type: 'local' },
    { text: '如何向图书馆捐赠图书或其它文献资料?', type: 'local' },
    { text: '如何预约图书?', type: 'local' },
    { text: '怎样查看个人借书情况和还书期限?', type: 'local' },
    { text: '超期还书如何处理?', type: 'local' },
    { text: '如何向图书馆推荐购买新书和增订期刊?', type: 'local' },
    { text: '借的书到期后能马上再借吗?', type: 'local' },
    { text: '借书限制几本？可以借阅多久?', type: 'local' },
    { text: '图书馆哪些书不能外借?', type: 'local' },
    { text: '查询的书不在架上?', type: 'local' },
    { text: '可以向图书馆推荐购买数据库吗?', type: 'local' },
    { text: '如何查找纸本报纸?', type: 'local' },
    { text: '如何向图书馆推荐买书资源?', type: 'local' },
    { text: '向图书馆赠书需要与谁联系？', type: 'local' },
    { text: '院系项目图书报销具体有哪些程序？', type: 'local' },
    { text: '怎么推荐购买图书？', type: 'local' },
    { text: '怎么捐赠图书？', type: 'local' },
    { text: '图书馆有查重服务么？', type: 'local' },
    { text: '怎么参加图书馆的讲座？', type: 'local' },
    { text: '怎么使用馆际互借？', type: 'local' },
    { text: '怎么使用文献传递？', type: 'local' },
    { text: '数据库不能下载全文是怎么回事？', type: 'local' },
    { text: '怎么查找期刊的收录情况？', type: 'local' },
    { text: '从哪儿可以找到数字资源？', type: 'local' },
    { text: '下载知网文章时显示需要登录，是什么原因？', type: 'local' },
    { text: '为什么中国知网用不了了？', type: 'local' },
    { text: '在家可以使用电子资源吗？', type: 'local' },
    { text: '随书光盘可以下载吗？', type: 'local' },
    { text: '怎么查找本校的学位论文？', type: 'local' },
    { text: '如何提交学位论文？', type: 'local' },
    { text: '图书馆可以打印吗？', type: 'local' },
    { text: '每人能借多少书？', type: 'local' },
    { text: '书丢了怎么办？', type: 'local' },
    { text: '如何续借图书？', type: 'local' },
    { text: '如何查找图书？', type: 'local' },
    { text: '图书馆的咨询电话是什么？', type: 'local' },
    { text: '图书馆微信有哪些功能？', type: 'local' },
    { text: '我能借几本书？借期是多长？', type: 'local' },
    { text: '图书馆开馆时间？', type: 'local' },
    { text: '图书馆如何接受捐赠图书？', type: 'local' },
    { text: '店家营业时间？', type: 'local' },
    { text: '食堂可以点外卖的联系方式？', type: 'local' },
    { text: '人文楼找路？', type: 'local' },
    { text: '二外学习生活需要用的软件？', type: 'local' },
    { text: '如何预约自习室座？', type: 'local' },
    { text: '如何预约图书馆自习座位？', type: 'local' },
    { text: '就业指导中心在哪？', type: 'local' },
    { text: '就业指导中心办公室', type: 'local' },
    { text: '新生对个人职业发展感到迷茫怎么办？', type: 'local' },
    { text: '不了解面试流程、不懂面试技巧怎么办?', type: 'local' },
    { text: '不会写简历怎么办？', type: 'local' },
    { text: '简历修改', type: 'local' },
    { text: '就业指导', type: 'local' },
    { text: '职业生涯规划', type: 'local' },
    { text: '模拟面试', type: 'local' },
    { text: '面试技巧', type: 'local' },
    { text: '面试全流程', type: 'local' },
    { text: '想要提前了解心仪的公司有什么渠道呢?', type: 'local' },
    { text: '企业宣讲', type: 'local' },
    { text: '就业大讲堂', type: 'local' },
    { text: '专业前景', type: 'local' },
    { text: '专业发展方向', type: 'local' },
    { text: '往届毕业生去向', type: 'local' },
    { text: '优秀学长学姐分享', type: 'local' },
    { text: '就业学生组织', type: 'local' },
    { text: '必须要实习吗？', type: 'local' },
    { text: '实习重要吗', type: 'local' },
    { text: '应届生错过了秋招怎么办？', type: 'local' },
    { text: '什么是就业协议书？（三方协议）有何作用？', type: 'local' },
    { text: '就业协议书', type: 'local' },
    { text: '三方协议', type: 'local' },
    { text: '什么是毕业生的档案？档案有什么作用？', type: 'local' },
    { text: '毕业生档案', type: 'local' },
    { text: '档案', type: 'local' },
    { text: '进出校门刷脸不成功', type: 'local' },
    { text: '人脸信息采集', type: 'local' },
    { text: '刷脸出不去校门', type: 'local' },
    { text: '校医院开放时间', type: 'local' },
    { text: '急诊', type: 'local' },
    { text: '校医院报销流程', type: 'local' },
    { text: '其他医院的急诊、门诊能否报销公费医疗', type: 'local' },
    { text: '医务室购买药品时药费的支付问题', type: 'local' },
    { text: '药费', type: 'local' },
    { text: '药品', type: 'local' },
    { text: '医保', type: 'local' },
    { text: '校医院如何转诊', type: 'local' },
    { text: '合同医院', type: 'local' },
    { text: '朝阳医院', type: 'local' },
    { text: '吃出异物或变质食物', type: 'local' },
    { text: '食品问题', type: 'local' },
    { text: '菜品问题', type: 'local' },
    { text: '电脑如何连接校园网、内网', type: 'local' },
    { text: '校园网充值问题', type: 'local' },
    { text: '校内WiFi、学校流量怎么买', type: 'local' },
    { text: '宿舍电费怎么交', type: 'local' },
    { text: '宿舍没电了在哪里交钱', type: 'local' },
    { text: '怎么充宿舍电费', type: 'local' },
    { text: '宿舍楼工具借用', type: 'local' },
    { text: '小推车', type: 'local' },
    { text: '板车', type: 'local' },
    { text: '如何在广播台投稿歌曲', type: 'local' },
    { text: '广播台', type: 'local' },
    { text: '操场广播点歌', type: 'local' },
    { text: '如何从学校寄出快递', type: 'local' },
    { text: '学校菜鸟驿站的营业时间', type: 'local' },
    { text: '快递站几点开着门', type: 'local' },
    { text: '菜鸟驿站', type: 'local' },
    { text: '下沉广场打印店的营业时间', type: 'local' },
    { text: '地下打印店开到几点', type: 'local' },
    { text: '下沉广场电脑维修店的营业时间', type: 'local' },
    { text: '手机维修店开到几点', type: 'local' },
    { text: '学校附近能办身份证的派出所', type: 'local' },
    { text: '身份证丢了在哪补办', type: 'local' },
    { text: '校园卡里的余钱毕业后如何退还', type: 'local' },
    { text: '毕业了校园卡钱怎么退', type: 'local' },
    { text: '学校自助补卡机的位置', type: 'local' },
    { text: '卡丢了去哪补办', type: 'local' },
    { text: '学生证补办流程', type: 'local' },
    { text: '怎么补办学生证', type: 'local' },
    { text: '人文楼的ATM机的位置和使用', type: 'local' },
    { text: '学校取款机在哪', type: 'local' },
    { text: '六号楼底下自习室开放时间', type: 'local' },
    { text: '游泳馆开放问题', type: 'local' },
    { text: '学生可以去游泳馆吗', type: 'local' },
    { text: '学校浴室开放时间', type: 'local' },
    { text: '浴室几点关门', type: 'local' },
    { text: '老浴室水压问题', type: 'local' },
    { text: '浴室水小怎么办', type: 'local' },
    { text: '学校宿舍AED除颤仪位置', type: 'local' },
    { text: '学校里AED位置', type: 'local' },
    { text: '求是楼教室门口的课表未张贴', type: 'local' },
    { text: '火车学生票的核验', type: 'local' },
    { text: '学生证买火车票、飞机票不能使用', type: 'local' },
    { text: '学校的成绩排名证明如何查询和打印', type: 'local' },
    { text: '查询成绩排名', type: 'local' },
    { text: '第二课堂参加讲座在哪报名', type: 'local' },
    { text: '第二课堂学分和综测分的相关性', type: 'local' },
    { text: '讴客的分怎么算在综测里', type: 'local' },
    { text: '为什么有的同学能收到补助，有的同学收不到', type: 'local' },
    { text: '还没收到补助', type: 'local' },
    { text: '学校财务通用的银行', type: 'local' },
    { text: '领取学校发的资金需要哪个银行卡', type: 'local' },
    { text: '临时困难申请', type: 'local' },
    { text: '怎么申请临时困难帮助', type: 'local' },
    { text: '财务不开门', type: 'local' },
    { text: '财务不能办理', type: 'local' },
    { text: '请假流程', type: 'local' },
    { text: '请假一天以上怎么申请', type: 'local' },
    { text: '转专业要求', type: 'local' },
    { text: '怎么转专业', type: 'local' },
    { text: '休学', type: 'local' },
    { text: '休学限制', type: 'local' },
    { text: '离校', type: 'local' },
    { text: '离校需要办什么手续', type: 'local' },
    { text: '综测有什么用', type: 'local' },
    { text: '综测用处', type: 'local' },
    { text: '考过雅思、托福、普通话、驾照，能加附加分吗', type: 'local' },
    { text: '梧桐奖章报名', type: 'local' },
    { text: '梧桐奖章评选要求', type: 'local' },
    { text: '梧桐奖章奖励', type: 'local' },
    { text: '校长奖章', type: 'local' },
    { text: '校长奖章评选要求', type: 'local' },
    { text: '勤工助学都有哪些岗位、包括哪些', type: 'local' },
    { text: '勤工助学怎么申请', type: 'local' },
    { text: '勤工助学补助条件', type: 'local' },
    { text: '勤工助学补助什么时候申请，什么时候发', type: 'local' },
    { text: '校园跑要求', type: 'local' },
    { text: '校园跑距离和次数', type: 'local' },
    { text: '第二外语选课', type: 'local' },
    { text: '外语学院必须选修第二外语吗', type: 'local' },
    { text: '心理咨询预约', type: 'local' },
    { text: '心情不好在哪进行心理咨询', type: 'local' },
    { text: '图书馆借书', type: 'local' },
    { text: '一次可以借几本书', type: 'local' },
    { text: '宿舍门禁时间、宿舍晚上几点关门', type: 'local' },
    { text: '宿舍断电时间、宿舍熄灯时间', type: 'local' },
    { text: '宿舍相关规定时间', type: 'local' },
    { text: '社团必须参加吗、有硬性要求吗', type: 'local' },
    { text: '参加校级组织或院级组织还可以参加社团吗', type: 'local' },
    { text: '社团和院级、校级学生组织可以都参加吗', type: 'local' },
    { text: '北京第二外国语学院地址？', type: 'local' },
    { text: 'qa:开馆时间', type: 'local' },
    { text: 'qa:北京第二外国语学院地址', type: 'local' },
    { text: 'qa:北二外地址', type: 'local' },
    { text: 'qa:河马有多少颗牙', type: 'local' },
    { text: 'qa:王毅是谁', type: 'local' },
    { text: 'qa:四大名著是包括什么', type: 'local' },
    { text: 'qa:网络报修电话', type: 'local' },
    { text: 'qa:java环境如何配置', type: 'local' },
    { text: 'qa:太阳系有几大行星', type: 'local' },
    { text: 'qa:地球的年龄', type: 'local' },
    { text: 'qa:鳄鱼的寿命', type: 'local' },
    { text: 'qa:太阳年龄', type: 'local' },
    { text: 'qa:北京有多少个区', type: 'local' },
    { text: 'qa:python环境如何配置', type: 'local' },
    { text: '开馆时间', type: 'local' },
    { text: '熊猫的寿命', type: 'local' },
    { text: '什么是桌面虚拟化', type: 'local' },
    { text: '水浒传讲的是什么', type: 'local' },
    { text: '什么是金砖合作', type: 'local' },
    { text: '北京工业大学地址', type: 'local' },
    { text: '网络报修电话', type: 'local' },
    { text: 'test的中文意思', type: 'local' },
    { text: '什么是双非网站', type: 'local' },
    { text: '清华大学在哪', type: 'local' },
    { text: 'C++语言如何配置环境', type: 'local' },
    { text: '河马的寿命', type: 'local' },
    { text: '北京的面积多大', type: 'local' },
    { text: '你叫什么名字', type: 'local' },
    { text: '我应该问你什么样的问题', type: 'local' },
    { text: '那你还有很多要学习的', type: 'local' },
    { text: '最近很焦虑，有没有解决焦虑的方法吗', type: 'local' },
    { text: '跑步有什么技巧吗', type: 'local' },
    { text: '怎么快速入眠', type: 'local' },
    { text: '如何增强记忆力', type: 'local' },
    { text: '如何更高效的使用电脑', type: 'local' },
    { text: '怎么控制购物的习惯', type: 'local' },
    { text: '如何更好地与老师沟通', type: 'local' },
    { text: '有没有学习小语种的方法', type: 'local' },
    { text: '如何更好地利用数字二外', type: 'local' },
    { text: '北二外延庆校区在哪里？', type: 'local' },
    { text: '校园卡丢失怎么办？', type: 'local' },
    { text: '请问自助补领卡处在哪里？', type: 'local' },
    { text: '如果丢失宿舍钥匙应该如何处理？', type: 'local' },
    { text: '请你介绍一下北二外', type: 'local' },
    { text: '请问学校校园网的缴费规则是？', type: 'local' },
    { text: '你可以做什么', type: 'local' },
    { text: '你好', type: 'local' },
    { text: '图书馆开放时间', type: 'local' },
    { text: '一食堂开放时间', type: 'local' },
    { text: '如何预约图书馆位置', type: 'local' },
    { text: '如何结束', type: 'local' },
    { text: '如何借书', type: 'local' },
    { text: '流量怎么充值', type: 'local' },
    { text: '怎么称呼你？', type: 'local' },
    { text: '小冰，如果我找不到校园卡，怎么处理？', type: 'local' },
    { text: '我该如何向留学生介绍我的学校？', type: 'local' },
    { text: '如何获得辅修（第二专业）证书？', type: 'local' },
    { text: '你好呀、', type: 'local' },
    { text: '你好，怎么称呼？', type: 'local' },
    { text: '你的能力是？', type: 'local' },
    { text: '你知道棠心是什么吗', type: 'local' },
    { text: '你知道明德楼在哪吗', type: 'local' },
    { text: '我该怎么找到我的快递？', type: 'local' },
    { text: '你知道梧桐奖章吗', type: 'local' },
    { text: '你知道一次校园跑至少要跑多少公里吗？', type: 'local' },
    { text: '评选标准和比例是什么？', type: 'local' },
    { text: '你知道综测加分规则吗', type: 'local' },
    { text: '我们学校有哪些优势专业', type: 'local' },
    { text: '如何申请使用教室', type: 'local' },
    { text: '宿舍门禁？', type: 'local' },
    { text: '你知道怎么预约自习吗', type: 'local' },
    { text: '你知道下沉广场有什么吗？', type: 'local' },
    { text: '在哪里可以打印', type: 'local' },
    { text: '怎么借书？', type: 'local' },
    { text: '图书馆的功能是什么？', type: 'local' },
    { text: '教务处在哪栋教学楼', type: 'local' },
    { text: '如何打印绩点成绩单', type: 'local' },
    { text: '明德楼是行政楼吗', type: 'local' },
    { text: '我们学校校园跑怎么完成', type: 'local' },
    { text: '大学生医疗报销怎么完成', type: 'local' },
    { text: '学校有哪些食堂？能吃到什么饭？', type: 'local' },
    { text: '寄到学校的快递地址写哪里？', type: 'local' },
    { text: '二外人文楼在哪？', type: 'local' },
    { text: '二外求是楼在哪/', type: 'local' },
    { text: '求是楼在哪', type: 'local' },
    { text: '快递寄到学校地址怎么写？', type: 'local' },
    { text: '你是哪个学校的ai助手/', type: 'local' },
    { text: '你会服务二外师生吗？', type: 'local' },
    { text: '我在哪能获取到学生手册？', type: 'local' },
    { text: '二外有几个食堂', type: 'local' },
    { text: '二外全称是什么', type: 'local' },
    { text: '北二外有研究生专业嘛', type: 'local' },
    { text: '请你给我提供一下学校官网的网址', type: 'local' },
    { text: '北二外有高级翻译学院吗？', type: 'local' },
    { text: '你好，你是谁', type: 'local' },
    { text: 'bisu是什么', type: 'local' },
    { text: 'BISU', type: 'local' },
    { text: '介绍下二外', type: 'local' },
    { text: 'BISU的意思', type: 'local' },
    { text: '大熊猫的栖息地', type: 'local' },
    { text: '如何预约座位', type: 'local' },
    { text: '北京的天气情况', type: 'local' },
    { text: '国土面积', type: 'local' },
    { text: '中国的国土面积', type: 'local' },
    { text: '北京的天气', type: 'local' },
    { text: '食堂的饭好吃吗', type: 'local' },
    { text: '食堂在哪', type: 'local' },
    { text: '怎么联系相关技术人员', type: 'local' },
    { text: '美国面积', type: 'local' },
    { text: '中国面积', type: 'local' },
    { text: '您是', type: 'local' },
    { text: '我想回家', type: 'local' },
    { text: '你是', type: 'local' },
    { text: '介绍下北京第二外国语学院', type: 'local' },
    { text: '二外有哪些专业', type: 'local' },
    { text: '二外历史', type: 'local' },
    { text: '请给我简单介绍下二外', type: 'local' },
    { text: '梧桐奖章申请条件', type: 'local' },
    { text: 'ninhao', type: 'local' },
    { text: '您好', type: 'local' },
    { text: '您好，6号公寓怎么走', type: 'local' },
    { text: '北京未来天气情况', type: 'local' },
    { text: '北京的面积', type: 'local' },
    { text: '北京的经度', type: 'local' },
    { text: '猴子的寿命', type: 'local' },
    { text: '出3道网络方面的问题', type: 'local' },
    { text: '怎么打电话', type: 'local' },
    { text: '食堂啥时间开放', type: 'local' },
    { text: '如何使用一卡通', type: 'local' },
    { text: '如何联系学工部', type: 'local' },
    { text: '北京第二外国语学院的英语全称', type: 'local' },
    { text: '你知道的有点儿少呢', type: 'local' },
    { text: '你不是应该叫棠心吗？', type: 'local' },
    { text: '我觉得这个学校不好', type: 'local' },
    { text: '你会画画吗？', type: 'local' },
    { text: '洗澡怎样充值', type: 'local' },
    { text: '二外有那些知名校友', type: 'local' },
    { text: '北二外的校友有哪些？', type: 'local' },
    { text: '一卡通充值', type: 'local' },
    { text: '怎么给一卡通充值', type: 'local' },
    { text: '卡没钱了', type: 'local' },
    { text: '一卡通', type: 'local' },
    { text: '银行卡密码', type: 'local' },
    { text: '食堂补助', type: 'local' },
    { text: '食堂补助什么时候发', type: 'local' },
    { text: '心理辅导', type: 'local' },
    { text: '食堂吃东西吗', type: 'local' },
    { text: '有哪些食堂', type: 'local' },
    { text: '还能解决其他问题吗？', type: 'local' },
    { text: '网上平台在哪', type: 'local' },
    { text: '什么时候放假', type: 'local' },
    { text: '知行楼在哪', type: 'local' },
    { text: '人文楼在哪', type: 'local' },
    { text: '明德楼在哪', type: 'local' },
    { text: '北京有多少个区', type: 'local' },
    { text: '河马的牙齿数量', type: 'local' },
    { text: '猩猩的牙齿数量', type: 'local' },
    { text: '马蜂的寿命', type: 'local' },
    { text: '地球的年龄', type: 'local' },
    { text: '北京第二外国语学院地址', type: 'local' },
    { text: '985高校都包括哪些', type: 'local' },
    { text: '北京大学地址', type: 'local' },
    { text: '北京工业大学在哪', type: 'local' },
    { text: '北京大学在哪', type: 'local' },
    { text: '北二外在哪', type: 'local' },
    { text: '你以后会取个名字吗', type: 'local' },
    { text: '最近学校会举办什么活动', type: 'local' },
    { text: '我明天有什么课', type: 'local' },
    { text: '咱们学校有多大', type: 'local' },
    { text: '咱们学校的校长是谁', type: 'local' },
    { text: '北二外有多少个学院', type: 'local' },
    { text: '北二外学校介绍', type: 'local' },
    { text: '今年是北二外建校第几年', type: 'local' },
    { text: '北二外有研究生专业吗', type: 'local' },
    { text: '北二外高级翻译学院的研究生专业有那些', type: 'local' },
    { text: '北二外有几个校区', type: 'local' },
    { text: '北二外招生办公室电话是多少', type: 'local' },
    { text: 'BISU是啥', type: 'local' },
    { text: 'bisu是啥', type: 'local' },
    { text: 'BISU是什么意思', type: 'local' },
    { text: 'bisu是什么意思', type: 'local' },
    { text: '介绍下BISU', type: 'local' },
    { text: '介绍下bisu', type: 'local' },
    { text: '你几岁啦', type: 'local' },
    { text: '你好，校园卡掉了怎么补', type: 'local' },
    { text: '听音乐多久合适呢', type: 'local' },
    { text: '北京第二外国语学院地址是哪里？', type: 'local' },
    { text: '北二外地址在哪里？', type: 'local' },
    { text: '北二外校庆是哪天？', type: 'local' },
    { text: '北二外哪些专业比较好？', type: 'local' },
    { text: '北二外就业形势如何？', type: 'local' },
    { text: '如何给校园网充值？', type: 'local' },
    { text: '校内有哪几个食堂？', type: 'local' },
    { text: '请问校园卡丢失应该在哪里补办？', type: 'local' },
    { text: '请问6号楼下沉广场女生浴室的开放时间为？', type: 'local' },
    { text: '请你介绍一下北二外的院系设置', type: 'local' },
    { text: '请问，翔宇楼一层基本伙的开放时间为？', type: 'local' },
    { text: '我校取得学位证的条件是', type: 'local' },
    { text: '请介绍一下北二外人文楼', type: 'local' },
    { text: '浴室开放时间', type: 'local' },
    { text: '自习室开放时间', type: 'local' },
    { text: '在读证明如何办理', type: 'local' },
    { text: '翔宇楼一层开放时间', type: 'local' },
    { text: '风味食堂开放时间', type: 'local' },
    { text: '三食堂一层开放时间', type: 'local' },
    { text: '请你介绍一下小鸾', type: 'local' },
    { text: '校医院在哪儿', type: 'local' },
    { text: 'bisu', type: 'local' },
    { text: '北京第二外国语学院有哪些校友', type: 'local' },
    { text: '北京第二外国语学院有哪些知名校友', type: 'local' },
    { text: '北京第二外国语学院的校友', type: 'local' },
    { text: '北京第二外国语学院校友有哪些', type: 'local' },
    { text: '数字二外的网址是啥', type: 'local' },
    { text: '学校的官网是啥', type: 'local' },
    { text: '北京第二外国语学院的官网是啥', type: 'local' },
    { text: '二外的官网是啥', type: 'local' },
    { text: '北二外研究生招生网的地址', type: 'local' },
    { text: '北二外研招网的网址是', type: 'local' },
    { text: '二外的高级翻译学院官网', type: 'local' },
    { text: '北二外本科生招生网', type: 'local' },
    { text: '北二外研究生招生网', type: 'local' },
    { text: '北二外的就业信息网', type: 'local' },
    { text: '女生宿舍六号楼是啥', type: 'local' },
    { text: '女生宿舍六号楼在哪', type: 'local' },
    { text: '女生宿舍七号楼在哪呢', type: 'local' },
    { text: '女生宿舍的开关门时间', type: 'local' },
    { text: '女生宿舍的用电安全', type: 'local' },
    { text: '男生宿舍一号楼在哪', type: 'local' },
    { text: '男生宿舍三号楼在哪', type: 'local' },
    { text: '男生宿舍五号楼在哪', type: 'local' },
    { text: '学校有哪些浴室', type: 'local' },
    { text: '学校打印店', type: 'local' },
    { text: '学校的快递点', type: 'local' },
    { text: '研究生宿舍', type: 'local' },
    { text: '留学生宿舍', type: 'local' },
    { text: '图书馆在哪', type: 'local' },
    { text: '图书馆', type: 'local' },
    { text: '明德楼', type: 'local' },
    { text: '知行楼', type: 'local' },
    { text: '竞先楼', type: 'local' },
    { text: '竞先楼在哪', type: 'local' },
    { text: '求是楼', type: 'local' },
    { text: '求是楼是干什么的', type: 'local' },
    { text: '人文楼', type: 'local' },
    { text: '人文楼是干什么的', type: 'local' },
    { text: '库迪咖啡二外店', type: 'local' },
    { text: '肯德基二外店', type: 'local' },
    { text: '天猫超市二外店', type: 'local' },
    { text: '校医院', type: 'local' },
    { text: '北京第二外国语学院共有几个食堂？', type: 'local' },
    { text: '北京第二外国语学院食堂的营业时间是几点到几点？', type: 'local' },
    { text: '第一食堂有什么', type: 'local' },
    { text: '二外的食堂有几个', type: 'local' },
    { text: '食堂有哪些', type: 'local' },
    { text: '三食堂开放时间？', type: 'local' },
    { text: '食堂的开放时间分别是？', type: 'local' },
    { text: '食堂怎么样', type: 'local' },
    { text: '食堂几点开门', type: 'local' },
    { text: '北京第二外国语学院都有什么食堂', type: 'local' },
    { text: '二外的食堂那个档口好吃', type: 'local' },
    { text: '食堂基本伙开放时间？', type: 'local' },
    { text: '您好，请问食堂最好吃的是什么', type: 'local' },
    { text: '北二外有几个专业学院，比如高级翻译学院这种的学院。', type: 'local' },
    { text: '二外汉语言专业招生情况', type: 'local' },
    { text: '人文楼有几层', type: 'local' },
    { text: '明德楼有几层', type: 'local' },
    { text: '北京第二外国语学院的校训', type: 'local' },
    { text: '北京第二外国语学院的学风', type: 'local' },
    { text: '北京第二外国语学院的教风', type: 'local' },
    { text: '二外今年是几周年', type: 'local' },
    { text: '二外的书记是谁', type: 'local' },
    { text: '学校附近有地铁站吗', type: 'local' },
    { text: '学校附近有公交车站吗', type: 'local' },
    { text: '怎么去学校的健身房', type: 'local' },
    { text: '操场平时从哪个门进去', type: 'local' },
    { text: '二外在中传的那一侧', type: 'local' },
    { text: '二外离中传多少米', type: 'local' },
    { text: '北京第二外国语学院有哪些楼', type: 'local' },
    { text: '国际交流中心在哪', type: 'local' },
    { text: '你知道北京第二外国语学院门禁时间吗', type: 'local' },
    { text: '北京第二外国语学院招生办公室电话', type: 'local' },
    { text: '北京第二外国语学院的招生办电话', type: 'local' },
    { text: '给我推荐几个学生组织或社团', type: 'local' },
    { text: '澡堂几点开门', type: 'local' },
    { text: '学校有麦当劳吗', type: 'local' },
    { text: '下沉广场在哪', type: 'local' },
    { text: '二外有几个快递站', type: 'local' },
    { text: '校医院在哪', type: 'local' },
    { text: '你知道咱门学校有几个大门吗', type: 'local' },
    { text: '英语学院辅导员办公室在哪？', type: 'local' },
    { text: '二外英语学院辅导员办公室在哪？', type: 'local' },
    { text: '校医院的上班时间是几点到几点？', type: 'local' },
    { text: '文化与传播学院的办公室在哪？', type: 'local' },
    { text: '你知道北京第二外国语学院库迪咖啡的位置吗', type: 'local' },
    { text: '二外今年什么时候放寒假？', type: 'local' },
    { text: '网信中心联系方式', type: 'local' },
    { text: '图书馆网站', type: 'local' },
    { text: '我校的本科生招生网址', type: 'local' },
    { text: '招生办网址是啥啊', type: 'local' },
    { text: '我校的研究生招生网址', type: 'local' },
    { text: '我校的留学生招生网址', type: 'local' },
    { text: '城市图书馆在哪', type: 'local' },
    { text: '图书馆的开放时间', type: 'local' },
    { text: '北京第二外国语学院图书馆的开放时间', type: 'local' },
    { text: '二外图书馆的开放时间', type: 'local' },
    { text: '你能干什么', type: 'local' },
    { text: '你能做什么', type: 'local' },
    { text: '你能解决什么问题', type: 'local' },
    { text: '你能回答什么问题', type: 'local' },
    { text: '你知道学校体测各项成绩的及格线嘛', type: 'local' },
    { text: '你知道英语学院办公室在人文楼几层吗？', type: 'local' },
    { text: '你知道人文楼每天几点关门吗', type: 'local' },
    { text: '体育成绩评定标准？', type: 'local' },
    { text: '你知道学生干部综测加多少分吗', type: 'local' },
    { text: '我们学校绩点计算规则', type: 'local' },
    { text: '你知道学校在和哪些国外的大学有交换项目吗？', type: 'local' },
    { text: '英语学院教秘办公室或联系电话', type: 'local' },
    { text: '政党外交学院的联系电话是多少', type: 'local' },
    { text: '我们学校有什么奖学金', type: 'local' },
    { text: '与二外有交换项目的国外高校有哪些？', type: 'local' },
    { text: '与二外有交换生项目的学校有哪些？', type: 'local' },
    { text: '如何计算GPA？', type: 'local' },
    { text: '如何计算二外GPA？', type: 'local' },
    { text: '二外全国大学排名多少', type: 'local' },
    { text: '二外有几个自习室', type: 'local' },
    { text: '我想了解学生处的业务', type: 'local' },
    { text: '我想申请助学金，具体流程是怎样的？', type: 'local' },
    { text: '北二外2023年研究生招生规模如何', type: 'local' },
    { text: '哪个单位统一为出国学习的学生办理休学保留学籍的手续？', type: 'local' },
    { text: '学生在出国学习期间须完成的学分总量是多少', type: 'local' },
    { text: '我考试没及格，心情不好，可以安慰一下我吗？', type: 'local' },
    { text: '您好，请问研究生学业奖学金最新版怎么测算', type: 'local' },
    { text: '最近有什么活动', type: 'local' },
    { text: '北京第二外国语学院都有哪些教学楼？', type: 'local' },
    { text: '北京第二外国语学院南北门的开放时间', type: 'local' },
    { text: '你知道6号楼在哪吗', type: 'local' },
    { text: '你知道英语学院办公室在几层吗', type: 'local' },
    { text: '体测都分布在什么时候', type: 'local' },
    { text: '朝阳医院', type: 'local' },
    { text: '图书馆开放时间', type: 'local' },
    { text: '外文分管136开放时间', type: 'local' },
    { text: '六号楼底下自习室开放时间', type: 'local' },
    { text: '学校浴室开放时间', type: 'local' },
    { text: '浴室几点关门', type: 'local' }

   ]

    // 响应式变量：建议相关
    const showSuggestions = ref(false);
    const selectedSuggestionIndex = ref(0);
    const apiRequestTimeout = ref(null);
    
    // 创建建议列表
// 响应式变量：建议相关
const localSuggestions = ref(suggestion);
const suggestions = ref([]);

// 初始化建议数据
const initializeSuggestions = async () => {
  try {
    console.log('🚀 正在初始化建议数据...');
    
    // 首先使用本地建议
    suggestions.value = [...localSuggestions.value];
    
    // 异步获取API建议并合并
    const apiSuggestions = await chatService.fetchSuggestions();    
    if (apiSuggestions && apiSuggestions.length > 0) {
      // 如果API建议已经是正确的格式 {text: "...", type: "api"}
      if (apiSuggestions[0] && typeof apiSuggestions[0] === 'object' && apiSuggestions[0].text) {
        // 合并本地建议和API建议
        suggestions.value = [...localSuggestions.value, ...apiSuggestions];
        console.log(`✅ 建议数据初始化完成，共 ${suggestions.value.length} 条建议 (本地: ${localSuggestions.value.length}, API: ${apiSuggestions.length})`);
      } else {
        // 如果API建议是字符串数组，需要转换格式
        const formattedApiSuggestions = apiSuggestions.map(text => ({
          text: text,
          type: 'api'
        }));
        
        // 合并本地建议和API建议
        suggestions.value = [...localSuggestions.value, ...formattedApiSuggestions];
        console.log(`✅ 建议数据初始化完成，共 ${suggestions.value.length} 条建议 (本地: ${localSuggestions.value.length}, API: ${apiSuggestions.length})`);
      }
    } else {
      console.log('⚠️ API建议获取失败，仅使用本地建议');
    }
  } catch (error) {
    console.error('❌ 建议数据初始化失败:', error);
    // 确保至少有本地建议可用
    suggestions.value = [...localSuggestions.value];
  }
};


// 生命周期钩子
onMounted(async () => {
  console.log('ChatView组件已挂载，正在初始化...');
  
  // 初始化基础功能
  await initialize();
  
  // 初始化建议数据
  await initializeSuggestions();
    
  // 初始化内容变化观察器
  const cleanup = observeContentChanges();
  
  // 组件挂载后自动滚动到底部
  nextTick(() => {
    scrollToBottom();
  });
  
  // 将清理函数存储起来，在组件卸载时调用
  cleanupFunctions.cleanup = cleanup;
});

// 添加清理函数存储
const cleanupFunctions = reactive({
  cleanup: null
});

// 组件卸载时清理资源
onUnmounted(() => {
  if (cleanupFunctions.cleanup) {
    cleanupFunctions.cleanup();
  }
  window.removeEventListener('online', checkApiConnection);
  window.removeEventListener('offline', () => { isApiConnected.value = false; });
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
      iconUrl,
      getUserRole,
      onTypingFinished,      
      handleInputChange,
      navigateSuggestion,
      selectSuggestion,
      closeSuggestions,
      filteredSuggestions,
      handleTypingProgress,
      // 校园共建相关
      isContributionFormVisible,
      toggleContributionForm,
      showContributionForm,
      // 建议相关
      showSuggestions,
      selectedSuggestionIndex,
      apiRequestTimeout
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
  width: 120px;
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

/* 校园共建按钮样式 */
.campus-contribution-section {
  margin-bottom: 20px;
  padding: 0 10px;
}

.campus-contribution-btn {
  width: 100%;
  padding: 12px 15px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: rgba(255, 255, 255, 0.15);
  color: white;
  border: none;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.campus-contribution-btn:hover {
  background-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.campus-contribution-btn.active {
  background-color: var(--campus-accent, #4e8cff);
  box-shadow: 0 0 12px rgba(78, 140, 255, 0.4);
}

.campus-contribution-btn .icon-build {
  margin-right: 5px;
  width: 80px;
  height: 80px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  display: inline-block;
  flex-shrink: 0;
}

.campus-contribution-btn .contribution-text {
  font-size: 14px;
  font-weight: 500;
  flex-grow: 1;
  text-align: center;
  margin: 0 5px;
}

.campus-contribution-btn .contribution-logo {
  width: 80px;
  height: 80px;
  object-fit: contain;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  padding: 2px;
}

@media (max-width: 768px) {
  .campus-contribution-section {
    margin-bottom: 15px;
  }
  
  .campus-contribution-btn {
    padding: 8px 12px;
    font-size: 14px;
  }
  
  .campus-contribution-btn .icon-build {
    width: 20px;
    height: 20px;
  }
  
  .campus-contribution-btn .contribution-logo {
    width: 18px;
    height: 18px;
  }
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
  /* padding-right: 5px; */
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
  width: 60px;
  height: 60px;
  min-width: 20px;
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
  font-weight: 100;
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
  height: 80px; /* 从150px降低到100px */
  position: relative;
  margin-bottom: 0px;
  border-radius: var(--campus-radius-lg);
  overflow: hidden;
  box-shadow: var(--campus-shadow-md);
  transition: var(--campus-transition);
  border: 1px solid var(--campus-neutral-300);
  background-image: url('/banners/banner.png');
  background-size: cover;
  background-position: center;
  display: flex;
  justify-content: center;
  align-items: center;
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

.scene-banner .banner-text {
  color: #000;
  font-family: 'KaiTi', '楷体', STKaiti, serif;
  font-size: 2rem; /* 从3rem缩小到2rem */
  letter-spacing: 5px;
  font-weight: bold;
  text-align: center;  line-height: 1.5;
  padding: 12px 20px; /* 减少上下内边距 */
  background-color: rgba(255, 255, 255, 0.4);
  border-radius: 10px;
  z-index: 2;
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
    min-width: auto;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    padding: 0;
    justify-content: center;
    align-items: center;
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
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%233e8055' viewBox='0 0 24 24'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z'/%3E%3C/svg%3E");
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
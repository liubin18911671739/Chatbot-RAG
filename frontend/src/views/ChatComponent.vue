<!-- ChatComponent.vue -->
<template>
  <div class="chat-container">
    <!-- 网络状态指示器 -->
    <div v-if="!isApiConnected" class="network-status-warning">
      <i class="el-icon-warning"></i> 
      网络连接中断，部分功能可能不可用
      <button @click="checkApiConnection" class="retry-button">重试</button>
    </div>
    
    <!-- 欢迎消息横幅 -->
    <div class="greeting-banner">
      <div class="greeting-content" v-html="welcomeMessage"></div>
    </div>
    
    <!-- 聊天消息展示区 -->
    <div class="messages-container" ref="messagesContainer">
      <div v-for="(message, index) in messages" 
           :key="index" 
           :class="['message', message.sender]">
        <div class="message-content" v-html="message.content"></div>
        
        <!-- 附件展示区 -->
        <div class="attachments" v-if="message.attachments && message.attachments.length">
          <div v-for="(attachment, i) in message.attachments" :key="i" class="attachment">
            <img v-if="isImageAttachment(attachment.name)" 
                 :src="`data:image/png;base64,${attachment.data}`" 
                 :alt="attachment.name" 
                 @click="enlargeImage(attachment)" />
            <a v-else @click="downloadAttachment(attachment)"
               href="javascript:void(0)">
              <span class="attachment-icon"></span>
              {{ attachment.name }}
            </a>
          </div>
        </div>
        
        <!-- 来源信息展示区 -->
        <div class="sources" v-if="message.sources && message.sources.length">
          <div class="sources-title">参考来源：</div>
          <ul>
            <li v-for="(source, i) in message.sources" :key="i">
              <a v-if="source.url" :href="source.url" target="_blank">
                {{ source.title || source.document || '未知来源' }}
              </a>
              <span v-else>{{ source.title || source.document || '未知来源' }}</span>
            </li>
          </ul>
        </div>
      </div>
      
      <!-- 加载状态 -->
      <div class="typing-indicator" v-if="isLoading">
        <span>思考中</span><span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
      </div>
    </div>
    
    <!-- 输入区 -->
    <div class="input-area">
      <textarea 
        v-model="userInput" 
        @keypress.enter.exact.prevent="sendMessage" 
        :disabled="isLoading" 
        placeholder="输入问题..." 
        rows="1"
        ref="inputField"
        @input="autoResize"
      ></textarea>
      <button @click="sendMessage" :disabled="isLoading || !userInput.trim()">
        发送
      </button>
    </div>
    
    <!-- 错误提示 -->
    <div v-if="error" class="error-message">
      <div class="error-content">
        <div class="error-title">{{ errorTitle }}</div>
        <div class="error-detail">{{ error }}</div>
      </div>
      <div class="error-actions">
        <button v-if="showRetry" class="retry-button" @click="retryLastMessage">重试</button>
        <button class="close-error" @click="clearError">×</button>
      </div>
    </div>
    
    <!-- 图片放大显示 -->
    <div v-if="enlargedImage" class="image-modal" @click="enlargedImage = null">
      <div class="modal-content">
        <img :src="`data:image/png;base64,${enlargedImage.data}`" :alt="enlargedImage.name" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, nextTick, onUnmounted } from 'vue';
import chatService from '@/api/chatService';

export default {
  name: 'ChatComponent',
  props: {
    // 场景ID
    sceneId: {
      type: String,
      default: null
    },
    // 用户ID
    userId: {
      type: String,
      default: '匿名用户'
    },
    // 初始欢迎消息
    initialMessage: {
      type: String,
      default: null
    }
  },
  setup(props, { emit }) {
    const userInput = ref('');
    const messages = ref([]);
    const isLoading = ref(false);
    const error = ref('');
    const errorTitle = ref('出错了');
    const showRetry = ref(false);
    const lastMessage = ref('');
    const messagesContainer = ref(null);
    const welcomeMessage = ref('你好！有什么我可以帮助你的吗？');
    const inputField = ref(null);
    const enlargedImage = ref(null);
    const isApiConnected = ref(true);
    
    // 发送消息
    const sendMessage = async () => {
      const input = userInput.value.trim();
      if (!input || isLoading.value) return;
      
      // 保存最后发送的消息，用于重试
      lastMessage.value = input;
      
      // 添加用户消息到聊天记录
      messages.value.push({
        content: input,
        sender: 'user'
      });
      
      // 清空输入框并设置加载状态
      userInput.value = '';
      if (inputField.value) {
        inputField.value.style.height = 'auto';
      }
      isLoading.value = true;
      error.value = '';
      
      try {
        // 调用API发送消息
        const response = await chatService.sendChatMessage(
          input,
          props.userId, 
          props.sceneId
        );
        
        const result = response.data;
        
        if (result.status === 'error') {
          // 处理错误响应
          if (result.sensitive_words) {
            error.value = `包含敏感词: ${result.sensitive_words.join(', ')}`;
          } else {
            error.value = result.message || '请求处理失败';
          }
        } else {
          // 处理成功响应
          messages.value.push({
            content: result.response || result.answer || '没有回答',
            sender: 'assistant',
            attachments: result.attachment_data || [],
            sources: result.sources || []
          });
          
          // 如有返回的对话ID，通知父组件
          if (result.chat_id) {
            emit('chat-created', result.chat_id);
          }
        }
      } catch (err) {
        console.error('聊天请求失败:', err);
        handleApiError(err);
      } finally {
        isLoading.value = false;
        // 滚动到底部
        scrollToBottom();
      }
    };
    
    // 新增: API错误处理函数
    const handleApiError = (err) => {
      showRetry.value = true;
      
      if (err.response) {
        // 服务器返回了错误响应
        const status = err.response.status;
        errorTitle.value = `服务器错误 (${status})`;
        
        if (status === 401 || status === 403) {
          error.value = '认证失败，请重新登录';
        } else if (status === 429) {
          error.value = '请求过于频繁，请稍后再试';
        } else if (status >= 500) {
          error.value = '服务器内部错误，请稍后再试';
        } else {
          error.value = (err.response.data && err.response.data.message) || '未知错误';
        }
      } else if (err.request) {
        // 请求已发出但没有收到响应
        if (err.code === 'ECONNABORTED') {
          errorTitle.value = '请求超时';
          error.value = '服务器响应时间过长，请检查网络连接后重试';        } else if (err.message.includes('Network Error')) {
          errorTitle.value = '网络错误';
          error.value = '网络连接异常';
        } else {
          errorTitle.value = '连接问题';
          error.value = '连接异常，请稍后重试';
        }
      } else {
        // 请求设置触发的错误
        errorTitle.value = '请求错误';
        error.value = err.message || '发送请求时出现未知错误';
      }
    };
    
    // 新增: 重试上一条消息
    const retryLastMessage = () => {
      if (lastMessage.value) {
        userInput.value = lastMessage.value;
        clearError();
        nextTick(() => {
          sendMessage();
        });
      }
    };
    
    // 检查API连接状态
    const checkApiConnection = async () => {
      isApiConnected.value = await chatService.checkApiConnection();
      return isApiConnected.value;
    };
    
    // 检查是否是图片附件
    const isImageAttachment = (filename) => {
      if (!filename) return false;
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
      return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
    };
    
    // 放大显示图片
    const enlargeImage = (attachment) => {
      enlargedImage.value = attachment;
    };
    
    // 下载附件
    const downloadAttachment = (attachment) => {
      const link = document.createElement('a');
      link.href = `data:application/octet-stream;base64,${attachment.data}`;
      link.download = attachment.name;
      link.click();
    };
    
    // 清除错误消息
    const clearError = () => {
      error.value = '';
      errorTitle.value = '出错了';
      showRetry.value = false;
    };
    
    // 自动调整输入框高度
    const autoResize = () => {
      if (inputField.value) {
        inputField.value.style.height = 'auto';
        inputField.value.style.height = `${Math.min(inputField.value.scrollHeight, 150)}px`;
      }
    };
    
    // 滚动到底部
    const scrollToBottom = () => {
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
        }
      });
    };
    
    // 监听消息变化，自动滚动
    watch(messages, () => {
      scrollToBottom();
    }, { deep: true });
    
    // 初始化 - 获取动态欢迎消息
    onMounted(async () => {
      // 如果提供了初始欢迎消息，使用它
      if (props.initialMessage) {
        welcomeMessage.value = props.initialMessage;
        return;
      }
      
      await checkApiConnection();
      
      // 如果连接失败，使用备用欢迎消息
      if (!isApiConnected.value) {
        welcomeMessage.value = "网络连接失败，但您仍可以输入问题，我们会在网络恢复后处理。";
      } else {
        // 常规加载欢迎消息
        try {
          isLoading.value = true;
          const response = await chatService.getGreeting();
          if (response.data && response.data.greeting) {
            welcomeMessage.value = response.data.greeting;
          }
        } catch (err) {
          console.error('获取欢迎消息失败:', err);
          // 使用默认欢迎消息
        } finally {
          isLoading.value = false;
        }
      }
    });
    
    // 定期检查API连接状态
    let connectionCheckInterval;
    onMounted(() => {
      connectionCheckInterval = setInterval(async () => {
        await checkApiConnection();
      }, 30000); // 每30秒检查一次
    });
    
    onUnmounted(() => {
      clearInterval(connectionCheckInterval);
    });
    
    return {
      userInput,
      messages,
      isLoading,
      error,
      errorTitle,
      showRetry,
      messagesContainer,
      welcomeMessage,
      inputField,
      enlargedImage,
      sendMessage,
      isImageAttachment,
      downloadAttachment,
      enlargeImage,
      clearError,
      retryLastMessage,
      autoResize,
      isApiConnected,
      checkApiConnection
    };
  }
};
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 800px;
  margin: 0 auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  position: relative;
}

/* 添加欢迎消息横幅样式 */
.greeting-banner {
  padding: 15px;
  background-color: #f0f8ff;
  border-bottom: 1px solid #e0e0e0;
  border-radius: 8px 8px 0 0;
}

.greeting-content {
  color: #4a4a4a;
  font-size: 1.1em;
  text-align: center;
  line-height: 1.5;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

/* 移除之前的欢迎消息样式 */
.welcome-message {
  display: none;
}

.message {
  margin-bottom: 15px;
  padding: 10px;
  border-radius: 8px;
  max-width: 80%;
  word-break: break-word;
}

.message.user {
  align-self: flex-end;
  background-color: #e3f2fd;
  margin-left: auto;
}

.message.assistant {
  align-self: flex-start;
  background-color: #f5f5f5;
}

.input-area {
  display: flex;
  padding: 15px;
  border-top: 1px solid #e0e0e0;
}

.input-area textarea {
  flex: 1;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: none;
  max-height: 150px;
}

.input-area button {
  margin-left: 10px;
  padding: 10px 20px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  align-self: flex-end;
  height: 40px;
}

.input-area button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.attachments {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.attachment img {
  max-width: 150px;
  max-height: 150px;
  border-radius: 4px;
  margin-top: 5px;
  cursor: pointer;
  transition: transform 0.2s;
}

.attachment img:hover {
  transform: scale(1.05);
}

.attachment a {
  color: #2196f3;
  cursor: pointer;
  text-decoration: underline;
  display: flex;
  align-items: center;
  gap: 5px;
}

.attachment-icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%232196f3'%3E%3Cpath d='M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-2 16c-2.05 0-3.81-1.24-4.58-3h1.71c.63.9 1.68 1.5 2.87 1.5 1.93 0 3.5-1.57 3.5-3.5S13.93 9.5 12 9.5c-1.35 0-2.52.78-3.1 1.9l1.6 1.6h-4V9l1.3 1.3C8.69 8.92 10.23 8 12 8c2.76 0 5 2.24 5 5s-2.24 5-5 5z'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
}

.sources {
  margin-top: 10px;
  font-size: 0.9em;
  color: #666;
}

.sources-title {
  font-weight: bold;
  margin-bottom: 5px;
}

.sources ul {
  margin: 0;
  padding-left: 20px;
}

.sources a {
  color: #2196f3;
  text-decoration: none;
}

.sources a:hover {
  text-decoration: underline;
}

.error-message {
  position: absolute;
  bottom: 70px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #ffebee;
  color: #c62828;
  padding: 12px 16px;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  z-index: 100;
  max-width: 80%;
  min-width: 300px;
}

.error-content {
  flex: 1;
}

.error-title {
  font-weight: bold;
  margin-bottom: 4px;
}

.error-detail {
  font-size: 0.9em;
}

.error-actions {
  display: flex;
  align-items: center;
  margin-left: 16px;
}

.retry-button {
  background-color: #c62828;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.8em;
  cursor: pointer;
  margin-right: 8px;
}

.close-error {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #c62828;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.typing-indicator {
  align-self: flex-start;
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.typing-indicator .dot {
  animation: typing 1.5s infinite;
  display: inline-block;
  opacity: 0;
}

.typing-indicator .dot:nth-child(1) { animation-delay: 0s; }
.typing-indicator .dot:nth-child(2) { animation-delay: 0.5s; }
.typing-indicator .dot:nth-child(3) { animation-delay: 1s; }

@keyframes typing {
  0% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
}

/* 图片放大模态框 */
.image-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  cursor: pointer;
}

.modal-content {
  max-width: 90%;
  max-height: 90%;
}

.modal-content img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.network-status-warning {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ffeb3b;
  color: #000;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
}

.network-status-warning .el-icon-warning {
  margin-right: 5px;
}
</style>
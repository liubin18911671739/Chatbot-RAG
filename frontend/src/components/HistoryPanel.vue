<template>
  <div class="history-panel" :class="{ 'collapsed': isCollapsed }">
    <div class="history-header">
      <h3>历史对话</h3>
      <div class="header-buttons">
        <button class="refresh-btn" @click="fetchChatHistory" title="刷新">
          <i class="fas fa-sync-alt"></i>
        </button>
        <button class="toggle-btn" @click="togglePanel" :title="isCollapsed ? '展开' : '收起'">
          <i :class="isCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left'"></i>
        </button>
      </div>
    </div>
    
    <!-- 只在非收起状态下显示内容 -->
    <template v-if="!isCollapsed">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button @click="fetchChatHistory">重试</button>
      </div>
      
      <div v-else-if="serverChats.length === 0 && recentChats.length === 0" class="empty-state">
        <p>暂无历史对话</p>
        <button @click="createNewChat">开始新对话</button>
      </div>
      
      <template v-else>
        <!-- 最近对话区域 -->
        <div v-if="recentChats.length > 0" class="recent-chats-section">
          <h4 class="section-title">最近对话</h4>
          <ul class="recent-chats-list">
            <li 
              v-for="chat in recentChats" 
              :key="chat.id" 
              :class="{ active: selectedChatId === chat.id }"
              @click="loadRecentChat(chat.id)"
            >
              <div class="chat-info">
                <p class="chat-title">{{ chat.title || '未命名对话' }}</p>
                <p class="chat-date">{{ formatDate(chat.createdAt) }}</p>
              </div>
              <button 
                class="delete-btn" 
                @click.stop="confirmDeleteRecentChat(chat.id)" 
                title="删除"
              >
                <i class="fas fa-trash"></i>
              </button>
            </li>
          </ul>
        </div>
        
        <!-- 服务器历史对话区域(实际上也是本地存储的) -->
        <div v-if="serverChats.length > 0" class="server-chats-section">
          <h4 class="section-title">历史对话</h4>
          <ul class="history-list">
            <li 
              v-for="chat in serverChats" 
              :key="chat.id" 
              :class="{ active: selectedChatId === chat.id }"
              @click="selectChat(chat.id)"
            >
              <div class="chat-info">
                <p class="chat-title">{{ chat.title || '未命名对话' }}</p>
                <p class="chat-date">{{ formatDate(chat.createdAt) }}</p>
              </div>
              <button 
                class="delete-btn" 
                @click.stop="confirmDeleteChat(chat.id)" 
                title="删除"
              >
                <i class="fas fa-trash"></i>
              </button>
            </li>
          </ul>
        </div>
      </template>
      
      <div class="history-footer">
        <button class="new-chat-btn" @click="createNewChat">
          <i class="fas fa-plus"></i> 新对话
        </button>
      </div>
    </template>
    
    <!-- 删除确认对话框 -->
    <div v-if="showDeleteConfirm" class="delete-confirm-modal">
      <div class="modal-content">
        <p>确定要删除此对话吗？</p>
        <div class="modal-actions">
          <button @click="deleteChat" class="confirm-btn">确定</button>
          <button @click="cancelDelete" class="cancel-btn">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useChatStore } from '@/stores/chatStore';
import { storeToRefs } from 'pinia';

export default {
  name: 'HistoryPanel',
  props: {
    selectedChatId: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      loading: false,
      error: null,
      showDeleteConfirm: false,
      chatToDeleteId: null,
      isCollapsed: false,
      isLocal: false, // 是否为本地存储的对话
    };
  },
  computed: {
    // 从chatStore获取最近对话缓存
    recentChats() {
      const chatStore = useChatStore();
      return chatStore.recentChats;
    },
    // 从chatStore获取服务器历史对话
    serverChats() {
      const chatStore = useChatStore();
      return chatStore.serverChats || [];
    }
  },
  created() {
    // 确保页面加载时获取历史记录
    this.fetchChatHistory();
    
    // 尝试从本地存储中恢复面板状态
    const savedState = localStorage.getItem('historyPanelCollapsed');
    if (savedState !== null) {
      this.isCollapsed = JSON.parse(savedState);
      // 通知父组件初始状态
      this.$nextTick(() => {
        this.$emit('panel-toggle', this.isCollapsed);
      });
    }
  },
  methods: {
    togglePanel() {
      this.isCollapsed = !this.isCollapsed;
      // 保存状态到本地存储
      localStorage.setItem('historyPanelCollapsed', JSON.stringify(this.isCollapsed));
      // 通知父组件面板状态已更改
      this.$emit('panel-toggle', this.isCollapsed);
    },
    
    async fetchChatHistory() {
      // 在收起状态下不进行数据加载
      if (this.isCollapsed) return;
      
      this.loading = true;
      this.error = null;

      try {
        // 使用chatStore获取历史对话
        const chatStore = useChatStore();
        await chatStore.fetchServerChats();
      } catch (err) {
        console.error('Failed to fetch chat history:', err);
        this.error = '获取历史记录失败，请重试';
      } finally {
        this.loading = false;
      }
    },

    selectChat(chatId) {
      this.$emit('select-chat', chatId);
    },

    // 加载本地缓存的对话
    loadRecentChat(chatId) {
      const chatStore = useChatStore();
      if (chatStore.loadRecentChat(chatId)) {
        this.$emit('select-chat', chatId);
      } else {
        this.error = '加载对话失败';
      }
    },

    createNewChat() {
      this.$emit('create-new-chat');
    },

    confirmDeleteChat(chatId) {
      this.chatToDeleteId = chatId;
      this.isLocal = false;
      this.showDeleteConfirm = true;
    },
    
    confirmDeleteRecentChat(chatId) {
      this.chatToDeleteId = chatId;
      this.isLocal = true;
      this.showDeleteConfirm = true;
    },

    cancelDelete() {
      this.showDeleteConfirm = false;
      this.chatToDeleteId = null;
      this.isLocal = false;
    },

    async deleteChat() {
      try {
        const chatStore = useChatStore();
        
        if (this.isLocal) {
          // 删除本地缓存的对话
          chatStore.removeRecentChat(this.chatToDeleteId);
        } else {
          // 删除服务器上的对话（实际上也是本地存储） 
          await chatStore.deleteServerChat(this.chatToDeleteId);
          
          // 从最近对话缓存中也移除
          chatStore.removeRecentChat(this.chatToDeleteId);
        }
        
        // 如果删除的是当前选中的对话，则通知父组件
        if (this.selectedChatId === this.chatToDeleteId) {
          this.$emit('chat-deleted');
        }
        
        this.showDeleteConfirm = false;
        this.chatToDeleteId = null;
        this.isLocal = false;
      } catch (err) {
        console.error('Failed to delete chat:', err);
        this.error = '删除失败，请重试';
      }
    },

    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
};
</script>

<style scoped>
.history-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--campus-neutral-100);
  border-right: 1px solid var(--campus-neutral-300);
  width: 280px;
  box-shadow: var(--campus-shadow-md);
  position: relative;
  z-index: 10;
  overflow: hidden;
  transition: width 0.3s ease;
}

/* 添加收起状态的样式 */
.history-panel.collapsed {
  width: 50px;
  min-width: 50px;
  transition: width 0.3s ease;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--campus-neutral-300);
  background-color: var(--campus-primary);
  color: white;
}

/* 当面板收起时，调整头部样式 */
.history-panel.collapsed .history-header {
  padding: 16px 0;
  justify-content: center;
}

.history-panel.collapsed h3 {
  display: none;
}

.history-panel.collapsed .header-buttons {
  margin: 0;
}

/* 调整按钮在收起状态的位置 */
.history-panel.collapsed .toggle-btn {
  margin: 0;
}

.header-buttons {
  display: flex;
  align-items: center;
}

.toggle-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: white;
  font-size: 16px;
  padding: 8px;
  border-radius: 50%;
  transition: var(--campus-transition);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
}

.toggle-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.section-title {
  padding: 12px 16px 8px;
  margin: 0;
  font-size: 14px;
  color: var(--campus-neutral-600);
  font-weight: 500;
  border-bottom: 1px solid var(--campus-neutral-300);
  background-color: var(--campus-neutral-200);
}

.recent-chats-section, .server-chats-section {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.recent-chats-list {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
}

.recent-chats-list::-webkit-scrollbar,
.history-list::-webkit-scrollbar {
  width: 4px;
}

.recent-chats-list::-webkit-scrollbar-track,
.history-list::-webkit-scrollbar-track {
  background: var(--campus-neutral-200);
}

.recent-chats-list::-webkit-scrollbar-thumb,
.history-list::-webkit-scrollbar-thumb {
  background: var(--campus-neutral-400);
  border-radius: 4px;
}

.recent-chats-list li,
.history-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--campus-neutral-300);
  cursor: pointer;
  transition: var(--campus-transition);
  position: relative;
  overflow: hidden;
}

.recent-chats-list li::before,
.history-list li::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 0;
  background-color: var(--campus-primary-light);
  opacity: 0.1;
  transition: width 0.3s ease;
}

.recent-chats-list li:hover::before,
.history-list li:hover::before {
  width: 100%;
}

.recent-chats-list li.active,
.history-list li.active {
  background-color: rgba(var(--campus-primary), 0.1);
  border-left: 3px solid var(--campus-primary);
}

.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 30px;
  text-align: center;
  color: var(--campus-neutral-600);
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border-left-color: var(--campus-primary);
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state button, .empty-state button {
  margin-top: 15px;
  padding: 8px 16px;
  background-color: var(--campus-primary);
  color: white;
  border: none;
  border-radius: var(--campus-radius);
  cursor: pointer;
  transition: var(--campus-transition);
}

.error-state button:hover, .empty-state button:hover {
  background-color: var(--campus-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--campus-shadow);
}

.history-list {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  flex-grow: 1;
}

.chat-info {
  flex-grow: 1;
  overflow: hidden;
}

.chat-title {
  margin: 0 0 6px 0;
  font-size: 15px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--campus-neutral-800);
}

.chat-date {
  margin: 0;
  font-size: 12px;
  color: var(--campus-neutral-600);
  display: flex;
  align-items: center;
}

.chat-date::before {
  content: "";
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-right: 5px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%236b7280' viewBox='0 0 24 24'%3E%3Cpath d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
}

.delete-btn {
  background: none;
  border: none;
  color: var(--campus-neutral-500);
  cursor: pointer;
  padding: 6px;
  font-size: 14px;
  visibility: hidden;
  opacity: 0;
  transition: var(--campus-transition);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.history-list li:hover .delete-btn,
.recent-chats-list li:hover .delete-btn {
  visibility: visible;
  opacity: 1;
}

.delete-btn:hover {
  background-color: rgba(244, 67, 54, 0.1);
  color: var(--campus-error);
}

.history-footer {
  padding: 16px;
  border-top: 1px solid var(--campus-neutral-300);
  background-color: var(--campus-neutral-200);
  margin-top: auto;
}

.new-chat-btn {
  width: 100%;
  padding: 10px;
  background-color: var(--campus-primary);
  color: white;
  border: none;
  border-radius: var(--campus-radius);
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--campus-transition);
  box-shadow: var(--campus-shadow-sm);
}

.new-chat-btn i {
  margin-right: 8px;
}

.new-chat-btn:hover {
  background-color: var(--campus-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--campus-shadow);
}

.delete-confirm-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fade-in 0.2s ease-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background-color: white;
  padding: 24px;
  border-radius: var(--campus-radius-lg);
  max-width: 400px;
  width: 100%;
  text-align: center;
  box-shadow: var(--campus-shadow-lg);
  animation: scale-in 0.2s ease-out;
}

@keyframes scale-in {
  from {
    transform: scale(0.9);
  }
  to {
    transform: scale(1);
  }
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
}

.confirm-btn, .cancel-btn {
  padding: 10px 20px;
  border: none;
  border-radius: var(--campus-radius);
  font-size: 15px;
  cursor: pointer;
  transition: var(--campus-transition);
}

.confirm-btn {
  background-color: var(--campus-error);
  color: white;
}

.confirm-btn:hover {
  background-color: #d32f2f;
  transform: translateY(-2px);
  box-shadow: var(--campus-shadow);
}

.cancel-btn {
  background-color: var(--campus-neutral-300);
  color: var(--campus-neutral-800);
}

.cancel-btn:hover {
  background-color: var(--campus-neutral-400);
  transform: translateY(-2px);
  box-shadow: var(--campus-shadow);
}

/* 校园元素装饰 */
.empty-state::before {
  content: "";
  display: block;
  width: 100px;
  height: 100px;
  margin-bottom: 20px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%233e8055' opacity='0.2' x='25' y='15' width='50' height='70' rx='5' /%3E%3Cpath fill='%233e8055' opacity='0.2' d='M30,25 L70,25 L70,65 L30,65 Z' /%3E%3Cpath fill='%233e8055' opacity='0.3' d='M40,35 L60,35 L60,40 L40,40 Z' /%3E%3Cpath fill='%233e8055' opacity='0.3' d='M40,45 L60,45 L60,50 L40,50 Z' /%3E%3Cpath fill='%233e8055' opacity='0.3' d='M40,55 L50,55 L50,60 L40,60 Z' /%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.loading-state .spinner::after {
  content: "";
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px dashed var(--campus-primary-light);
  animation: spin-reverse 8s linear infinite;
}

@keyframes spin-reverse {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(-360deg); }
}
</style>
<template>
  <div class="history-panel">
    <div class="history-header">
      <h3>历史对话</h3>
      <button class="refresh-btn" @click="fetchChatHistory" title="刷新">
        <i class="fas fa-sync-alt"></i>
      </button>
    </div>
    
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>
    
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="fetchChatHistory">重试</button>
    </div>
    
    <div v-else-if="chatHistory.length === 0" class="empty-state">
      <p>暂无历史对话</p>
      <button @click="createNewChat">开始新对话</button>
    </div>
    
    <ul v-else class="history-list">
      <li 
        v-for="chat in chatHistory" 
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
    
    <div class="history-footer">
      <button class="new-chat-btn" @click="createNewChat">
        <i class="fas fa-plus"></i> 新对话
      </button>
    </div>
    
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
import axios from 'axios';

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
      chatHistory: [],
      loading: false,
      error: null,
      showDeleteConfirm: false,
      chatToDeleteId: null
    };
  },
  created() {
    this.fetchChatHistory();
  },
  methods: {
    async fetchChatHistory() {
      this.loading = true;
      this.error = null;

      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/chats', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        this.chatHistory = response.data;
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

    createNewChat() {
      this.$emit('create-new-chat');
    },

    confirmDeleteChat(chatId) {
      this.chatToDeleteId = chatId;
      this.showDeleteConfirm = true;
    },

    cancelDelete() {
      this.showDeleteConfirm = false;
      this.chatToDeleteId = null;
    },

    async deleteChat() {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/chats/${this.chatToDeleteId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // 删除后从列表中移除
        this.chatHistory = this.chatHistory.filter(
          chat => chat.id !== this.chatToDeleteId
        );
        
        // 如果删除的是当前选中的对话，则通知父组件
        if (this.selectedChatId === this.chatToDeleteId) {
          this.$emit('chat-deleted');
        }
        
        this.showDeleteConfirm = false;
        this.chatToDeleteId = null;
      } catch (err) {
        console.error('Failed to delete chat:', err);
        alert('删除失败，请重试');
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
  background-color: #f5f5f5;
  border-right: 1px solid #e0e0e0;
  width: 280px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.history-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.refresh-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  font-size: 16px;
  padding: 5px;
  border-radius: 50%;
}

.refresh-btn:hover {
  background-color: #e0e0e0;
  color: #333;
}

.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 20px;
  text-align: center;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border-left-color: #4CAF50;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.history-list {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  flex-grow: 1;
}

.history-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.history-list li:hover {
  background-color: #e8e8e8;
}

.history-list li.active {
  background-color: #e0f2e0;
  border-left: 3px solid #4CAF50;
}

.chat-info {
  flex-grow: 1;
  overflow: hidden;
}

.chat-title {
  margin: 0 0 4px 0;
  font-size: 15px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-date {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.delete-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 5px;
  font-size: 14px;
  visibility: hidden;
  opacity: 0;
  transition: opacity 0.2s;
}

.history-list li:hover .delete-btn {
  visibility: visible;
  opacity: 1;
}

.delete-btn:hover {
  color: #f44336;
}

.history-footer {
  padding: 16px;
  border-top: 1px solid #e0e0e0;
}

.new-chat-btn {
  width: 100%;
  padding: 10px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.new-chat-btn i {
  margin-right: 8px;
}

.new-chat-btn:hover {
  background-color: #45a049;
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
}

.modal-content {
  background-color: white;
  padding: 24px;
  border-radius: 8px;
  max-width: 400px;
  width: 100%;
  text-align: center;
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
  border-radius: 4px;
  font-size: 15px;
  cursor: pointer;
}

.confirm-btn {
  background-color: #f44336;
  color: white;
}

.confirm-btn:hover {
  background-color: #d32f2f;
}

.cancel-btn {
  background-color: #e0e0e0;
  color: #333;
}

.cancel-btn:hover {
  background-color: #ccc;
}
</style>
<template>
  <div class="admin-view">
    <header class="admin-header">
      <h1>知识库管理系统</h1>
      <div class="header-actions">
        <span class="welcome-text">欢迎，{{ username }} 管理员</span>
        <button class="logout-btn" @click="logout">退出登录</button>
      </div>
    </header>

    <div class="admin-container">
      <aside class="admin-sidebar">
        <nav class="nav-menu">
          <div class="nav-item active" @click="activeTab = 'documents'">
            <i class="icon-document"></i>
            <span>文档管理</span>
          </div>
          <div class="nav-item" @click="activeTab = 'users'">
            <i class="icon-users"></i>
            <span>用户管理</span>
          </div>
          <div class="nav-item" @click="activeTab = 'settings'">
            <i class="icon-settings"></i>
            <span>系统设置</span>
          </div>
        </nav>
      </aside>

      <main class="admin-content">
        <!-- 文档管理面板 -->
        <div v-if="activeTab === 'documents'" class="panel documents-panel">
          <div class="panel-header">
            <h2>文档管理</h2>
            <div class="panel-actions">
              <button class="upload-btn" @click="openUploadModal">上传文档</button>
            </div>
          </div>

          <!-- 文档列表 -->
          <div class="document-list">
            <table v-if="documents.length > 0">
              <thead>
                <tr>
                  <th>文件名</th>
                  <th>类型</th>
                  <th>大小</th>
                  <th>上传时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="doc in documents" :key="doc.id">
                  <td>{{ doc.filename }}</td>
                  <td>{{ doc.type }}</td>
                  <td>{{ formatFileSize(doc.size) }}</td>
                  <td>{{ formatDate(doc.uploadDate) }}</td>
                  <td class="actions">
                    <button class="action-btn delete" @click="confirmDelete(doc.id)">删除</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty-state">
              <p>暂无文档，请上传文档到知识库</p>
            </div>
          </div>
        </div>

        <!-- 用户管理面板 -->
        <div v-if="activeTab === 'users'" class="panel users-panel">
          <div class="panel-header">
            <h2>用户管理</h2>
          </div>
          <div class="user-list">
            <table v-if="users.length > 0">
              <thead>
                <tr>
                  <th>用户名</th>
                  <th>角色</th>
                  <th>上次登录</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.id">
                  <td>{{ user.username }}</td>
                  <td>{{ user.role === 'admin' ? '管理员' : '普通用户' }}</td>
                  <td>{{ formatDate(user.lastLogin) }}</td>
                  <td class="actions">
                    <button class="action-btn" :class="user.status === 'active' ? 'block' : 'unblock'"
                      @click="toggleUserStatus(user.id)">
                      {{ user.status === 'active' ? '禁用' : '启用' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty-state">
              <p>暂无用户数据</p>
            </div>
          </div>
        </div>

        <!-- 系统设置面板 -->
        <div v-if="activeTab === 'settings'" class="panel settings-panel">
          <div class="panel-header">
            <h2>系统设置</h2>
          </div>
          <div class="settings-form">
            <div class="form-group">
              <label for="systemName">系统名称</label>
              <input type="text" id="systemName" v-model="settings.systemName" />
            </div>
            <div class="form-group">
              <label for="welcomeMessage">欢迎消息</label>
              <textarea id="welcomeMessage" v-model="settings.welcomeMessage" rows="3"></textarea>
            </div>
            <div class="form-group">
              <button class="save-btn" @click="saveSettings">保存设置</button>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- 上传文档弹窗 -->
    <div v-if="showUploadModal" class="modal-overlay">
      <div class="upload-modal">
        <div class="modal-header">
          <h3>上传文档到知识库</h3>
          <button class="close-btn" @click="showUploadModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="upload-dropzone" 
              @dragover.prevent="onDragOver" 
              @dragleave.prevent="onDragLeave" 
              @drop.prevent="onDrop"
              :class="{ 'active-dropzone': isDragging }">
            <input 
              type="file" 
              ref="fileInput" 
              @change="handleFileSelected" 
              accept=".pdf,.doc,.docx,.txt,.xls,.xlsx" 
              style="display:none" 
              multiple
            />
            <div v-if="!selectedFiles.length" class="dropzone-content">
              <i class="icon-upload"></i>
              <p>拖放文件到此处，或 <span class="browse-link" @click="triggerFileInput">浏览文件</span></p>
              <p class="file-hint">支持的文件格式: PDF, Word, Excel, TXT</p>
            </div>
            <div v-else class="selected-files">
              <div v-for="(file, index) in selectedFiles" :key="index" class="selected-file">
                <span class="file-name">{{ file.name }}</span>
                <span class="file-size">({{ formatFileSize(file.size) }})</span>
                <button class="remove-file" @click="removeFile(index)">&times;</button>
              </div>
            </div>
          </div>
          <div class="upload-progress" v-if="uploading">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
            </div>
            <div class="progress-text">上传中 {{ uploadProgress }}%</div>
          </div>
          <div class="upload-error" v-if="uploadError">
            {{ uploadError }}
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="showUploadModal = false" :disabled="uploading">取消</button>
          <button class="upload-btn" @click="uploadFiles" :disabled="!selectedFiles.length || uploading">
            {{ uploading ? '上传中...' : '上传' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div v-if="showDeleteConfirm" class="modal-overlay">
      <div class="confirm-modal">
        <div class="modal-header">
          <h3>确认删除</h3>
          <button class="close-btn" @click="showDeleteConfirm = false">&times;</button>
        </div>
        <div class="modal-body">
          <p>确定要删除该文档吗？此操作不可恢复。</p>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="showDeleteConfirm = false">取消</button>
          <button class="delete-btn" @click="deleteDocument">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

export default {
  name: 'AdminView',
  setup() {
    const router = useRouter();
    
    // 用户信息
    const username = ref('');
    
    // 活动标签页
    const activeTab = ref('documents');
    
    // 文档列表
    const documents = ref([]);
    
    // 用户列表
    const users = ref([]);
    
    // 系统设置
    const settings = ref({
      systemName: '海棠校园问答系统',
      welcomeMessage: '你好！我是您的AI助手，请问有什么我可以帮您的？'
    });
    
    // 上传文档相关
    const showUploadModal = ref(false);
    const fileInput = ref(null);
    const selectedFiles = ref([]);
    const isDragging = ref(false);
    const uploading = ref(false);
    const uploadProgress = ref(0);
    const uploadError = ref('');
    
    // 删除文档相关
    const showDeleteConfirm = ref(false);
    const docToDeleteId = ref(null);

    // 计算属性
    const isAdmin = computed(() => {
      return localStorage.getItem('userRole') === 'admin';
    });

    // 加载初始数据
    onMounted(async () => {
      checkAdminAccess();
      loadUsername();
      await Promise.all([
        fetchDocuments(),
        fetchUsers(),
        fetchSettings()
      ]);
    });

    // 检查管理员权限
    const checkAdminAccess = () => {
      if (!isAdmin.value) {
        router.push('/login');
      }
    };

    // 加载用户名
    const loadUsername = () => {
      username.value = localStorage.getItem('userId') || 'admin';
    };

    // 获取文档列表
    const fetchDocuments = async () => {
      try {
        // 模拟文档数据
        documents.value = [
          {
            id: 1, 
            filename: '学校介绍.pdf', 
            type: 'pdf', 
            size: 2548760, 
            uploadDate: new Date(2024, 3, 15)
          },
          {
            id: 2, 
            filename: '教师手册.docx', 
            type: 'docx', 
            size: 1345600, 
            uploadDate: new Date(2024, 3, 10)
          },
          {
            id: 3, 
            filename: '学生信息.xlsx', 
            type: 'xlsx', 
            size: 872341, 
            uploadDate: new Date(2024, 3, 5)
          }
        ];
        
        // 实际API调用（取消注释使用）
        /*
        const response = await axios.get('/api/documents', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        documents.value = response.data;
        */
      } catch (error) {
        console.error('获取文档列表失败:', error);
      }
    };

    // 获取用户列表
    const fetchUsers = async () => {
      try {
        // 模拟用户数据
        users.value = [
          {
            id: 1, 
            username: 'admin', 
            role: 'admin', 
            status: 'active', 
            lastLogin: new Date(2024, 3, 17)
          },
          {
            id: 2, 
            username: 'user', 
            role: 'user', 
            status: 'active', 
            lastLogin: new Date(2024, 3, 16)
          }
        ];
        
        // 实际API调用（取消注释使用）
        /*
        const response = await axios.get('/api/users', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        users.value = response.data;
        */
      } catch (error) {
        console.error('获取用户列表失败:', error);
      }
    };

    // 获取系统设置
    const fetchSettings = async () => {
      try {
        // 实际API调用（取消注释使用）
        /*
        const response = await axios.get('/api/settings', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        settings.value = response.data;
        */
      } catch (error) {
        console.error('获取系统设置失败:', error);
      }
    };

    // 保存系统设置
    const saveSettings = async () => {
      try {
        // 实际API调用（取消注释使用）
        /*
        await axios.post('/api/settings', settings.value, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        */
        alert('设置保存成功');
      } catch (error) {
        console.error('保存设置失败:', error);
        alert('保存设置失败');
      }
    };

    // 打开上传模态框
    const openUploadModal = () => {
      showUploadModal.value = true;
      selectedFiles.value = [];
      uploadError.value = '';
      uploadProgress.value = 0;
    };

    // 触发文件输入点击
    const triggerFileInput = () => {
      fileInput.value.click();
    };

    // 处理文件选择
    const handleFileSelected = (event) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          if (isValidFileType(files[i])) {
            selectedFiles.value.push(files[i]);
          } else {
            uploadError.value = '不支持的文件类型。请上传PDF、Word、Excel或TXT文件。';
          }
        }
      }
    };

    // 拖拽相关事件
    const onDragOver = () => {
      isDragging.value = true;
    };

    const onDragLeave = () => {
      isDragging.value = false;
    };

    const onDrop = (event) => {
      isDragging.value = false;
      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          if (isValidFileType(files[i])) {
            selectedFiles.value.push(files[i]);
          } else {
            uploadError.value = '不支持的文件类型。请上传PDF、Word、Excel或TXT文件。';
          }
        }
      }
    };

    // 检查文件类型是否有效
    const isValidFileType = (file) => {
      const validTypes = [
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      return validTypes.includes(file.type);
    };

    // 移除选中的文件
    const removeFile = (index) => {
      selectedFiles.value.splice(index, 1);
    };

    // 上传文件到服务器
    const uploadFiles = async () => {
      if (selectedFiles.value.length === 0) return;
      
      uploading.value = true;
      uploadProgress.value = 0;
      uploadError.value = '';
      
      try {
        // 创建FormData对象
        const formData = new FormData();
        selectedFiles.value.forEach(file => {
          formData.append('files', file);
        });
        
        // 使用axios上传
        const response = await axios.post('/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          onUploadProgress: (progressEvent) => {
            uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          }
        });
        
        if (response.status === 200) {
          // 上传成功
          alert('文件上传成功');
          showUploadModal.value = false;
          fetchDocuments(); // 刷新文档列表
        } else {
          uploadError.value = '上传失败: ' + response.data.message;
        }
      } catch (error) {
        console.error('上传文件失败:', error);
        uploadError.value = '上传过程中发生错误，请重试';
      } finally {
        uploading.value = false;
      }
    };

    // 确认删除文档
    const confirmDelete = (docId) => {
      docToDeleteId.value = docId;
      showDeleteConfirm.value = true;
    };

    // 删除文档
    const deleteDocument = async () => {
      try {
        // 实际API调用（取消注释使用）
        /*
        await axios.delete(`/api/documents/${docToDeleteId.value}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        */
        
        // 从本地列表中移除
        documents.value = documents.value.filter(doc => doc.id !== docToDeleteId.value);
        
        showDeleteConfirm.value = false;
        alert('文档删除成功');
      } catch (error) {
        console.error('删除文档失败:', error);
        alert('删除文档失败');
      }
    };

    // 切换用户状态
    const toggleUserStatus = async (userId) => {
      try {
        const user = users.value.find(u => u.id === userId);
        if (user) {
          // 切换状态
          const newStatus = user.status === 'active' ? 'blocked' : 'active';
          
          // 实际API调用（取消注释使用）
          /*
          await axios.patch(`/api/users/${userId}`, { status: newStatus }, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          */
          
          // 更新本地状态
          user.status = newStatus;
          alert(`用户状态已修改为: ${newStatus === 'active' ? '活跃' : '禁用'}`);
        }
      } catch (error) {
        console.error('修改用户状态失败:', error);
        alert('修改用户状态失败');
      }
    };

    // 格式化文件大小
    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // 格式化日期
    const formatDate = (date) => {
      if (!date) return '';
      if (typeof date === 'string') date = new Date(date);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // 退出登录
    const logout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
      router.push('/login');
    };

    return {
      username,
      activeTab,
      documents,
      users,
      settings,
      showUploadModal,
      fileInput,
      selectedFiles,
      isDragging,
      uploading,
      uploadProgress,
      uploadError,
      showDeleteConfirm,
      isAdmin,
      openUploadModal,
      triggerFileInput,
      handleFileSelected,
      onDragOver,
      onDragLeave,
      onDrop,
      removeFile,
      uploadFiles,
      confirmDelete,
      deleteDocument,
      toggleUserStatus,
      saveSettings,
      formatFileSize,
      formatDate,
      logout
    };
  }
}
</script>

<style scoped>
.admin-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 64px;
  background-color: #4CAF50;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.admin-header h1 {
  margin: 0;
  font-size: 1.6rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.welcome-text {
  font-size: 0.9rem;
}

.logout-btn {
  padding: 6px 12px;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.logout-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.admin-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.admin-sidebar {
  width: 200px;
  background-color: #fff;
  box-shadow: 1px 0 3px rgba(0, 0, 0, 0.1);
  padding: 20px 0;
}

.nav-menu {
  display: flex;
  flex-direction: column;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: #555;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: background-color 0.2s;
}

.nav-item:hover {
  background-color: #f0f0f0;
}

.nav-item.active {
  background-color: #e8f5e9;
  color: #4CAF50;
  border-left-color: #4CAF50;
}

.nav-item i {
  margin-right: 10px;
  font-size: 1.2rem;
}

.icon-document::before {
  content: "📄";
}

.icon-users::before {
  content: "👥";
}

.icon-settings::before {
  content: "⚙️";
}

.icon-upload::before {
  content: "📤";
  font-size: 2rem;
}

.admin-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.panel {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel-header h2 {
  margin: 0;
  font-size: 1.4rem;
  color: #333;
}

/* 文档列表样式 */
table {
  width: 100%;
  border-collapse: collapse;
}

thead th {
  background-color: #f5f5f5;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e0e0e0;
}

tbody td {
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
}

.actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background-color: transparent;
  border: none;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.9rem;
}

.action-btn.delete {
  color: #f44336;
}

.action-btn.delete:hover {
  background-color: #ffebee;
}

.action-btn.block {
  color: #f57c00;
}

.action-btn.block:hover {
  background-color: #fff3e0;
}

.action-btn.unblock {
  color: #4CAF50;
}

.action-btn.unblock:hover {
  background-color: #e8f5e9;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #9e9e9e;
}

/* 表单样式 */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.save-btn {
  padding: 10px 24px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.save-btn:hover {
  background-color: #3f9142;
}

/* 上传按钮样式 */
.upload-btn {
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.upload-btn:hover {
  background-color: #3f9142;
}

.upload-btn:disabled {
  background-color: #9e9e9e;
  cursor: not-allowed;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.upload-modal,
.confirm-modal {
  background-color: #fff;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #9e9e9e;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
}

.cancel-btn {
  padding: 8px 16px;
  background-color: #f5f5f5;
  color: #333;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.cancel-btn:hover {
  background-color: #e0e0e0;
}

.delete-btn {
  padding: 8px 16px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.delete-btn:hover {
  background-color: #d32f2f;
}

/* 上传区域样式 */
.upload-dropzone {
  border: 2px dashed #ccc;
  padding: 30px;
  text-align: center;
  border-radius: 4px;
  background-color: #f9f9f9;
  transition: all 0.3s;
}

.active-dropzone {
  border-color: #4CAF50;
  background-color: #e8f5e9;
}

.dropzone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.browse-link {
  color: #4CAF50;
  cursor: pointer;
  text-decoration: underline;
}

.file-hint {
  font-size: 0.8rem;
  color: #9e9e9e;
}

.selected-files {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selected-file {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.file-name {
  flex: 1;
  font-weight: 500;
}

.file-size {
  color: #9e9e9e;
  margin: 0 8px;
}

.remove-file {
  background: none;
  border: none;
  color: #f44336;
  cursor: pointer;
  font-size: 1.2rem;
}

.upload-progress {
  margin-top: 20px;
}

.progress-bar {
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background-color: #4CAF50;
  border-radius: 4px;
  transition: width 0.3s;
}

.progress-text {
  text-align: center;
  font-size: 0.9rem;
  color: #555;
}

.upload-error {
  margin-top: 16px;
  color: #f44336;
  background-color: #ffebee;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.9rem;
}
</style>
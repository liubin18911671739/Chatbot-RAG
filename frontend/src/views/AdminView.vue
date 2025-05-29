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
          <!-- <div class="nav-item" :class="{ active: activeTab === 'documents' }" @click="activeTab = 'documents'">
            <i class="icon-document"></i>
            <span>文档管理</span>
          </div> -->
          <div class="nav-item" :class="{ active: activeTab === 'students' }" @click="activeTab = 'students'">
            <i class="icon-student"></i>
            <span>学生常见问题</span>
          </div>
          <!-- <div class="nav-item" :class="{ active: activeTab === 'users' }" @click="activeTab = 'users'">
            <i class="icon-users"></i>
            <span>用户管理</span>
          </div> -->
          <!-- <div class="nav-item" :class="{ active: activeTab === 'settings' }" @click="activeTab = 'settings'">
            <i class="icon-settings"></i>
            <span>系统设置</span>
          </div> -->
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
                  <th>Agent场景</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="doc in documents" :key="doc.id">
                  <td>{{ doc.filename }}</td>
                  <td>{{ getFileTypeName(doc.fileType) }}</td>
                  <td>{{ formatFileSize(doc.size) }}</td>
                  <td>{{ formatDate(doc.uploadDate) }}</td>
                  <td>{{ getAgentTypeName(doc.agentType) }}</td>
                  <td class="actions">
                    <button class="action-btn view" @click="viewDocument(doc.id)">查看</button>
                    <button class="action-btn edit" @click="editDocument(doc.id)">编辑</button>
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

        <!-- 学生问题面板 -->
        <div v-if="activeTab === 'students'" class="panel students-panel">
          <div class="panel-header">
            <h2>学生问题管理</h2>
            <div class="panel-actions">
              <button class="download-btn" @click="downloadQuestions">
                <i class="icon-download"></i> 下载问题
              </button>
              <button class="upload-btn" @click="openFeedbackUploadModal">
                <i class="icon-upload"></i> 上传反馈
              </button>
            </div>
          </div>          <!-- 学生问题列表 -->
          <div class="student-questions-list">
            <table v-if="studentQuestions.length > 0">
              <thead>
                <tr>
                  <th>学生ID</th>
                  <th>问题内容</th>
                  <th>提问时间</th>
                  <th>审核状态</th>
                  <th>是否已回答</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="question in studentQuestions" :key="question.id" 
                    :class="{ 'unreviewed-row': !question.isReviewed }">
                  <td>{{ question.studentId }}</td>
                  <td class="question-content">
                    <i class="icon-question"></i>  {{ question.content }}
                  </td>
                  <td>{{ formatDate(question.createdAt) }}</td>
                  <td>
                    <span :class="['status-badge', question.isReviewed ? 'reviewed' : 'unreviewed']">
                      {{ question.isReviewed ? '已审核' : '未审核' }}
                    </span>
                  </td>
                  <td>
                    <span :class="['status-badge', question.answered ? 'answered' : 'unanswered']">
                      {{ question.answered ? '已回答' : '未回答' }}
                    </span>
                  </td>
                  <td class="actions">
                    <button class="action-btn view" @click="viewQuestion(question.id)">查看</button>
                    <button class="action-btn answer" @click="answerQuestion(question.id)">回答</button>
                    <button v-if="!question.isReviewed" class="action-btn approve" @click="approveQuestionAction(question.id)">审核</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty-state">
              <p><i class="icon-empty"></i> 暂无学生问题记录</p>
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
                  <td class="actions">                    <button class="action-btn" :class="user.status === 'active' ? 'block' : 'unblock'"
                      @click="toggleUserStatusAction(user.id)">
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
              <button class="save-btn" @click="saveSystemSettings">保存设置</button>
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
          
          <!-- 添加文件类型和Agent类型下拉列表 -->
          <div class="upload-options">
            <div class="form-group">
              <label for="fileType">文件类型</label>
              <select id="fileType" v-model="uploadOptions.fileType" class="form-select">
                <option value="">请选择文件类型</option>
                <option value="policy">政策文件</option>
                <option value="regulation">规章制度</option>
                <option value="manual">操作手册</option>
                <option value="faq">常见问题</option>
                <option value="report">报告文档</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div class="form-group">
              <label for="agentType">Agent 类型</label>
              <select id="agentType" v-model="uploadOptions.agentType" class="form-select">
                <option value="">请选择 Agent 类型</option>
                <option value="general">通用助手</option>
                <option value="ideological">思政助手</option>
                <option value="regional">区域研究助手</option>
                <option value="china-arab">中阿助手</option>
                <option value="digital-human">数字人文助手</option>
              </select>
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
          <button class="upload-btn" @click="uploadFiles" 
                  :disabled="!selectedFiles.length || !uploadOptions.fileType || !uploadOptions.agentType || uploading">
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
          <button class="delete-btn" @click="deleteDoc">删除</button>
        </div>
      </div>
    </div>

    <!-- 反馈上传弹窗 -->
    <div v-if="showFeedbackUploadModal" class="modal-overlay">
      <div class="upload-modal">
        <div class="modal-header">
          <h3>上传问题反馈</h3>
          <button class="close-btn" @click="showFeedbackUploadModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="feedback-upload-area" 
               @dragover.prevent="onFeedbackDragOver" 
               @dragleave.prevent="onFeedbackDragLeave" 
               @drop.prevent="onFeedbackDrop"
               :class="{ 'active-dropzone': isFeedbackDragging }">
            <input 
              type="file" 
              ref="feedbackFileInput" 
              @change="handleFeedbackFileSelected" 
              accept=".csv" 
              style="display:none" 
            />
            <div v-if="!feedbackFile" class="dropzone-content">
              <i class="icon-upload"></i>
              <p>请选择CSV格式的反馈文件 <span class="browse-link" @click="triggerFeedbackFileInput">浏览文件</span></p>
              <p class="file-hint">文件格式说明: 第一列为问题ID，第二列为反馈内容</p>
            </div>
            <div v-else class="selected-files">
              <div class="selected-file">
                <span class="file-name">{{ feedbackFile.name }}</span>
                <span class="file-size">({{ formatFileSize(feedbackFile.size) }})</span>
                <button class="remove-file" @click="feedbackFile = null">&times;</button>
              </div>
            </div>
          </div>

          <div class="upload-progress" v-if="feedbackUploading">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: feedbackUploadProgress + '%' }"></div>
            </div>
            <div class="progress-text">上传中 {{ feedbackUploadProgress }}%</div>
          </div>
          <div class="upload-error" v-if="feedbackUploadError">
            {{ feedbackUploadError }}
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="showFeedbackUploadModal = false" :disabled="feedbackUploading">取消</button>
          <button class="upload-btn" @click="uploadFeedbackFile" :disabled="!feedbackFile || feedbackUploading">
            {{ feedbackUploading ? '上传中...' : '上传' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  fetchDocuments,
  fetchUsers,
  fetchSettings,
  saveSettings,
  fetchStudentQuestions,
  approveQuestion,
  uploadDocuments,
  deleteDocument as deleteDocumentAPI,
  uploadFeedback,
  downloadStudentQuestions as downloadStudentQuestionsAPI,
  toggleUserStatus as toggleUserStatusAPI,
  decodeBase64,
  getFileTypeName,
  getAgentTypeName,
  formatFileSize,
  formatDate
} from '@/services/admin';

export default {
  name: 'AdminView',
  setup() {
    const router = useRouter();
    
    // 用户信息
    const username = ref('');
    
    // 活动标签页
    const activeTab = ref('students');
    
    // 文档列表
    const documents = ref([]);
    
    // 用户列表
    const users = ref([]);
    
    // 系统设置
    const settings = ref({
      systemName: '海棠校园问答系统',
      welcomeMessage: '你好！我是棠心问答AI辅导员，随时为你提供帮助～可以解答思想困惑、学业指导、心理调适等成长问题，也能推荐校园资源。请随时告诉我你的需求，我会用AI智慧陪伴你成长！✨'
    });
    
    // 上传文档相关
    const showUploadModal = ref(false);
    const fileInput = ref(null);
    const selectedFiles = ref([]);
    const isDragging = ref(false);
    const uploading = ref(false);
    const uploadProgress = ref(0);
    const uploadError = ref('');
    const uploadOptions = ref({
      fileType: '',
      agentType: ''
    });
    
    // 删除文档相关
    const showDeleteConfirm = ref(false);
    const docToDeleteId = ref(null);

    // 学生问题相关
    const studentQuestions = ref([]);
    const showFeedbackUploadModal = ref(false);
    const feedbackFile = ref(null);
    const feedbackFileInput = ref(null);
    const isFeedbackDragging = ref(false);
    const feedbackUploading = ref(false);
    const feedbackUploadProgress = ref(0);
    const feedbackUploadError = ref('');

    // 计算属性
    const isAdmin = computed(() => {
      return localStorage.getItem('userRole') === 'admin';
    });    // 加载初始数据
    onMounted(async () => {
      checkAdminAccess();
      loadUsername();
      await Promise.all([
        loadDocuments(),
        loadUsers(),
        loadSettings(),
        loadStudentQuestions()
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
    };    // 获取文档列表
    const loadDocuments = async () => {
      try {
        documents.value = await fetchDocuments();
      } catch (error) {
        console.error('获取文档列表失败:', error);
      }
    };

    // 获取用户列表
    const loadUsers = async () => {
      try {
        users.value = await fetchUsers();
      } catch (error) {
        console.error('获取用户列表失败:', error);
      }
    };

    // 获取系统设置
    const loadSettings = async () => {
      try {
        const settingsData = await fetchSettings();
        settings.value = settingsData;
      } catch (error) {
        console.error('获取系统设置失败:', error);
      }
    };

    // 获取学生问题
    const loadStudentQuestions = async () => {
      try {
        studentQuestions.value = await fetchStudentQuestions();
      } catch (error) {
        console.error('获取学生问题失败:', error);
      }
    };    // 保存系统设置
    const saveSystemSettings = async () => {
      try {
        await saveSettings(settings.value);
        alert('设置保存成功');
      } catch (error) {
        console.error('保存设置失败:', error);
        alert('保存设置失败');
      }
    };    // 下载学生常见问题
    const downloadQuestions = async () => {
      try {
        await downloadStudentQuestionsAPI();
        alert('学生常见问题已下载成功');
      } catch (error) {
        console.error('下载学生问题失败:', error);
        alert('下载失败，请重试');
      }
    };

    // 打开反馈上传模态框
    const openFeedbackUploadModal = () => {
      showFeedbackUploadModal.value = true;
      feedbackFile.value = null;
      feedbackUploadError.value = '';
    };

    // 触发反馈文件选择
    const triggerFeedbackFileInput = () => {
      feedbackFileInput.value.click();
    };

    // 处理反馈文件选择
    const handleFeedbackFileSelected = (event) => {
      const file = event.target.files[0];
      if (file && (file.type === 'text/csv' || file.type === 'application/vnd.ms-excel' || 
                  file.name.endsWith('.csv'))) {
        feedbackFile.value = file;
      } else {
        feedbackUploadError.value = '请上传CSV格式的文件';
      }
    };

    // 反馈拖拽相关事件处理函数
    const onFeedbackDragOver = () => {
      isFeedbackDragging.value = true;
    };

    const onFeedbackDragLeave = () => {
      isFeedbackDragging.value = false;
    };

    const onFeedbackDrop = (event) => {
      isFeedbackDragging.value = false;
      const file = event.dataTransfer.files[0];
      if (file && (file.type === 'text/csv' || file.type === 'application/vnd.ms-excel' || 
                 file.name.endsWith('.csv'))) {
        feedbackFile.value = file;
      } else {
        feedbackUploadError.value = '请上传CSV格式的文件';
      }
    };    // 上传反馈文件
    const uploadFeedbackFile = async () => {
      if (!feedbackFile.value) {
        feedbackUploadError.value = '请选择要上传的反馈文件';
        return;
      }

      feedbackUploading.value = true;
      feedbackUploadProgress.value = 0;
      feedbackUploadError.value = '';

      try {
        await uploadFeedback(feedbackFile.value, (progress) => {
          feedbackUploadProgress.value = progress;
        });

        alert('反馈上传成功');
        showFeedbackUploadModal.value = false;
        // 更新已回答状态
        studentQuestions.value.forEach(q => q.answered = true);
        feedbackUploading.value = false;
      } catch (error) {
        console.error('上传反馈失败:', error);
        feedbackUploadError.value = '上传过程中发生错误，请重试';
        feedbackUploading.value = false;
      }
    };

    // 以下是缺失的方法实现

    // 打开上传文档弹窗
    const openUploadModal = () => {
      showUploadModal.value = true;
      selectedFiles.value = [];
      uploadOptions.value = { fileType: '', agentType: '' };
      uploadError.value = '';
    };    // 获取文件类型名称 - 从admin.js导入，这里不需要重复定义

    // 获取Agent类型名称 - 从admin.js导入，这里不需要重复定义

    // 格式化文件大小 - 从admin.js导入，这里不需要重复定义

    // 格式化日期 - 从admin.js导入，这里不需要重复定义

    // 查看文档
    const viewDocument = (id) => {
      alert(`查看文档ID: ${id}`);
      // 实际项目中可能会打开一个新的页面或弹窗来显示文档内容
    };

    // 编辑文档
    const editDocument = (id) => {
      alert(`编辑文档ID: ${id}`);
      // 实际项目中可能会打开编辑界面
    };

    // 确认删除文档
    const confirmDelete = (id) => {
      docToDeleteId.value = id;
      showDeleteConfirm.value = true;
    };    // 删除文档
    const deleteDoc = async () => {
      try {
        await deleteDocumentAPI(docToDeleteId.value);
        // 从本地数组中移除已删除的文档
        documents.value = documents.value.filter(doc => doc.id !== docToDeleteId.value);
        showDeleteConfirm.value = false;
        alert('文档删除成功');
      } catch (error) {
        console.error('删除文档失败:', error);
        alert('删除文档失败，请重试');
      }
    };

    // 移除选中的文件
    const removeFile = (index) => {
      selectedFiles.value.splice(index, 1);
    };    // 上传文件
    const uploadFiles = async () => {
      if (!selectedFiles.value.length) {
        uploadError.value = '请选择要上传的文件';
        return;
      }

      if (!uploadOptions.value.fileType) {
        uploadError.value = '请选择文件类型';
        return;
      }

      if (!uploadOptions.value.agentType) {
        uploadError.value = '请选择Agent类型';
        return;
      }

      uploading.value = true;
      uploadProgress.value = 0;
      uploadError.value = '';

      try {
        await uploadDocuments(selectedFiles.value, uploadOptions.value, (progress) => {
          uploadProgress.value = progress;
        });

        alert('文件上传成功');
        showUploadModal.value = false;
        // 重新加载文档列表
        await loadDocuments();
        uploading.value = false;
      } catch (error) {
        console.error('上传文件失败:', error);
        uploadError.value = '上传过程中发生错误，请重试';
        uploading.value = false;
      }
    };

    // 触发文件选择
    const triggerFileInput = () => {
      fileInput.value.click();
    };

    // 处理文件选择
    const handleFileSelected = (event) => {
      const files = Array.from(event.target.files);
      if (files.length) {
        selectedFiles.value = [...selectedFiles.value, ...files];
      }
    };

    // 文件拖拽相关事件处理函数
    const onDragOver = () => {
      isDragging.value = true;
    };

    const onDragLeave = () => {
      isDragging.value = false;
    };

    const onDrop = (event) => {
      isDragging.value = false;
      const files = Array.from(event.dataTransfer.files);
      if (files.length) {
        selectedFiles.value = [...selectedFiles.value, ...files];
      }
    };

    // 退出登录
    const logout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
      router.push('/login');
    };

    // 查看问题
    const viewQuestion = (id) => {
      if (id) {
        alert(`查看问题ID: ${id}`);
        // 实际项目中可能会打开问题详情页
      }
    };    // 回答问题
    const answerQuestion = (id) => {
      if (id) {
        alert(`回答问题ID: ${id}`);
        // 实际项目中可能会打开回答界面
      }
    };    // 审核问题
    const approveQuestionAction = async (id) => {
      try {
        await approveQuestion(id);
        
        // 更新本地问题状态
        const question = studentQuestions.value.find(q => q.id === id);
        if (question) {
          question.isReviewed = true;
          question.answered = true;
        }

        alert('问题审核成功');
      } catch (error) {
        console.error('审核问题失败:', error);
        alert('审核失败，请重试');
      }
    };

    // 切换用户状态（启用/禁用）
    const toggleUserStatusAction = async (id) => {
      try {
        // 找到用户
        const user = users.value.find(u => u.id === id);
        if (!user) return;

        // 切换状态
        const newStatus = user.status === 'active' ? 'blocked' : 'active';

        await toggleUserStatusAPI(id, newStatus);

        // 更新本地状态
        user.status = newStatus;
                alert(`用户 ${user.username} 已${newStatus === 'active' ? '启用' : '禁用'}`);
      } catch (error) {
        console.error('切换用户状态失败:', error);
        alert('操作失败，请重试');
      }
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
      deleteDoc,
      toggleUserStatusAction,
      saveSystemSettings,
      getAgentTypeName,
      getFileTypeName,
      viewDocument,
      editDocument,
      formatFileSize,
      formatDate,
      logout,
      uploadOptions,
      studentQuestions,
      downloadQuestions,
      openFeedbackUploadModal,
      triggerFeedbackFileInput,
      handleFeedbackFileSelected,
      uploadFeedbackFile,
      viewQuestion,
      answerQuestion,
      approveQuestionAction,
      isFeedbackDragging,
      feedbackUploading,
      feedbackUploadProgress,
      feedbackUploadError,
      onFeedbackDragOver,
      onFeedbackDragLeave,
      onFeedbackDrop,
      showFeedbackUploadModal,
      feedbackFile,
      feedbackFileInput,
      docToDeleteId
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

.icon-student::before {
  content: "🎓";
}

.icon-question::before {
  content: "❓";
  margin-right: 5px;
  color: #4CAF50;
}

.icon-download::before {
  content: "⬇️";
  margin-right: 5px;
}

.icon-empty::before {
  content: "📝";
  margin-right: 5px;
  color: #9e9e9e;
}

.question-content {
  display: flex;
  align-items: center;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.answered {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-badge.unanswered {
  background-color: #ffebee;
  color: #c62828;
}

.panel-actions {
  display: flex;
  gap: 10px;
}

.download-btn {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.download-btn:hover {
  background-color: #1976D2;
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

/* 学生问题管理相关样式 */
.students-panel .question-content {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.students-panel .question-content .icon-question {
  margin-right: 8px;
  color: #4CAF50;
}

/* 未审核问题行高亮 */
.unreviewed-row {
  background-color: #fff3e0 !important;
}

.unreviewed-row:hover {
  background-color: #ffe0b2 !important;
}

/* 状态徽章样式 */
.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  display: inline-block;
  min-width: 60px;
  text-align: center;
}

.status-badge.reviewed {
  background-color: #e8f5e8;
  color: #2e7d32;
  border: 1px solid #c8e6c9;
}

.status-badge.unreviewed {
  background-color: #fff3e0;
  color: #f57c00;
  border: 1px solid #ffcc02;
}

.status-badge.answered {
  background-color: #e3f2fd;
  color: #1976d2;
  border: 1px solid #bbdefb;
}

.status-badge.unanswered {
  background-color: #fce4ec;
  color: #c2185b;
  border: 1px solid #f8bbd9;
}

/* 操作按钮样式优化 */
.action-btn.approve {
  background-color: #ff9800;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.action-btn.approve:hover {
  background-color: #f57c00;
}
</style>
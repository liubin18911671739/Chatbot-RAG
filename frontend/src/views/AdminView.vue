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
          </div> -->          <div class="nav-item" :class="{ active: activeTab === 'campus-questions' }" @click="activeTab = 'campus-questions'">
            <i class="icon-student"></i>
            <span>校园共建问题</span>
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
        </div>        <!-- 校园共建问题面板 -->
        <div v-if="activeTab === 'campus-questions'" class="panel campus-questions-panel">
          <div class="panel-header">
            <h2>校园共建问题管理</h2>
            <div class="panel-actions">
              <button class="download-btn" @click="downloadQuestions">
                <i class="icon-download"></i> 下载问题
              </button>
              <button class="upload-btn" @click="openFeedbackUploadModal">
                <i class="icon-upload"></i> 上传反馈
              </button>
            </div>
          </div>

          <!-- 校园共建问题列表 -->
          <div class="campus-questions-list">
            <table v-if="campusQuestions.length > 0">              <thead>
                <tr>
                  <th>问题ID</th>
                  <th>提交者</th>
                  <th>问题内容</th>
                  <th>答案</th>
                  <th>审核状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="question in campusQuestions" :key="question.id" 
                    :class="{ 'unreviewed-row': question.status === 'unreview' }">
                  <td>{{ question.id }}</td>
                  <td>{{ question.userid }}</td>
                  <td class="question-content">
                    <i class="icon-question"></i> {{ question.question }}
                  </td>                  <td class="answer-content">
                    <div v-html="renderMarkdown(question.answer)"></div>
                  </td>
                  <td>
                    <span :class="['status-badge', question.status === 'reviewed' ? 'reviewed' : 'unreviewed']">
                      {{ question.status === 'reviewed' ? '已审核' : '未审核' }}
                    </span>
                  </td>                    <td class="actions">
                    <button class="action-btn view" @click="viewQuestionDetail(question)">查看</button>
                    <button class="action-btn edit" @click="editQuestionAnswer(question)">编辑</button>
                    <button class="action-btn approve" @click="approveQuestionAction(question.id)">审核</button>
                    <button class="action-btn delete" @click="confirmDeleteQuestion(question.id)">删除</button>
                    </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty-state">
              <p><i class="icon-empty"></i> 暂无校园共建问题记录</p>
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
    </div>    <!-- 删除问题确认弹窗 -->
    <div v-if="showDeleteQuestionConfirm" class="modal-overlay">
      <div class="confirm-modal delete-confirm-modal">
        <div class="modal-icon-header">
          <div class="delete-warning-icon">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 9V13M12 17.02H12.01M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C2 6.48 6.48 2 12 2Z" stroke="#f44336" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <button class="close-btn delete-close-btn" @click="showDeleteQuestionConfirm = false">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div class="modal-content-body">
          <h3 class="delete-title">删除问题确认</h3>
          <p class="delete-message">
            您即将删除这个问题。此操作无法撤销，相关的所有数据将被永久删除。
          </p>
          <div class="warning-notice">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 9V13M12 17.02H12.01M4.93 4.93L19.07 19.07" stroke="#ff9800" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>请确认您真的要执行此操作</span>
          </div>
        </div>
        <div class="modal-actions">
          <button class="action-btn cancel-action-btn" @click="showDeleteQuestionConfirm = false">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            取消
          </button>
          <button class="action-btn delete-action-btn" @click="deleteQuestion">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6H5H21M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            确认删除
          </button>
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
          </button>        </div>
      </div>
    </div>

    <!-- 问题详情查看弹窗 -->
    <div v-if="showQuestionDetailModal" class="modal-overlay">
      <div class="detail-modal">
        <div class="modal-header">
          <h3>问题详情</h3>
          <button class="close-btn" @click="showQuestionDetailModal = false">&times;</button>
        </div>
        <div class="modal-body" v-if="currentQuestion">
          <div class="detail-item">
            <label>问题ID:</label>
            <span>{{ currentQuestion.id }}</span>
          </div>
          <div class="detail-item">
            <label>提交者:</label>
            <span>{{ currentQuestion.userid }}</span>
          </div>
          <div class="detail-item">
            <label>问题内容:</label>
            <div class="detail-content">{{ currentQuestion.question }}</div>
          </div>          <div class="detail-item">
            <label>答案:</label>
            <div class="detail-content markdown-content" v-html="renderMarkdown(currentQuestion.answer)"></div>
          </div>
          <div class="detail-item">
            <label>审核状态:</label>
            <span :class="['status-badge', currentQuestion.status === 'reviewed' ? 'reviewed' : 'unreviewed']">
              {{ currentQuestion.status === 'reviewed' ? '已审核' : '未审核' }}
            </span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="showQuestionDetailModal = false">关闭</button>
          <button v-if="currentQuestion && currentQuestion.status === 'unreview'" 
                  class="approve-btn" 
                  @click="approveFromDetail">
            审核通过
          </button>
          <button class="edit-btn" @click="openEditFromDetail">编辑</button>
        </div>
      </div>
    </div>

    <!-- 编辑问题弹窗 -->
    <div v-if="showEditQuestionModal" class="modal-overlay">
      <div class="edit-modal">
        <div class="modal-header">
          <h3>编辑问题</h3>
          <button class="close-btn" @click="showEditQuestionModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="editQuestion">问题内容:</label>
            <textarea 
              id="editQuestion" 
              v-model="editForm.question" 
              class="form-textarea"
              rows="3"
              readonly
            ></textarea>
            <small class="form-hint">问题内容不可修改</small>
          </div>
          <div class="form-group">
            <label for="editAnswer">答案:</label>
            <textarea 
              id="editAnswer" 
              v-model="editForm.answer" 
              class="form-textarea"
              rows="5"
              placeholder="请输入或修改答案..."
              required
            ></textarea>
          </div>
          <div class="form-group">
            <label for="editStatus">审核状态:</label>
            <select id="editStatus" v-model="editForm.status" class="form-select">
              <option value="unreview">未审核</option>
              <option value="reviewed">已审核</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="showEditQuestionModal = false">取消</button>
          <button class="save-btn" @click="saveEditedQuestion" :disabled="!editForm.answer.trim()">
            保存修改
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
import MarkdownIt from 'markdown-it';
import {
  fetchDocuments,
  fetchUsers,
  fetchSettings,
  saveSettings,
  fetchCampusQuestions,
  approveQuestion,
  updateQuestionAnswer,
  uploadDocuments,
  deleteDocument as deleteDocumentAPI,
  deleteCampusQuestion,
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
  setup() {    const router = useRouter();
    
    // 创建 markdown 解析器实例
    const md = new MarkdownIt({
      html: false,        // 禁用HTML标签
      breaks: true,       // 将\n转换为<br>
      linkify: true       // 自动将URL转为链接
    });
    
    // 用户信息
    const username = ref('');
      // 活动标签页
    const activeTab = ref('campus-questions');
    
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

    // 删除问题相关
    const showDeleteQuestionConfirm = ref(false);
    const questionToDeleteId = ref(null);

    // 学生问题相关
    const studentQuestions = ref([]);    // 校园共建问题相关
    const campusQuestions = ref([]);
    const showFeedbackUploadModal = ref(false);
    const feedbackFile = ref(null);
    const feedbackFileInput = ref(null);
    const isFeedbackDragging = ref(false);
    const feedbackUploading = ref(false);
    const feedbackUploadProgress = ref(0);
    const feedbackUploadError = ref('');

    // 问题详情和编辑相关
    const showQuestionDetailModal = ref(false);
    const showEditQuestionModal = ref(false);
    const currentQuestion = ref(null);
    const editForm = ref({
      question: '',
      answer: '',
      status: ''
    });

    // 计算属性
    const isAdmin = computed(() => {
      return localStorage.getItem('userRole') === 'admin';
    });    // 加载初始数据
    onMounted(async () => {
      checkAdminAccess();
      loadUsername();      await Promise.all([
        loadDocuments(),
        loadUsers(),
        loadSettings(),
        loadStudentQuestions(),
        loadCampusQuestions()
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
    };    // 获取学生问题
    const loadStudentQuestions = async () => {
      try {
        studentQuestions.value = await fetchStudentQuestions();
      } catch (error) {
        console.error('获取学生问题失败:', error);
      }
    };

    // 获取校园共建问题
    const loadCampusQuestions = async () => {
      try {
        campusQuestions.value = await fetchCampusQuestions();
      } catch (error) {
        console.error('获取校园共建问题失败:', error);
      }
    };// 保存系统设置
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
        alert('删除文档失败，请重试');      }
    };    // 确认删除问题
    const confirmDeleteQuestion = (id) => {
      questionToDeleteId.value = id;
      showDeleteQuestionConfirm.value = true;
    };

    // 删除问题
    const deleteQuestion = async () => {
      try {
        if (!questionToDeleteId.value) {
          alert('未找到要删除的问题');
          return;
        }

        await deleteCampusQuestion(questionToDeleteId.value);

        // 从本地数组中移除已删除的问题
        campusQuestions.value = campusQuestions.value.filter(q => q.id !== questionToDeleteId.value);
        
        showDeleteQuestionConfirm.value = false;
        questionToDeleteId.value = null;
        
        alert('问题删除成功');
      } catch (error) {
        console.error('删除问题失败:', error);
        alert(`删除失败: ${error.message || '请重试'}`);
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
        selectedFiles.value = [...selectedFiles.value, ...files];      }
    };

    // 渲染 markdown 文本
    const renderMarkdown = (content) => {
      if (!content) return '';
      return md.render(content);
    };

    // 退出登录
    const logout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
      router.push('/login');
    };    // 查看问题详情
    const viewQuestionDetail = (question) => {
      currentQuestion.value = question;
      showQuestionDetailModal.value = true;
    };

    // 编辑问题答案
    const editQuestionAnswer = (question) => {
      currentQuestion.value = question;
      editForm.value = {
        question: question.question,
        answer: question.answer,
        status: question.status
      };
      showEditQuestionModal.value = true;
    };

    // 从详情页面打开编辑
    const openEditFromDetail = () => {
      showQuestionDetailModal.value = false;
      editQuestionAnswer(currentQuestion.value);
    };    // 从详情页面审核
    const approveFromDetail = async () => {
      if (currentQuestion.value) {
        await approveQuestionAction(currentQuestion.value.id);
        currentQuestion.value.status = 'reviewed';
        showQuestionDetailModal.value = false;
      }
    };    // 保存编辑的问题
    const saveEditedQuestion = async () => {
      try {
        if (!editForm.value.answer.trim()) {
          alert('答案不能为空');
          return;
        }

        const updateData = {
          question: currentQuestion.value.question, // 包含问题内容
          answer: editForm.value.answer.trim(),
          status: editForm.value.status,
          userid: currentQuestion.value.userid || "admin" // 确保包含userid
        };

        await updateQuestionAnswer(currentQuestion.value.id, updateData);

        // 更新本地数据
        const questionIndex = campusQuestions.value.findIndex(q => q.id === currentQuestion.value.id);
        if (questionIndex !== -1) {
          campusQuestions.value[questionIndex] = {
            ...campusQuestions.value[questionIndex],
            ...updateData
          };
        }

        alert('问题编辑成功');
        showEditQuestionModal.value = false;
        
        // 刷新数据
        await loadCampusQuestions();
      } catch (error) {
        console.error('编辑问题失败:', error);
        alert(`编辑失败: ${error.message || '请重试'}`);
      }
    };    // 审核问题
    const approveQuestionAction = async (id) => {
      try {
        // 查找要审核的问题数据
        const questionToApprove = campusQuestions.value.find(q => q.id === id);
        if (!questionToApprove) {
          throw new Error('找不到要审核的问题');
        }
        
        // 传递问题的完整数据
        await approveQuestion(id, {
          question: questionToApprove.question,
          answer: questionToApprove.answer,
          userid: questionToApprove.userid
        });
        
        // 更新本地校园共建问题状态
        const campusQuestion = campusQuestions.value.find(q => q.id === id);
        if (campusQuestion) {
          campusQuestion.status = 'reviewed';
        }

        alert('问题审核成功');
      } catch (error) {
        console.error('审核问题失败:', error);
        alert(`审核失败: ${error.message || '请重试'}`);
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
    };    return {
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
      editDocument,      formatFileSize,
      formatDate,
      renderMarkdown,
      logout,
      uploadOptions,
      studentQuestions,
      campusQuestions,
      loadCampusQuestions,
      downloadQuestions,
      openFeedbackUploadModal,
      triggerFeedbackFileInput,
      handleFeedbackFileSelected,
      uploadFeedbackFile,
      viewQuestionDetail,
      editQuestionAnswer,
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
      feedbackFileInput,      docToDeleteId,
      // 新增的变量和方法
      showQuestionDetailModal,
      showEditQuestionModal,
      currentQuestion,
      editForm,
      openEditFromDetail,
      approveFromDetail,
      saveEditedQuestion,
      // 删除问题相关
      showDeleteQuestionConfirm,
      questionToDeleteId,
      confirmDeleteQuestion,
      deleteQuestion
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
  background-color: #e8f5e8;
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

/* 删除确认弹窗样式 */
.delete-confirm-modal {
  background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
  border-radius: 16px;
  width: 90%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 20px rgba(244, 67, 54, 0.1);
  border: 1px solid rgba(244, 67, 54, 0.1);
  overflow: hidden;
  animation: delete-modal-appear 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  transform-origin: center;
}

.modal-icon-header {
  position: relative;
  padding: 30px 20px 20px;
  text-align: center;
  background: linear-gradient(135deg, #ffebee 0%, #fff 100%);
  border-bottom: 1px solid rgba(244, 67, 54, 0.1);
}

.delete-warning-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, rgba(244, 67, 54, 0.1) 0%, rgba(244, 67, 54, 0.05) 100%);
  border-radius: 50%;
  margin-bottom: 10px;
  animation: delete-icon-pulse 2s ease-in-out infinite;
  position: relative;
}

.delete-warning-icon::before {
  content: '';
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  border: 2px solid rgba(244, 67, 54, 0.2);
  border-radius: 50%;
  animation: delete-ring-pulse 2s ease-in-out infinite;
}

.delete-close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #666;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.delete-close-btn:hover {
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
  transform: rotate(90deg) scale(1.1);
}

.modal-content-body {
  padding: 20px 30px 30px;
  text-align: center;
}

.delete-title {
  margin: 0 0 16px 0;
  color: #2c3e50;
  font-size: 1.4rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.delete-message {
  margin: 0 0 20px 0;
  color: #5a6c7d;
  font-size: 1rem;
  line-height: 1.6;
  font-weight: 400;
}

.warning-notice {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 152, 0, 0.05) 100%);
  border: 1px solid rgba(255, 152, 0, 0.2);
  border-radius: 8px;
  color: #e65100;
  font-size: 0.9rem;
  font-weight: 500;
  animation: warning-glow 3s ease-in-out infinite;
}

.modal-actions {
  display: flex;
  gap: 12px;
  padding: 0 30px 30px;
  justify-content: center;
}

.action-btn {
  flex: 1;
  max-width: 140px;
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.action-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.action-btn:active::before {
  width: 300px;
  height: 300px;
}

.cancel-action-btn {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  color: #495057;
  border: 1px solid #dee2e6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.cancel-action-btn:hover {
  background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.delete-action-btn {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
}

.delete-action-btn:hover {
  background: linear-gradient(135deg, #d32f2f 0%, #c62828 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(244, 67, 54, 0.4);
}

.delete-action-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
}

/* 动画效果 */
@keyframes delete-modal-appear {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(-20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes delete-icon-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes delete-ring-pulse {
  0%, 100% {
    opacity: 0.7;
    transform: scale(1);
  }
  50% {
    opacity: 0.3;
    transform: scale(1.1);
  }
}

@keyframes warning-glow {
  0%, 100% {
    box-shadow: 0 0 0 rgba(255, 152, 0, 0.2);
  }
  50% {
    box-shadow: 0 0 20px rgba(255, 152, 0, 0.15);
  }
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6));
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: modal-overlay-fade-in 0.3s ease-out;
}

/* 基础确认模态框样式 */
.confirm-modal {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

/* 问题详情模态框 */
.detail-modal {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

/* 编辑问题模态框 */
.edit-modal {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 700px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
  background-color: #f8f9fa;
  border-radius: 8px 8px 0 0;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.2rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: #f0f0f0;
  color: #333;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #eee;
  background-color: #f8f9fa;
  border-radius: 0 0 8px 8px;
}

/* 详情项目样式 */
.detail-item {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
}

.detail-item label {
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.detail-item span {
  color: #666;
  font-size: 1rem;
}

.detail-content {
  background-color: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
  border: 1px solid #e9ecef;
  color: #333;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* 表单样式 */
.form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.3s;
}

.form-textarea:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}

.form-textarea[readonly] {
  background-color: #f8f9fa;
  color: #666;
  cursor: not-allowed;
}

.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  background-color: white;
  cursor: pointer;
  transition: border-color 0.3s;
}

.form-select:focus {
  outline: none;
  border-color: #4CAF50;
}

.form-hint {
  color: #999;
  font-size: 0.8rem;
  margin-top: 4px;
  font-style: italic;
}

/* 按钮样式 */
.cancel-btn {
  padding: 8px 16px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.cancel-btn:hover {
  background-color: #545b62;
}

.save-btn {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.save-btn:hover {
  background-color: #45a049;
}

.save-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.approve-btn {
  padding: 8px 16px;
  background-color: #ff9800;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.approve-btn:hover {
  background-color: #f57c00;
}

.edit-btn {
  padding: 8px 16px;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.edit-btn:hover {
  background-color: #1976D2;
}

/* 状态标签样式 */
.status-badge.reviewed {
  background-color: #e8f5e8;
  color: #2e7d32;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.unreviewed {
  background-color: #ffebee;
  color: #c62828;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .detail-modal,
  .edit-modal {
    width: 95%;
    margin: 10px;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 16px;
  }
  
  .modal-footer {
    flex-direction: column;
    gap: 8px;
  }
  
  .modal-footer button {
    width: 100%;
    padding: 12px;
  }

  /* 删除确认弹窗移动端适配 */
  .delete-confirm-modal {
    width: 95%;
    max-width: 400px;
    margin: 20px;
  }

  .modal-icon-header {
    padding: 20px 15px 15px;
  }

  .delete-warning-icon {
    width: 60px;
    height: 60px;
  }

  .delete-warning-icon svg {
    width: 40px;
    height: 40px;
  }

  .modal-content-body {
    padding: 15px 20px 20px;
  }

  .delete-title {
    font-size: 1.2rem;
    margin-bottom: 12px;
  }

  .delete-message {
    font-size: 0.9rem;
    margin-bottom: 16px;
  }

  .warning-notice {
    padding: 10px 12px;
    font-size: 0.85rem;
  }

  .modal-actions {
    flex-direction: column;
    gap: 10px;
    padding: 0 20px 20px;
  }

  .action-btn {
    max-width: none;
    padding: 14px 20px;
    font-size: 0.9rem;
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes modal-overlay-fade-in {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(8px);  }
}

/* Markdown 内容样式 */
.markdown-content {
  line-height: 1.6;
  word-wrap: break-word;
}

.markdown-content h1,
.markdown-content h2,
.markdown-content h3,
.markdown-content h4,
.markdown-content h5,
.markdown-content h6 {
  margin: 16px 0 8px 0;
  font-weight: 600;
  color: #2c3e50;
}

.markdown-content h1 {
  font-size: 1.5em;
  border-bottom: 2px solid #eee;
  padding-bottom: 8px;
}

.markdown-content h2 {
  font-size: 1.3em;
  border-bottom: 1px solid #eee;
  padding-bottom: 6px;
}

.markdown-content h3 {
  font-size: 1.2em;
}

.markdown-content p {
  margin: 8px 0;
}

.markdown-content ul,
.markdown-content ol {
  margin: 8px 0;
  padding-left: 20px;
}

.markdown-content li {
  margin: 4px 0;
}

.markdown-content blockquote {
  margin: 12px 0;
  padding: 8px 16px;
  background-color: #f8f9fa;
  border-left: 4px solid #dee2e6;
  color: #6c757d;
}

.markdown-content code {
  background-color: #f1f3f4;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.markdown-content pre {
  background-color: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 12px 0;
}

.markdown-content pre code {
  background-color: transparent;
  padding: 0;
}

.markdown-content a {
  color: #007bff;
  text-decoration: none;
}

.markdown-content a:hover {
  text-decoration: underline;
}

.markdown-content strong {
  font-weight: 600;
}

.markdown-content em {
  font-style: italic;
}

.markdown-content table {
  border-collapse: collapse;
  width: 100%;
  margin: 12px 0;
}

.markdown-content th,
.markdown-content td {
  border: 1px solid #dee2e6;
  padding: 8px 12px;
  text-align: left;
}

.markdown-content th {
  background-color: #f8f9fa;
  font-weight: 600;
}

.markdown-content hr {
  margin: 20px 0;
  border: none;
  border-top: 1px solid #dee2e6;
}

/* 答案内容区域特殊样式 */
.answer-content .markdown-content {
  max-height: 150px;
  overflow-y: auto;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.detail-content.markdown-content {
  max-height: 300px;
  overflow-y: auto;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}
</style>
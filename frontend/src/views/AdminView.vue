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
          <div class="nav-item" :class="{ active: activeTab === 'documents' }" @click="activeTab = 'documents'">
            <i class="icon-document"></i>
            <span>文档管理</span>
          </div>
          <div class="nav-item" :class="{ active: activeTab === 'students' }" @click="activeTab = 'students'">
            <i class="icon-student"></i>
            <span>学生常见问题</span>
          </div>
          <div class="nav-item" :class="{ active: activeTab === 'users' }" @click="activeTab = 'users'">
            <i class="icon-users"></i>
            <span>用户管理</span>
          </div>
          <div class="nav-item" :class="{ active: activeTab === 'settings' }" @click="activeTab = 'settings'">
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
              <button class="download-btn" @click="downloadStudentQuestions">
                <i class="icon-download"></i> 下载问题
              </button>
              <button class="upload-btn" @click="openFeedbackUploadModal">
                <i class="icon-upload"></i> 上传反馈
              </button>
            </div>
          </div>

          <!-- 学生问题列表 -->
          <div class="student-questions-list">
            <table v-if="studentQuestions.length > 0">
              <thead>
                <tr>
                  <th>学生ID</th>
                  <th>问题内容</th>
                  <th>提问时间</th>
                  <th>是否已回答</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="question in studentQuestions" :key="question.id">
                  <td>{{ question.studentId }}</td>
                  <td class="question-content">
                    <i class="icon-question"></i>  {{ question.content }}
                  </td>
                  <td>{{ formatDate(question.createdAt) }}</td>
                  <td>
                    <span :class="['status-badge', question.answered ? 'answered' : 'unanswered']">
                      {{ question.answered ? '已回答' : '未回答' }}
                    </span>
                  </td>
                  <td class="actions">
                    <button class="action-btn view" @click="viewQuestion(question.id)">查看</button>
                    <button class="action-btn answer" @click="answerQuestion(question.id)">回答</button>
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
          <button class="delete-btn" @click="deleteDocument">删除</button>
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
          <button class="upload-btn" @click="uploadFeedback" :disabled="!feedbackFile || feedbackUploading">
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
    });

    // 加载初始数据
    onMounted(async () => {
      checkAdminAccess();
      loadUsername();
      await Promise.all([
        fetchDocuments(),
        fetchUsers(),
        fetchSettings(),
        fetchStudentQuestions()
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
        // 模拟文档数据，包含文件名、类型、大小、上传时间、属于的Agent场景和基本操作
        documents.value = [
          {
            id: 1, 
            filename: '学校介绍.pdf', 
            fileType: 'policy', 
            type: 'pdf', 
            size: 2548760, 
            uploadDate: new Date(2025, 3, 15),
            agentType: 'general'
          },
          {
            id: 2, 
            filename: '教师手册.docx', 
            fileType: 'manual', 
            type: 'docx', 
            size: 1345600, 
            uploadDate: new Date(2025, 3, 10),
            agentType: 'general'
          },
          {
            id: 3, 
            filename: '学生信息.xlsx', 
            fileType: 'regulation', 
            type: 'xlsx', 
            size: 872341, 
            uploadDate: new Date(2025, 3, 5),
            agentType: 'general'
          },
          {
            id: 4, 
            filename: '思政教育案例.pdf', 
            fileType: 'policy', 
            type: 'pdf', 
            size: 1458720, 
            uploadDate: new Date(2025, 3, 20),
            agentType: 'ideological'
          },
          {
            id: 5, 
            filename: '阿拉伯语言文化.docx', 
            fileType: 'manual', 
            type: 'docx', 
            size: 1756432, 
            uploadDate: new Date(2025, 3, 22),
            agentType: 'china-arab'
          },
          {
            id: 6, 
            filename: '东南亚地区研究.pdf', 
            fileType: 'report', 
            type: 'pdf', 
            size: 3245678, 
            uploadDate: new Date(2025, 3, 18),
            agentType: 'regional'
          },
          {
            id: 7, 
            filename: '常见问题解答.txt', 
            fileType: 'faq', 
            type: 'txt', 
            size: 546789, 
            uploadDate: new Date(2025, 3, 25),
            agentType: 'general'
          },
          {
            id: 8, 
            filename: '数字人文文献集.pdf', 
            fileType: 'report', 
            type: 'pdf', 
            size: 4567890, 
            uploadDate: new Date(2025, 3, 23),
            agentType: 'digital-human'
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

    // 获取学生问题
    const fetchStudentQuestions = async () => {
      try {
        // 移除条件判断，确保始终加载模拟数据
        // 模拟学生问题数据
        const questionsData = [
          {
            id: 1,
            studentId: '20250101',
            content: '如何申请奖学金？需要准备哪些材料？',
            createdAt: new Date(2025, 3, 20, 10, 15),
            answered: true
          },
          {
            id: 2,
            studentId: '20250102',
            content: '学校图书馆开放时间是什么时候？寒暑假期间是否开放？',
            createdAt: new Date(2025, 3, 21, 14, 30),
            answered: false
          },
          {
            id: 3,
            studentId: '20250103',
            content: '如何预约心理咨询？是否需要提前多久预约？',
            createdAt: new Date(2025, 3, 22, 9, 45),
            answered: false
          },
          {
            id: 4,
            studentId: '20250104',
            content: '校区间班车时刻表在哪里查询？周末是否有班车？',
            createdAt: new Date(2025, 3, 23, 16, 20),
            answered: true
          },
          {
            id: 5,
            studentId: '20250105',
            content: '学校食堂的营业时间是什么？有哪些特色菜品推荐？',
            createdAt: new Date(2025, 3, 24, 11, 50),
            answered: false
          },
          {
            id: 6,
            studentId: '20250106',
            content: '如何申请校内住宿调换？有什么条件限制吗？',
            createdAt: new Date(2025, 3, 24, 13, 25),
            answered: true
          },
          {
            id: 7,
            studentId: '20250107',
            content: '学校有哪些社团组织？如何加入？',
            createdAt: new Date(2025, 3, 24, 15, 40),
            answered: false
          },
          {
            id: 8,
            studentId: '20250108',
            content: '考研自习室的开放时间和预约方式是什么？',
            createdAt: new Date(2025, 3, 24, 17, 10),
            answered: true
          },
          {
            id: 9,
            studentId: '20250109',
            content: '如何办理学生证补办手续？需要多长时间？',
            createdAt: new Date(2025, 3, 25, 8, 30),
            answered: false
          },
          {
            id: 10,
            studentId: '20250110',
            content: '学校附近有哪些实习机会？如何申请校企合作项目？',
            createdAt: new Date(2025, 3, 25, 10, 45),
            answered: false
          },
          {
            id: 11,
            studentId: '20250111',
            content: '国际交换生项目有哪些？申请条件是什么？',
            createdAt: new Date(2025, 3, 25, 13, 20),
            answered: true
          },
          {
            id: 12,
            studentId: '20250112',
            content: '如何申请学分减免？特殊情况下可以延期毕业吗？',
            createdAt: new Date(2025, 3, 25, 16, 15),
            answered: false
          },
          {
            id: 13,
            studentId: '20250113',
            content: '学校网络如何连接？忘记密码怎么办？',
            createdAt: new Date(2025, 3, 26, 9, 5),
            answered: true
          },
          {
            id: 14,
            studentId: '20250114',
            content: '校医院的就诊流程是怎样的？需要提前预约吗？',
            createdAt: new Date(2025, 3, 26, 11, 25),
            answered: false
          },
          {
            id: 15,
            studentId: '20250115',
            content: '学校的体育场地如何预约使用？有哪些免费开放的场地？',
            createdAt: new Date(2025, 3, 26, 14, 40),
            answered: true
          }
        ];

        // 确保过滤掉无效数据，并保证每个问题对象都有必要的属性
        studentQuestions.value = questionsData.filter(q => 
          q && typeof q === 'object' && 
          q.id && 
          q.content && 
          q.studentId
        );

        // 实际API调用（取消注释使用）
        /*
        try {
          const response = await axios.get('/api/questions', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          // 过滤掉后端返回的可能的无效数据
          studentQuestions.value = (response.data || []).filter(q => 
            q && typeof q === 'object' && 
            q.id && 
            q.content && 
            q.studentId
          );
        } catch (apiError) {
          console.error('API调用失败:', apiError);
          studentQuestions.value = [];
        }
        */
      } catch (error) {
        console.error('获取学生问题失败:', error);
        studentQuestions.value = []; // 错误时设置为空数组
      }
    };

    // 下载学生常见问题
    const downloadStudentQuestions = async () => {
      try {
        // 实际API调用（取消注释使用）
        /*
        const response = await axios.get('/api/download_questions', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          responseType: 'blob'
        });
        
        // 创建下载链接
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `学生常见问题_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        */

        // 模拟下载成功
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
    };

    // 上传反馈文件
    const uploadFeedback = async () => {
      if (!feedbackFile.value) {
        feedbackUploadError.value = '请选择要上传的反馈文件';
        return;
      }

      feedbackUploading.value = true;
      feedbackUploadProgress.value = 0;
      feedbackUploadError.value = '';

      try {
        // 创建FormData对象
        const formData = new FormData();
        formData.append('feedback', feedbackFile.value);

        // 实际API调用（取消注释使用）
        /*
        const response = await axios.post('/api/upload_feedback', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          onUploadProgress: (progressEvent) => {
            feedbackUploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          }
        });

        if (response.status === 200) {
          alert('反馈上传成功');
          showFeedbackUploadModal.value = false;
          fetchStudentQuestions(); // 刷新问题列表
        } else {
          feedbackUploadError.value = '上传失败: ' + response.data.message;
        }
        */

        // 模拟上传进度
        const uploadInterval = setInterval(() => {
          feedbackUploadProgress.value += 10;
          if (feedbackUploadProgress.value >= 100) {
            clearInterval(uploadInterval);
            setTimeout(() => {
              alert('反馈上传成功');
              showFeedbackUploadModal.value = false;
              // 更新已回答状态
              studentQuestions.value.forEach(q => q.answered = true);
              feedbackUploading.value = false;
            }, 500);
          }
        }, 300);
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
    };

    // 获取文件类型名称
    const getFileTypeName = (fileType) => {
      const typeMap = {
        'policy': '政策文件',
        'regulation': '规章制度',
        'manual': '操作手册',
        'faq': '常见问题',
        'report': '报告文档',
        'other': '其他'
      };
      return typeMap[fileType] || '未知类型';
    };

    // 获取Agent类型名称
    const getAgentTypeName = (agentType) => {
      const typeMap = {
        'general': '通用助手',
        'ideological': '思政助手',
        'regional': '区域研究助手',
        'china-arab': '中阿助手',
        'digital-human': '数字人文助手'
      };
      return typeMap[agentType] || '未知助手';
    };

    // 格式化文件大小
    const formatFileSize = (size) => {
      if (size < 1024) {
        return size + ' B';
      } else if (size < 1024 * 1024) {
        return (size / 1024).toFixed(2) + ' KB';
      } else if (size < 1024 * 1024 * 1024) {
        return (size / (1024 * 1024)).toFixed(2) + ' MB';
      } else {
        return (size / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
      }
    };

    // 格式化日期
    const formatDate = (date) => {
      if (!date) return '';
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

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
    };

    // 上传文件
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
        // 创建FormData对象
        const formData = new FormData();
        selectedFiles.value.forEach(file => {
          formData.append('files', file);
        });
        formData.append('fileType', uploadOptions.value.fileType);
        formData.append('agentType', uploadOptions.value.agentType);

        // 实际API调用（取消注释使用）
        /*
        const response = await axios.post('/api/documents/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          onUploadProgress: (progressEvent) => {
            uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          }
        });

        if (response.status === 200) {
          alert('文件上传成功');
          showUploadModal.value = false;
          fetchDocuments(); // 刷新文档列表
        } else {
          uploadError.value = '上传失败: ' + response.data.message;
        }
        */

        // 模拟上传进度
        const uploadInterval = setInterval(() => {
          uploadProgress.value += 5;
          if (uploadProgress.value >= 100) {
            clearInterval(uploadInterval);
            setTimeout(() => {
              alert('文件上传成功');
              showUploadModal.value = false;
              // 添加上传的文件到文档列表（实际应用中应该从服务器获取最新列表）
              const newDocs = selectedFiles.value.map((file, index) => ({
                id: documents.value.length + index + 1,
                filename: file.name,
                fileType: uploadOptions.value.fileType,
                type: file.name.split('.').pop(),
                size: file.size,
                uploadDate: new Date(),
                agentType: uploadOptions.value.agentType
              }));
              documents.value = [...documents.value, ...newDocs];
              uploading.value = false;
            }, 500);
          }
        }, 200);
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
    };

    // 回答问题
    const answerQuestion = (id) => {
      if (id) {
        alert(`回答问题ID: ${id}`);
        // 实际项目中可能会打开回答界面
      }
    };

    // 切换用户状态（启用/禁用）
    const toggleUserStatus = async (id) => {
      try {
        // 找到用户
        const user = users.value.find(u => u.id === id);
        if (!user) return;

        // 切换状态
        const newStatus = user.status === 'active' ? 'blocked' : 'active';

        // 实际API调用（取消注释使用）
        /*
        await axios.patch(`/api/users/${id}/status`, {
          status: newStatus
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        */

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
      deleteDocument,
      toggleUserStatus,
      saveSettings,
      getAgentTypeName,
      getFileTypeName,
      viewDocument,
      editDocument,
      formatFileSize,
      formatDate,
      logout,
      uploadOptions,
      studentQuestions,
      downloadStudentQuestions,
      openFeedbackUploadModal,
      triggerFeedbackFileInput,
      handleFeedbackFileSelected,
      uploadFeedback,
      viewQuestion,
      answerQuestion,
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
</style>
import axios from 'axios';

// API基础URL
const API_BASE_URL = 'http://10.10.15.210:5001';

/**
 * 获取文档列表
 * @returns {Promise<Array>} 文档列表
 */
export const fetchDocuments = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/documents`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('获取文档列表失败:', error);
    return [];
  }
};

/**
 * 上传文档
 * @param {FileList} files - 要上传的文件列表
 * @param {Object} options - 上传选项
 * @param {Function} progressCallback - 进度回调函数
 * @returns {Promise<Object>} 上传结果
 */
export const uploadDocuments = async (files, options, progressCallback) => {
  try {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });
    
    // 添加额外选项
    if (options.fileType) {
      formData.append('fileType', options.fileType);
    }
    
    if (options.agentType) {
      formData.append('agentType', options.agentType);
    }

    const response = await axios.post(`${API_BASE_URL}/api/documents/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      onUploadProgress: (progressEvent) => {
        if (progressCallback) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          progressCallback(progress);
        }
      }
    });

    return response.data;
  } catch (error) {
    console.error('上传文档失败:', error);
    throw error;
  }
};

/**
 * 删除文档
 * @param {number} documentId - 要删除的文档ID
 * @returns {Promise<void>}
 */
export const deleteDocument = async (documentId) => {
  try {
    await axios.delete(`${API_BASE_URL}/api/documents/${documentId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
  } catch (error) {
    console.error('删除文档失败:', error);
    throw error;
  }
};

/**
 * 获取学生问题列表
 * @returns {Promise<Array>} 学生问题列表
 */
export const fetchStudentQuestions = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/questions`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    // 处理返回的数据，key 为问题的 base64 编码
    const questions = response.data.questions || [];
    
    // 把 base64 编码的 key 解码为实际问题内容
    return questions.map(q => {
      // 解码 base64 获取问题内容
      let content = '';
      try {
        content = atob(q.key);
      } catch (decodeError) {
        console.error('Base64 解码失败:', decodeError);
        content = '内容解码失败';
      }
      
      return {
        id: q.id,
        studentId: q.upload_userid || 'unknown',
        content: content,
        createdAt: new Date(),
        answered: false,
        mode: q.mode
      };
    });
  } catch (error) {
    console.error('获取学生问题失败:', error);
    return [];
  }
};

/**
 * 下载学生问题
 * @returns {Promise<Blob>} 下载的文件Blob
 */
export const downloadStudentQuestions = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/download_questions`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('下载学生问题失败:', error);
    throw error;
  }
};

/**
 * 上传学生反馈
 * @param {File} file - 反馈文件
 * @param {Function} progressCallback - 进度回调
 * @returns {Promise<Object>} 上传结果
 */
export const uploadFeedback = async (file, progressCallback) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(`${API_BASE_URL}/api/feedback/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      onUploadProgress: (progressEvent) => {
        if (progressCallback) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          progressCallback(progress);
        }
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('上传反馈文件失败:', error);
    throw error;
  }
};

/**
 * 获取用户列表
 * @returns {Promise<Array>} 用户列表
 */
export const fetchUsers = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/users`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return [];
  }
};

/**
 * 切换用户状态
 * @param {number} userId - 用户ID
 * @param {string} status - 新状态
 * @returns {Promise<Object>} 操作结果
 */
export const toggleUserStatus = async (userId, status) => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/api/users/${userId}/status`, {
      status: status
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('切换用户状态失败:', error);
    throw error;
  }
};

/**
 * 获取系统设置
 * @returns {Promise<Object>} 系统设置
 */
export const fetchSettings = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/settings`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('获取系统设置失败:', error);
    return {
      systemName: '海棠校园问答系统',
      welcomeMessage: '你好！我是棠心问答AI辅导员，随时为你提供帮助～'
    };
  }
};

/**
 * 保存系统设置
 * @param {Object} settings - 系统设置
 * @returns {Promise<Object>} 保存结果
 */
export const saveSettings = async (settings) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/settings`, settings, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('保存系统设置失败:', error);
    throw error;
  }
};

import axios from 'axios';

// API基础URL
// const API_BASE_URL = 'http://localhost:5000';
const API_BASE_URL = 'http://10.10.15.211:5000';
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
    return response.data;  } catch (error) {
    console.error('获取文档列表失败:', error);
    // 网络错误时返回模拟数据
    console.log('使用模拟文档数据...');
    return getSimulatedDocuments();
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
 * Base64解码工具函数
 * @param {string} str - 需要解码的base64字符串
 * @returns {string} 解码后的字符串
 */
export const decodeBase64 = (str) => {
  try {
    return atob(str);
  } catch (error) {
    console.error('Base64解码失败:', error);
    return str; // 如果解码失败，返回原字符串
  }
};

/**
 * 获取文件类型名称
 * @param {string} fileType - 文件类型代码
 * @returns {string} 文件类型中文名称
 */
export const getFileTypeName = (fileType) => {
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

/**
 * 获取Agent类型名称
 * @param {string} agentType - Agent类型代码
 * @returns {string} Agent类型中文名称
 */
export const getAgentTypeName = (agentType) => {
  const typeMap = {
    'general': '通用助手',
    'ideological': '思政助手',
    'regional': '区域研究助手',
    'china-arab': '中阿助手',
    'digital-human': '数字人文助手'
  };
  return typeMap[agentType] || '未知助手';
};

/**
 * 格式化文件大小
 * @param {number} size - 文件大小（字节）
 * @returns {string} 格式化后的文件大小
 */
export const formatFileSize = (size) => {
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

/**
 * 格式化日期
 * @param {Date|string} date - 日期对象或字符串
 * @returns {string} 格式化后的日期字符串
 */
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};



/**
 * 审核问题
 * @param {number} questionId - 问题ID
 * @param {Object} questionData - 问题的完整数据（包含question, answer等字段）
 * @returns {Promise<Object>} 审核结果
 */
export const approveQuestion = async (questionId, questionData = null) => {
  try {
    console.log(`审核问题ID: ${questionId}`, questionData);
    
    // 构建请求数据 - 包含问题内容和状态
    const requestData = {
      status: "reviewed"
    };
    
    // 如果提供了问题数据，包含问题和答案内容
    if (questionData) {
      if (questionData.question) {
        requestData.question = questionData.question;
      }
      if (questionData.answer) {
        requestData.answer = questionData.answer;
      }
      // userid是必需字段，确保包含
      if (questionData.userid) {
        requestData.userid = questionData.userid;
      } else {
        // 如果没有userid，使用默认值
        requestData.userid = "admin";
      }
    } else {
      // 如果没有提供问题数据，使用默认userid
      requestData.userid = "admin";
    }
    
    console.log('发送的审核数据:', requestData);
    
    // 发送PUT请求到/api/update端点
    const response = await axios.put(`${API_BASE_URL}/api/update/${questionId}`, requestData, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    console.log('审核问题响应:', response.status, response.statusText);
    console.log('响应数据:', response.data);
    
    // 检查响应是否有效
    if (!response) {
      throw new Error('服务器响应为空');
    }
    
    // 检查后端返回的状态
    if (response.data && response.data.status === 'success') {
      console.log(`成功审核问题ID: ${questionId}`);
      return response.data;
    } else if (response.data && response.data.status === 'error') {
      // 后端返回错误状态
      const errorMessage = response.data.message || '审核失败';
      throw new Error(errorMessage);
    } else {
      // 意外的响应格式
      console.warn('意外的响应格式:', response.data);
      return response.data || response;
    }
    
  } catch (error) {
    console.error('审核问题失败:', error);
    
    // 提供更详细的错误信息
    if (error.response) {
      // 服务器返回了错误响应
      console.error('服务器错误响应:', error.response.status, error.response.data);
      
      // 处理不同的HTTP状态码
      if (error.response.status === 404) {
        throw new Error('问题不存在');
      } else if (error.response.status === 503) {
        throw new Error('服务暂时不可用，请稍后重试');
      } else if (error.response.status === 504) {
        throw new Error('请求超时，请稍后重试');
      } else {
        const errorMessage = (error.response.data && error.response.data.message) ? 
          error.response.data.message : '未知错误';
        throw new Error(`服务器错误: ${error.response.status} - ${errorMessage}`);
      }
    } else if (error.request) {
      // 请求发送了但没有收到响应
      console.error('网络错误，没有收到响应:', error.request);
      throw new Error('网络错误，无法连接到服务器');
    } else {
      // 其他错误
      console.error('请求配置错误:', error.message);
      throw new Error(`请求错误: ${error.message}`);
    }
  }
};

/**
 * 编辑问题答案
 * @param {number} questionId - 问题ID
 * @param {Object} updateData - 更新数据
 * @returns {Promise<Object>} 编辑结果
 */
export const updateQuestionAnswer = async (questionId, updateData) => {
  try {
    console.log(`编辑问题ID: ${questionId}`, updateData);
    
    // 确保包含userid字段（目标API要求）
    if (!updateData.userid) {
      updateData.userid = "admin"; // 如果没有userid，使用默认值
    }
    
    console.log('发送的更新数据:', updateData);
    
    const response = await axios.put(`${API_BASE_URL}/api/update/${questionId}`, updateData, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    console.log('编辑问题响应:', response.status, response.statusText);
    console.log('响应数据:', response.data);
    
    // 检查响应是否有效
    if (!response) {
      throw new Error('服务器响应为空');
    }
    
    // 检查后端返回的状态
    if (response.data && response.data.status === 'success') {
      console.log(`成功编辑问题ID: ${questionId}`);
      return response.data;
    } else if (response.data && response.data.status === 'error') {
      // 后端返回错误状态
      const errorMessage = response.data.message || '编辑失败';
      throw new Error(errorMessage);
    } else {
      // 意外的响应格式
      console.warn('意外的响应格式:', response.data);
      return response.data || response;
    }
    
  } catch (error) {
    console.error('编辑问题失败:', error);
    
    // 提供更详细的错误信息
    if (error.response) {
      // 服务器返回了错误响应
      console.error('服务器错误响应:', error.response.status, error.response.data);
      
      // 处理不同的HTTP状态码
      if (error.response.status === 404) {
        throw new Error('问题不存在');
      } else if (error.response.status === 503) {
        throw new Error('服务暂时不可用，请稍后重试');
      } else if (error.response.status === 504) {
        throw new Error('请求超时，请稍后重试');
      } else {
        const errorMessage = (error.response.data && error.response.data.message) ? 
          error.response.data.message : '未知错误';
        throw new Error(`服务器错误: ${error.response.status} - ${errorMessage}`);
      }
    } else if (error.request) {
      // 请求发送了但没有收到响应
      console.error('网络错误，没有收到响应:', error.request);
      throw new Error('网络错误，无法连接到服务器');
    } else {
      // 其他错误
      console.error('请求配置错误:', error.message);
      throw new Error(`请求错误: ${error.message}`);
    }
  }
};

/**
 * 获取模拟文档数据
 * @returns {Array} 模拟文档数据
 */
export const getSimulatedDocuments = () => {
  return [
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
};

/**
 * 获取模拟用户数据
 * @returns {Array} 模拟用户数据
 */
export const getSimulatedUsers = () => {
  return [
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
    return response.data;  } catch (error) {
    console.error('获取用户列表失败:', error);
    // 网络错误时返回模拟数据
    console.log('使用模拟用户数据...');
    return getSimulatedUsers();
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




/**
 * 获取校园共建问题列表（替代原有的学生问题接口）
 * @returns {Promise<Array>} 校园共建问题列表
 */
export const fetchCampusQuestions = async () => {
  try {
    console.log('开始获取校园共建问题...');
    
    const response = await axios.get(`${API_BASE_URL}/api/questions`);
    
    console.log('校园共建问题API响应:', response);
    console.log('响应状态:', response ? response.status : 'undefined');
    console.log('响应数据:', response ? response.data : 'undefined');
    
    // 检查响应是否存在
    if (!response) {
      console.warn('响应对象为空，使用模拟数据');
      return getSimulatedCampusQuestions();
    }
    
    // 检查响应数据是否存在
    if (!response.data) {
      console.warn('响应数据为空，使用模拟数据');
      return getSimulatedCampusQuestions();
    }
    
    let questionItems = [];
    
    // 处理新的API响应格式：{ status: "success", qas: [...], pagination: {...} }
    if (response.data.status === 'success' && response.data.qas && Array.isArray(response.data.qas)) {
      questionItems = response.data.qas;
      console.log('使用标准questions API响应格式');
    }
    // 兼容旧格式
    else if (Array.isArray(response.data)) {
      questionItems = response.data;
      console.log('使用数组格式响应');
    } 
    else if (response.data.data && Array.isArray(response.data.data)) {
      questionItems = response.data.data;
      console.log('使用data字段数组格式');
    } 
    else if (response.data.questions && Array.isArray(response.data.questions)) {
      questionItems = response.data.questions;
      console.log('使用questions字段数组格式');
    } 
    else {
      console.warn('API响应数据格式不正确，使用模拟数据');
      console.log('响应数据结构:', response.data);
      return getSimulatedCampusQuestions();
    }
    
    if (questionItems.length === 0) {
      console.log('未获取到校园共建问题，返回空列表。');
      return [];
    }
    
    console.log('从API获取到的问题数量:', questionItems.length);
    console.log('第一条问题示例:', questionItems[0]);
    
    // 处理校园共建问题数据
    const campusQuestions = questionItems.map(item => ({
      id: item.id,
      question: item.question,
      answer: item.answer,
      userid: item.userid,
      status: item.status
    }));
    
    console.log('处理后的校园共建问题:', campusQuestions);
    return campusQuestions;
    
  } catch (error) {
    console.error('获取校园共建问题失败:', error);
    
    // 提供更详细的错误信息
    if (error.response) {
      console.error('服务器响应错误:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('网络请求失败:', error.request);
    } else {
      console.error('请求配置错误:', error.message);
    }
    
    console.log('使用模拟校园共建问题数据...');
    return getSimulatedCampusQuestions();
  }
};

/**
 * 获取模拟校园共建问题数据
 * @returns {Array} 模拟校园共建问题数据
 */
export const getSimulatedCampusQuestions = () => {
  return [
    {
      id: 1,
      question: '学校的课程安排如何？',
      answer: '学校提供多样化的课程安排，包括核心课程、选修课程和实践课程，具体安排请查看教务系统。',
      userid: 1001,
      status: 'reviewed'
    },
    {
      id: 2,
      question: '如何申请奖学金？',
      answer: '奖学金申请需要满足一定的学术成绩和综合表现要求，详细信息请查看学生手册第五章。',
      userid: 1002,
      status: 'pending'
    },
    {
      id: 3,
      question: '图书馆的开放时间是什么？',
      answer: '图书馆周一至周日8:00-22:00开放，节假日开放时间请关注图书馆官方通知。',
      userid: 1003,
      status: 'reviewed'
    },
    {
      id: 4,
      question: '如何申请宿舍调换？',
      answer: '宿舍调换需要填写申请表并提供相关证明材料，请联系宿舍管理中心办理。',
      userid: 1004,
      status: 'pending'
    },
    {
      id: 5,
      question: '学校的社团活动有哪些？',
      answer: '学校有文艺社团、体育社团、学术社团等多种类型，具体信息请查看学生活动中心发布的社团招新信息。',
      userid: 1005,
      status: 'reviewed'
    }
  ];
};

/**
 * 删除校园共建问题
 * @param {number} questionId - 要删除的问题ID
 * @returns {Promise<Object>} 删除结果
 */
export const deleteCampusQuestion = async (questionId) => {
  try {
    console.log(`删除校园共建问题ID: ${questionId}`);
    
    const response = await axios.delete(`${API_BASE_URL}/api/delete/${questionId}`);
    
    console.log('删除问题响应:', response.status, response.statusText);
    console.log('响应数据:', response.data);
    
    // 检查响应是否有效
    if (!response) {
      throw new Error('服务器响应为空');
    }
    
    // 检查后端返回的状态
    if (response.data && response.data.status === 'success') {
      console.log(`成功删除问题ID: ${questionId}`);
      return response.data;
    } else if (response.data && response.data.status === 'error') {
      // 后端返回错误状态
      const errorMessage = response.data.message || '删除失败';
      throw new Error(errorMessage);
    } else {
      // 意外的响应格式
      console.warn('意外的响应格式:', response.data);
      return response.data || response;
    }
    
  } catch (error) {
    console.error('删除校园共建问题失败:', error);
    
    // 提供更详细的错误信息
    if (error.response) {
      // 服务器返回了错误响应
      console.error('服务器错误响应:', error.response.status, error.response.data);
      
      // 处理不同的HTTP状态码
      if (error.response.status === 404) {
        throw new Error('问题不存在');
      } else if (error.response.status === 503) {
        throw new Error('服务暂时不可用，请稍后重试');
      } else if (error.response.status === 504) {
        throw new Error('请求超时，请稍后重试');
      } else {
        const errorMessage = error.response.data && error.response.data.message ? 
          error.response.data.message : '未知错误';
        throw new Error(`服务器错误: ${error.response.status} - ${errorMessage}`);
      }
    } else if (error.request) {
      // 请求发送了但没有收到响应
      console.error('网络错误，没有收到响应:', error.request);
      throw new Error('网络错误，无法连接到服务器');
    } else {
      // 其他错误
      console.error('请求配置错误:', error.message);
      throw new Error(`请求错误: ${error.message}`);
    }
  }
};

/**
 * 批量删除校园共建问题
 * @param {Array<number>} questionIds - 要删除的问题ID数组
 * @returns {Promise<Object>} 批量删除结果
 */
export const deleteCampusQuestionsBatch = async (questionIds) => {
  try {
    console.log(`批量删除校园共建问题IDs: ${questionIds.join(', ')}`);
    
    // 由于后端没有批量删除接口，我们通过循环调用单个删除接口来实现
    const deletePromises = questionIds.map(async (questionId) => {
      try {
        const response = await axios.delete(`${API_BASE_URL}/api/delete/${questionId}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });        return {
          id: questionId,
          success: true,
          status: (response.data && response.data.status) || 'success',
          message: (response.data && response.data.message) || '删除成功'
        };
      } catch (error) {
        console.error(`删除问题ID ${questionId} 失败:`, error.message);        return {
          id: questionId,
          success: false,
          status: 'error',
          message: (error.response && error.response.data && error.response.data.message) || error.message || '删除失败'
        };
      }
    });
    
    // 等待所有删除操作完成
    const results = await Promise.all(deletePromises);
    
    // 统计成功和失败的数量
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.length - successCount;
    
    console.log(`批量删除完成: ${successCount} 个成功, ${failedCount} 个失败`);
    
    // 返回批量操作结果
    const batchResult = {
      status: failedCount === 0 ? 'success' : (successCount === 0 ? 'error' : 'partial'),
      total: questionIds.length,
      successCount: successCount,
      failedCount: failedCount,
      results: results,
      message: failedCount === 0 ? 
        `成功删除 ${successCount} 个问题` : 
        `删除完成: ${successCount} 个成功, ${failedCount} 个失败`
    };
    
    return batchResult;
    
  } catch (error) {
    console.error('批量删除校园共建问题失败:', error);
    
    // 提供更详细的错误信息
    if (error.response) {
      // 服务器返回了错误响应
      console.error('服务器错误响应:', error.response.status, error.response.data);
      const errorMessage = error.response.data && error.response.data.message ? 
        error.response.data.message : '未知错误';
      throw new Error(`服务器错误: ${error.response.status} - ${errorMessage}`);
    } else if (error.request) {
      // 请求发送了但没有收到响应
      console.error('网络错误，没有收到响应:', error.request);
      throw new Error('网络错误，无法连接到服务器');
    } else {
      // 其他错误
      console.error('请求配置错误:', error.message);
      throw new Error(`请求错误: ${error.message}`);
    }
  }
};

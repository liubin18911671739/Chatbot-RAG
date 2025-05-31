import axios from 'axios';

// API基础URL
const API_BASE_URL = 'http://localhost:5000';

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
 * 获取模拟学生问题数据
 * @returns {Array} 模拟问题数据
 */
export const getSimulatedStudentQuestions = () => {
  return [
    {
      id: 1,
      studentId: '20250101',
      content: '如何申请奖学金？需要准备哪些材料？',
      createdAt: new Date(2025, 3, 20, 10, 15),
      answered: true,
      isReviewed: true
    },
    {
      id: 2,
      studentId: '20250102',
      content: '学校图书馆开放时间是什么时候？寒暑假期间是否开放？',
      createdAt: new Date(2025, 3, 21, 14, 30),
      answered: false,
      isReviewed: false
    },
    {
      id: 3,
      studentId: '20250103',
      content: '如何预约心理咨询？是否需要提前多久预约？',
      createdAt: new Date(2025, 3, 22, 9, 45),
      answered: false,
      isReviewed: false
    }
  ];
};

/**
 * 审核问题
 * @param {number} questionId - 问题ID
 * @returns {Promise<Object>} 审核结果
 */
export const approveQuestion = async (questionId) => {
  try {
    console.log(`审核问题ID: ${questionId}`);
    
    // 发送PUT请求到/api/update端点，只更新status字段
    const response = await axios.put(`${API_BASE_URL}/api/update/${questionId}`, {
      status: "reviewed"
    }, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    // 检查响应是否有效
    if (!response) {
      throw new Error('服务器响应为空');
    }
    
    console.log('审核响应:', response);
    
    // 返回响应数据，如果没有data字段则返回整个响应
    return response.data || response;  } catch (error) {
    console.error('审核问题失败:', error);
    
    // 提供更详细的错误信息
    if (error.response) {
      // 服务器返回了错误响应
      console.error('服务器错误响应:', error.response.status, error.response.data);
      const errorMessage = error.response.data && error.response.data.message ? error.response.data.message : '未知错误';
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

// 假设 BASE_URL 和 id 已经在 JavaScript 中定义好了
// const API_BASE_URL = "http://your-api-base-url.com"; // 替换为你的 API 基础 URL
let id = 0; // 假设 id 的初始值为 0，与 Python 代码中的 id+1 对应

async function deleteData(itemId) {
  try {
    const response = await fetch(`${API_BASE_URL}/delete/${itemId}`, {
      method: 'DELETE', // 指定 HTTP 方法为 DELETE
      headers: {
        'Content-Type': 'application/json', // 可选，根据你的 API 要求添加
        // 如果你的 API 需要认证，在这里添加认证头，例如：
        // 'Authorization': 'Bearer your_token_here'
      }
    });

    if (!response.ok) {
      // 如果响应状态不是 2xx (例如 404, 500), 则抛出错误
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || 'Unknown error'}`);
    }

    const result = await response.json(); // 解析 JSON 响应
    console.log("删除结果:", result);
    return result;

  } catch (error) {
    console.error("调用 API 时出错:", error);
    // 在这里处理错误，例如向用户显示消息
    return null; // 或抛出错误，或返回一个特定的错误对象
  }
}

// 调用示例：
// 假设你想删除 id 为 1 的项 (对应 Python 代码中的 id+1，如果 Python 中的 id 是 0)
// deleteData(id + 1);

// 或者如果你想删除特定 ID 的资源：
// const specificIdToDelete = 5;
// deleteData(specificIdToDelete);

// 假设 BASE_URL 已经在 JavaScript 中定义好了

async function insertData(keyString, valueString, userId, isAdmin) {
  try {
    // 在 JavaScript 中进行 Base64 编码
    // btoa() 直接处理字符串，所以不需要像 Python 中先 .encode()
    const encodedKey = btoa(keyString);
    const encodedValue = btoa(valueString);

    const payload = {
      key: encodedKey,
      value: encodedValue,
      upload_userid: userId,
      is_admin: isAdmin
    };

    const response = await fetch(`${API_BASE_URL}/insert`, {
      method: 'POST', // 指定 HTTP 方法为 POST
      headers: {
        'Content-Type': 'application/json', // 表明我们发送的是 JSON 数据
        // 如果你的 API 需要认证，在这里添加认证头，例如：
        // 'Authorization': 'Bearer your_token_here'
      },
      body: JSON.stringify(payload) // 将 JavaScript 对象转换为 JSON 字符串
    });

    if (!response.ok) {
      // 如果响应状态不是 2xx (例如 400, 500), 则抛出错误
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || 'Unknown error'}`);
    }

    const result = await response.json(); // 解析 JSON 响应
    console.log("插入普通问答:", result);
    return result;

  } catch (error) {
    console.error("调用 API 时出错:", error);
    // 在这里处理错误，例如向用户显示消息
    return null; // 或抛出错误，或返回一个特定的错误对象
  }
}


// simulateGetIdAndThenUpdate(); // 如果想运行这个模拟场景，取消注释

/**
 * 获取学生未审核的问题列表
 * @returns {Promise<Array>} 学生未审核问题列表
 */
export const fetchStudentQuestions = async () => {
  try {
    console.log('开始获取学生未审核问题...'); // Clarified: fetching unreviewed questions

    // The Python snippet implies /pending returns unreviewed questions.
    // response = requests.get(f"{BASE_URL}/pending")
    const response = await axios.get(`${API_BASE_URL}/api/pending`);

    console.log('API响应:', response && response.data);

    // Check if response and response.data are valid
    if (!response || !response.data) {
      console.warn('API响应无效或无数据，使用模拟数据');
      return getSimulatedStudentQuestions();
    }

    let questionItems = [];
    // Determine the source of the question items array from the response data
    if (Array.isArray(response.data)) {
      questionItems = response.data;
    } else if (response.data.questions && Array.isArray(response.data.questions)) {
      // Handles responses like { "questions": [...] }
      questionItems = response.data.questions;
    } else {
      console.warn('API响应数据格式不正确 (既不是数组，也没有 questions 数组)，使用模拟数据');
      return getSimulatedStudentQuestions();
    }

    if (questionItems.length === 0) {
      console.log('未获取到未审核问题，返回空列表。');
      return [];
    }

    // Process the question items.
    // Since these are from the "/pending" endpoint, they are all unreviewed.
    const unreviewedQuestions = questionItems.map(item => ({
      id: item.id,
      studentId: item.upload_userid || '未知用户',
      content: decodeBase64(item.key), // Assuming decodeBase64 function is available
      createdAt: item.created_at ? new Date(item.created_at) : new Date(),
      answered: false, // All questions from /pending are unreviewed, hence not yet answered by admin
      isReviewed: false, // All questions from /pending are unreviewed
      rawData: item // Save original data for debugging or other uses
    }));

    // Filter out any potentially invalid data
    const validQuestions = unreviewedQuestions.filter(q =>
      q && typeof q === 'object' &&
      q.id && // Ensure id is present
      q.content !== null && q.content !== undefined && // Ensure content is present (even if empty string)
      q.studentId // Ensure studentId is present
    );

    console.log('处理后的未审核学生问题:', validQuestions);
    return validQuestions;

  } catch (error) {
    console.error('获取学生未审核问题失败:', error);

    // Network error or other issues, use mock data as a fallback
    console.log('使用模拟学生问题数据...');
    return getSimulatedStudentQuestions();
  }
};

/**
 * 获取校园共建问题列表（替代原有的学生问题接口）
 * @returns {Promise<Array>} 校园共建问题列表
 */
export const fetchCampusQuestions = async () => {  try {
    console.log('开始获取校园共建问题...');
    
    const response = await axios.get(`${API_BASE_URL}/api/questions`);
    
    console.log('校园共建问题API响应:', response && response.data);
    console.log('响应数据类型:', typeof response.data);
    console.log('响应数据结构:', response.data);
    
    if (!response || !response.data) {
      console.warn('API响应无效或无数据，使用模拟数据');
      return getSimulatedCampusQuestions();
    }
      let questionItems = [];
    if (Array.isArray(response.data)) {
      questionItems = response.data;
    } else if (response.data.data && Array.isArray(response.data.data)) {
      // 处理 {data: Array, message: '', status: '', total: N} 格式的响应
      questionItems = response.data.data;
    } else if (response.data.questions && Array.isArray(response.data.questions)) {
      questionItems = response.data.questions;
    } else {
      console.warn('API响应数据格式不正确，使用模拟数据');
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
    console.log('使用模拟校园共建问题数据...');
    return getSimulatedCampusQuestions();
  }
};

/**
 * 获取模拟的校园共建问题数据
 * @returns {Array} 模拟的校园共建问题列表
 */
const getSimulatedCampusQuestions = () => {
  return [
    {
      id: 1,
      question: "问题密集书库的图书可以外借吗",
      answer: "问题密集书库的图书一般不允许外借，主要用于现场阅读和学习。",
      userid: "user1",
      status: "reviewed"
    },
    {
      id: 2,
      question: "借阅图书遗失如何处理？",
      answer: "如果借阅的图书遗失，请及时联系图书馆工作人员进行处理，可能需要赔偿或补办手续。",
      userid: "user2",
      status: "reviewed"
    },
    {
      id: 3,
      question: "借的书在哪儿还？",
      answer: "请将借阅的图书归还到图书馆的指定还书地点。",
      userid: "user3",
      status: "unreview"
    }  ];
};


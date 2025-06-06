import axios from 'axios';
const API_BASE_URL = 'http://10.10.15.211:5000';

// const API_BASE_URL = 'http://localhost:5000';
// 创建带超时配置的axios实例
const api = axios.create({
  timeout: 600000, // 设置所有请求的默认超时时间为600秒
  // retry: 1, // 最大重试次数
  // retryDelay: 1000 // 重试间隔时间
});

// 添加请求拦截器
api.interceptors.request.use(function (config) {
  return config;
}, function (error) {
  return Promise.reject(error);
});

// 添加响应拦截器，处理超时和其他错误
api.interceptors.response.use(null, async function (error) {
  const config = error.config;

  // 如果是超时错误
  if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
    console.log('请求超时，准备重试...');
  }

  // 如果请求没有重试配置或已达最大重试次数，则拒绝
  if (!config || !config.retry || config._retryCount >= config.retry) {
    return Promise.reject(error);
  }

  // 增加重试计数
  config._retryCount = config._retryCount || 0;
  config._retryCount++;

  // 创建新的Promise来处理重试延迟
  const delayRetry = new Promise(resolve => {
    setTimeout(() => {
      console.log(`正在进行第 ${config._retryCount} 次重试...`);
      resolve();
    }, config.retryDelay || 1000);
  });

  // 等待延迟后重新发送请求
  await delayRetry;
  return api(config);
});

class ChatService {
  constructor() {
    // 初始化对话历史数组，用于存储最近的三轮对话
    this.conversationHistory = [];
  }

  async checkApiConnection() {
    try {
      console.log('正在检查API连接...');
      // 先尝试greeting端点
    const response = await axios.get(`${API_BASE_URL}/api/greeting`);
      console.log('API连接成功:', response.status, response.data);
      return true;
    } catch (error) {
      console.error('API连接失败详情:', error);

      // 提供详细的错误信息以便调试
      if (error.response) {
        // 服务器返回了非2xx响应
        console.error(`服务器返回错误码: ${error.response.status}`);
        console.error('响应数据:', error.response.data);
      } else if (error.request) {
        // 请求已发送但没有收到响应
        console.error('未收到服务器响应，可能API服务未运行或网络问题');
        console.error('请求详情:', error.request);
      } else {
        // 请求设置有问题
        console.error('请求设置错误:', error.message);
      }

      // 尝试备用健康检查端点
      // try {
      //   console.log('尝试备用API健康检查...');
      //   const healthResponse = await api.get('/api/health');
      //   console.log('备用API连接成功:', healthResponse.status);
      //   return true;
      // } catch (healthError) {
      //   console.error('备用API连接也失败');
      //   return false;
      // }
    }
  }
  async sendChatMessage(prompt, sceneId = null, abortController = null, retryCount = 0) {
    const maxRetries = 5;
    
    try {
      const payload = { prompt };
      if (sceneId) {
        payload.scene_id = sceneId;
      }

      // 设置请求配置，包括取消信号
      const requestConfig = {
        timeout: 60000, // 60秒超时
      };
      
      if (abortController) {
        requestConfig.signal = abortController.signal;
      }

      const response = await axios.post(`${API_BASE_URL}/api/chat`, payload, requestConfig);

      // 检查响应是否有效
      if (response.data && response.data.response) {
        // 使用正则表达式去除<深度思考>标签及其内容
        response.data.response = response.data.response.replace(/<深度思考>[\s\S]*?<\/深度思考>/g, '');

        // 格式化响应，使其更像ChatGPT的格式（去除多余空行，优化段落间距）
        response.data.response = response.data.response
          .replace(/\n{3,}/g, '\n\n') // 将3个及以上连续换行符替换为2个
          .trim(); // 去除首尾空白
        
        return response.data;
      } else {
        // 响应格式不正确，需要重试
        console.warn(`第${retryCount + 1}次请求响应格式不正确，response.data:`, response.data);
        
        if (retryCount < maxRetries - 1) {
          console.log(`响应格式不正确，准备进行第${retryCount + 2}次重试...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // 递增延迟
          return this.sendChatMessage(prompt, sceneId, abortController, retryCount + 1);
        } else {
          throw new Error('服务器响应超时，稍后再试...');
        }
      }
    } catch (error) {
      // 如果是用户取消的请求，直接抛出错误
      if (error.name === 'AbortError' || error.name === 'CanceledError') {
        throw error;
      }

      console.error(`第${retryCount + 1}次发送聊天消息失败:`, error);
      
      // 如果还有重试次数，进行重试
      if (retryCount < maxRetries - 1) {
        console.log(`第${retryCount + 1}次请求失败，准备进行第${retryCount + 2}次重试...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // 递增延迟
        return this.sendChatMessage(prompt, sceneId, abortController, retryCount + 1);
      }
      
      // 所有重试都失败了，返回默认错误消息
      if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
        throw new Error('服务器响应超时，稍后再试...');
      } else if (!error.response) {
        throw new Error('服务器响应超时，稍后再试...');
      } else {
        throw new Error('服务器响应超时，稍后再试...');
      }
    }
  }

  // 清除对话历史
  clearConversationHistory() {
    this.conversationHistory = [];
    return true;
  }

  // 获取当前对话历史
  getConversationHistory() {
    return [...this.conversationHistory]; // 返回副本以防止外部修改
  }

  async getScenes() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/scenes`);
      return response.data;
    } catch (error) {
      console.error('获取场景列表失败:', error);
      throw error;
    }
  }

  async sendFeedback(feedbackData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/feedback`, feedbackData);
      return response.data;
    } catch (error) {
      console.error('发送反馈失败:', error);
      throw error;
    }
  }

  async getGreeting() {
    try {
    const response = await axios.get(`${API_BASE_URL}/api/greeting`);
      return response;
    } catch (error) {
      console.error('获取欢迎消息失败:', error);
      return { data: { greeting: '你好！我是棠心问答AI辅导员，随时为你提供帮助～可以解答思想困惑、学业指导、心理调适等成长问题，也能推荐校园资源。请随时告诉我你的需求，我会用AI智慧陪伴你成长！✨' } };
    }
}

// 实际调用 API 的函数
async fetchSuggestions() {
  try {
    console.log('🚀 正在调用实际 API...\n');
    // console.log('📍 目标地址:', 'http://10.10.15.210:5001/api/suggestions');
    console.log('📍 目标地址:', 'API_BASE_URL/api/suggestions');

    
    const response = await axios.get(`${API_BASE_URL}/api/suggestions`);


    console.log('✅ API 调用成功');
    console.log('响应状态:', response.status);
    console.log('响应数据结构:', response.data ? Object.keys(response.data) : 'undefined');
    
    // 提取 suggestions
    const Suggestions = extractSuggestions(response.data || {});
    return Suggestions;
    
  } catch (error) {
    console.error('❌ API 调用失败:', error.message);
    
    // 详细错误信息
    if (error.code === 'ECONNABORTED') {
      console.error('⏰ 请求超时 - 服务器响应时间过长');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🚫 连接被拒绝 - 服务器可能未启动');
    } else if (error.code === 'ENOTFOUND') {
      console.error('🔍 域名解析失败 - 检查网络连接或服务器地址');
    } else if (error.response) {
      console.error('📡 服务器响应错误:');
      console.error('   状态码:', error.response.status);
      console.error('   响应数据:', error.response.data);
    } else if (error.request) {
      console.error('📤 请求发送失败 - 网络连接问题');
    }
    
    console.log('\n🔄 使用模拟数据进行演示...');
    return extractSuggestions(mockApiResponse);
  }

}
}
// 模拟API响应数据（移到类外部）
const mockApiResponse = {
  "status": "success",
  "suggestions": [
    "党政办公室综合事务的电话是多少？",
    "党政办公室综合事务的办公室是？",
    "65778005是哪个部门的电话？",
    "明德楼303是哪个部门的办公室？",
    "党政办公室党办事务的电话是多少？",
    "党政办公室党办事务的办公室是？",
    "65778315是哪个部门的电话？",
    "明德楼316是哪个部门的办公室？",
    "党政办公室发展规划的电话是多少？",
    "党政办公室发展规划的办公室是？",
    "65778312是哪个部门的电话？",
    "明德楼312是哪个部门的办公室？",
    "党政办公室法律事务的电话是多少？"
  ]
};

// 提取 suggestions 数据的函数（移到类外部）
function extractSuggestions(apiResponse) {
  console.log('🔍 提取 suggestions 数据...\n');
  
  // 检查响应格式
  if (apiResponse && apiResponse.status === 'success' && apiResponse.suggestions) {
    const Suggestions = apiResponse.suggestions;
    
    console.log('✅ 成功提取 suggestions 数据:');
    console.log('数据类型:', typeof Suggestions);
    console.log('是否为数组:', Array.isArray(Suggestions));
    console.log('数组长度:', Suggestions.length);
    console.log('\n📋 Suggestions 内容:');
    
    Suggestions.forEach((suggestion, index) => {
      console.log(`${index + 1}. ${suggestion}`);
    });
    
    return Suggestions;
  } else {
    console.log('❌ 无法提取 suggestions 数据，响应格式不正确');
    return [];
  }
}

export default new ChatService();
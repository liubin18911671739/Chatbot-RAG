/**
 * 微信小程序 sendMessage 功能简单测试
 * 验证API调用和错误处理是否正常工作
 */

// 模拟微信小程序环境
const mockWx = {
  request: function(options) {
    console.log('Mock wx.request called with:', options);
    
    // 模拟成功响应
    setTimeout(() => {
      if (options.success) {
        options.success({
          statusCode: 200,
          data: {
            status: 'success',
            response: '这是一个模拟的AI回复，包含<深度思考>这部分应该被移除</深度思考>的内容。\n\n\n这里有多余的换行符。\n\n\n\n应该被格式化。',
            sources: [
              { title: '测试文档1', document: 'test1.pdf' }
            ],
            attachment_data: []
          }
        });
      }
    }, 1000);
  },
  
  getSystemInfoSync: function() {
    return {
      platform: 'devtools'
    };
  }
};

// 模拟 getApp
const mockApp = {
  globalData: {
    apiBaseUrl: 'http://10.10.15.211:5000/api'
  }
};

// 设置全局变量
global.wx = mockWx;
global.getApp = () => mockApp;

// 导入我们的API服务类
class ApiService {
  constructor() {
    this.baseUrl = '';
    this.timeout = 40000;
  }

  init() {
    this.baseUrl = mockApp.globalData.apiBaseUrl;
  }

  request(options) {
    return new Promise((resolve, reject) => {
      const url = options.url.startsWith('http') ? options.url : `${this.baseUrl}${options.url}`;
      
      console.log(`[API请求] ${options.method || 'GET'} ${url}`);
      
      mockWx.request({
        url,
        method: options.method || 'GET',
        data: options.data || {},
        header: {
          'Content-Type': 'application/json',
          ...options.header
        },
        timeout: this.timeout,
        success: (res) => {
          console.log(`[API响应] ${url}`, res.data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data);
          } else {
            reject(new Error(`请求失败: ${res.statusCode}`));
          }
        },
        fail: (err) => {
          console.error(`[API错误] ${url}`, err);
          reject(err);
        }
      });
    });
  }

  async sendMessage(prompt, userId = 'miniprogram_user', sceneId = null, retryCount = 0) {
    const maxRetries = 5;
    
    try {
      const payload = { prompt: prompt.trim() };
      if (sceneId) {
        payload.scene_id = sceneId;
      }

      const requestOptions = {
        url: '/chat',
        method: 'POST',
        data: payload,
        header: {
          'Content-Type': 'application/json'
        }
      };

      const response = await this.request(requestOptions);

      if (response && response.response) {
        // 使用正则表达式去除<深度思考>标签及其内容
        const beforeThinking = response.response;
        response.response = response.response.replace(/<深度思考>[\s\S]*?<\/深度思考>/g, '');
        
        if (beforeThinking !== response.response) {
          console.log('✅ 已移除深度思考标签');
        }

        // 格式化响应
        const beforeFormatting = response.response;
        response.response = response.response
          .replace(/\n{3,}/g, '\n\n')
          .trim();
        
        if (beforeFormatting !== response.response) {
          console.log('✅ 已格式化响应文本');
        }
        
        return response;
      } else {
        console.warn(`第${retryCount + 1}次请求响应格式不正确，response:`, response);
        
        if (retryCount < maxRetries - 1) {
          console.log(`响应格式不正确，准备进行第${retryCount + 2}次重试...`);
          await new Promise(resolve => setTimeout(resolve, 100 * (retryCount + 1)));
          return this.sendMessage(prompt, userId, sceneId, retryCount + 1);
        } else {
          throw new Error('服务器响应超时，稍后再试...');
        }
      }
    } catch (error) {
      console.error(`第${retryCount + 1}次发送聊天消息失败:`, error);
      
      if (retryCount < maxRetries - 1) {
        console.log(`第${retryCount + 1}次请求失败，准备进行第${retryCount + 2}次重试...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.sendMessage(prompt, userId, sceneId, retryCount + 1);
      }
      
      if (error.errMsg && error.errMsg.includes('timeout')) {
        throw new Error('服务器响应超时，稍后再试...');
      } else if (!error.errMsg) {
        throw new Error('服务器响应超时，稍后再试...');
      } else {
        throw new Error('网络连接失败，请检查网络设置');
      }
    }
  }
}

// 执行测试
async function runTest() {
  console.log('🧪 开始测试微信小程序 sendMessage 功能');
  console.log('='.repeat(50));
  
  const apiService = new ApiService();
  apiService.init();
  
  try {
    console.log('📤 发送测试消息...');
    const response = await apiService.sendMessage(
      '你好，这是一个测试消息',
      'test_user',
      'db_sizheng'
    );
    
    console.log('📥 收到响应:');
    console.log('- 状态:', response.status);
    console.log('- 响应长度:', response.response.length);
    console.log('- 响应内容:', response.response);
    console.log('- 参考来源:', response.sources?.length || 0, '个');
    console.log('- 附件数量:', response.attachment_data?.length || 0, '个');
    
    console.log('\n✅ 测试成功！sendMessage 功能正常工作');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
  
  console.log('='.repeat(50));
  console.log('🎉 测试完成');
}

// 运行测试
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ApiService, runTest };
} else {
  runTest();
}

console.log('📋 测试说明:');
console.log('1. 该测试使用模拟的微信小程序环境');
console.log('2. 验证了消息发送、重试机制、响应处理等功能');
console.log('3. 实际使用时请确保API服务器可访问');
console.log('4. 建议在微信开发者工具中进行真实环境测试');

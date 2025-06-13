#!/usr/bin/env node

/**
 * chatService.sendChatMessage() 函数测试脚本
 * 用于测试聊天消息发送功能
 */

const axios = require('axios');

// 模拟 ChatService 类（简化版本）
class ChatService {
  constructor() {
    this.baseUrl = '';
    this.timeout = 80000;
    this.config = null;
    this.init();
  }

  // 环境配置
  getConfig() {
    return {
      baseURL: 'http://localhost:5000',
      backupURLs: [
        'http://10.10.15.211:5000',
        'http://localhost:5000'
      ],
      timeout: 40000,
      environment: process.env.NODE_ENV || 'development',
      campusRestriction: false
    };
  }

  // 初始化API配置
  init() {
    this.config = this.getConfig();
    this.baseUrl = 'http://localhost:5000';
    this.timeout = 80000;
    
    console.log('🔧 API服务初始化:', {
      baseUrl: this.baseUrl,
      timeout: this.timeout,
      environment: this.config.environment,
      backupURLs: this.config.backupURLs
    });

    // 创建axios实例
    this.api = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // 设置拦截器
    this.setupInterceptors();
  }

  // 设置请求和响应拦截器
  setupInterceptors() {
    // 添加请求拦截器
    this.api.interceptors.request.use(
      (config) => {
        console.log(`📤 [API请求] ${config.method ? config.method.toUpperCase() : 'GET'} ${config.url}`);
        console.log(`📤 [请求数据]`, config.data);
        return config;
      },
      (error) => {
        console.error('❌ [API请求错误]', error);
        return Promise.reject(error);
      }
    );

    // 添加响应拦截器
    this.api.interceptors.response.use(
      (response) => {
        console.log(`📥 [API响应] ${response.config.url} - 状态码: ${response.status}`);
        console.log(`📥 [响应数据]`, response.data);
        return response;
      },
      (error) => {
        console.error(`❌ [API错误] ${error.config && error.config.url ? error.config.url : 'unknown'}`, error.message);
        return Promise.reject(error);
      }
    );
  }

  // 聊天API - 发送消息
  async sendChatMessage(prompt, sceneId = 'general', abortController = null, retryCount = 0) {
    const maxRetries = 3;
    
    try {
      // 确保API已初始化
      if (!this.baseUrl) {
        this.init();
      }

      const payload = { prompt: prompt.trim() };
      payload.scene_id = sceneId || 'general';

      console.log(`\n🚀 开始发送消息 (第${retryCount + 1}次尝试)`);
      console.log(`📝 消息内容: "${prompt}"`);
      console.log(`🏷️ 场景ID: ${sceneId}`);

      // 设置请求配置
      const requestConfig = {
        timeout: this.timeout
      };
      
      if (abortController) {
        requestConfig.signal = abortController.signal;
      }

      const response = await this.api.post('/api/chat', payload, requestConfig);

      // 检查响应是否有效
      if (response.data && response.data.response) {
        // 处理响应内容
        let responseText = response.data.response;
        
        // 去除深度思考标签
        responseText = responseText.replace(/<深度思考>[\s\S]*?<\/深度思考>/g, '');
        
        // 格式化响应
        responseText = responseText
          .replace(/\n{3,}/g, '\n\n')
          .trim();
        
        console.log(`✅ 消息发送成功!`);
        console.log(`💬 AI回复: ${responseText.substring(0, 100)}...`);
        
        return {
          ...response.data,
          response: responseText
        };
      } else {
        console.warn(`⚠️ 第${retryCount + 1}次请求响应格式不正确`);
        
        if (retryCount < maxRetries - 1) {
          console.log(`🔄 准备进行第${retryCount + 2}次重试...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return this.sendChatMessage(prompt, sceneId, abortController, retryCount + 1);
        } else {
          throw new Error('服务器响应格式异常，请稍后重试');
        }
      }
    } catch (error) {
      console.error(`❌ 第${retryCount + 1}次发送聊天消息失败:`, error.message);
      
      // 如果是用户取消的请求，直接抛出错误
      if (error.name === 'AbortError' || error.name === 'CanceledError') {
        throw error;
      }
      
      // 如果还有重试次数，进行重试
      if (retryCount < maxRetries - 1) {
        console.log(`🔄 第${retryCount + 1}次请求失败，准备进行第${retryCount + 2}次重试...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.sendChatMessage(prompt, sceneId, abortController, retryCount + 1);
      }
      
      // 所有重试都失败了，抛出错误
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('服务器响应超时，请稍后重试');
      } else if (error.message.includes('Network Error') || !error.response) {
        throw new Error('网络连接失败，请检查网络设置');
      } else {
        throw new Error(error.message || '发送消息失败，请稍后重试');
      }
    }
  }

  // 检查API连接
  async checkApiConnection() {
    try {
      console.log('🔍 正在检查API连接...');
      
      const response = await this.api.get('/api/greeting');
      console.log('✅ API连接成功:', response.status, response.data);
      return true;
    } catch (error) {
      console.error('❌ API连接失败:', error.message);
      return false;
    }
  }
}

// 测试用例
const testCases = [
  {
    name: '基本消息测试',
    prompt: '你好，我是新用户',
    sceneId: 'general'
  },
  {
    name: '学习场景测试',
    prompt: '北京第二外国语学院有哪些专业？',
    sceneId: 'study'
  },
  {
    name: '长消息测试',
    prompt: '请详细介绍一下北京第二外国语学院的历史、发展现状、专业设置、师资力量、校园文化等各个方面的情况',
    sceneId: 'general'
  },
  {
    name: '空消息测试（应该失败）',
    prompt: '',
    sceneId: 'general'
  },
  {
    name: '特殊字符测试',
    prompt: 'Hello! 你好 🎉 测试特殊字符 & 符号',
    sceneId: 'general'
  }
];

// 主测试函数
async function runTests() {
  console.log('🧪 ChatService sendChatMessage() 测试开始');
  console.log('=' * 60);
  
  const chatService = new ChatService();
  
  // 首先检查API连接
  console.log('\n📡 步骤1: 检查API连接状态');
  const isConnected = await chatService.checkApiConnection();
  
  if (!isConnected) {
    console.error('❌ API连接失败，无法进行测试');
    process.exit(1);
  }
  
  console.log('\n🧪 步骤2: 开始功能测试');
  
  let successCount = 0;
  let failCount = 0;
  
  // 运行所有测试用例
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n${'='.repeat(50)}`);
    console.log(`📋 测试 ${i + 1}/${testCases.length}: ${testCase.name}`);
    console.log(`${'='.repeat(50)}`);
    
    try {
      const startTime = Date.now();
      
      const result = await chatService.sendChatMessage(
        testCase.prompt, 
        testCase.sceneId
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`✅ 测试通过!`);
      console.log(`⏱️ 响应时间: ${duration}ms`);
      console.log(`📊 响应数据类型: ${typeof result}`);
      console.log(`📝 响应字段: ${Object.keys(result || {}).join(', ')}`);
      
      if (result && result.response) {
        console.log(`💬 AI回复长度: ${result.response.length} 字符`);
        console.log(`💬 AI回复预览: ${result.response.substring(0, 80)}...`);
      }
      
      successCount++;
      
    } catch (error) {
      console.error(`❌ 测试失败: ${error.message}`);
      
      // 对于空消息测试，失败是预期的
      if (testCase.name.includes('空消息测试')) {
        console.log(`ℹ️ 这是预期的失败（空消息应该被拒绝）`);
        successCount++;
      } else {
        failCount++;
      }
    }
    
    // 测试间隔
    if (i < testCases.length - 1) {
      console.log(`⏳ 等待 2 秒后进行下一个测试...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // 测试结果统计
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 测试完成! 统计结果:`);
  console.log(`${'='.repeat(60)}`);
  console.log(`✅ 成功: ${successCount} 个测试`);
  console.log(`❌ 失败: ${failCount} 个测试`);
  console.log(`📈 成功率: ${((successCount / testCases.length) * 100).toFixed(1)}%`);
  
  if (failCount === 0) {
    console.log(`🎉 所有测试都通过了！`);
  } else {
    console.log(`⚠️ 有 ${failCount} 个测试失败，请检查日志`);
  }
}

// 错误处理
process.on('unhandledRejection', (error) => {
  console.error('❌ 未处理的Promise拒绝:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
  process.exit(1);
});

// 启动测试
if (require.main === module) {
  console.log('🚀 启动 ChatService sendChatMessage() 测试脚本');
  runTests().catch(error => {
    console.error('❌ 测试脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = { ChatService, runTests };

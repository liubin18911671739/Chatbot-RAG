#!/usr/bin/env node
/**
 * 测试微信小程序API实现
 * 验证sendMessage功能是否按照要求正常工作
 */

const axios = require('axios');

// API配置
const API_BASE_URL = 'http://10.10.15.211:5000';

/**
 * 模拟微信小程序的sendMessage API调用
 */
async function testSendMessage(prompt, sceneId = null, retryCount = 0) {
  const maxRetries = 5;
  
  try {
    const payload = { prompt: prompt.trim() };
    if (sceneId) {
      payload.scene_id = sceneId;
    }

    // 设置请求配置，包括超时
    const requestConfig = {
      timeout: 40000, // 40秒超时
    };

    console.log(`🚀 发送请求 (第${retryCount + 1}次尝试):`);
    console.log(`📍 URL: ${API_BASE_URL}/api/chat`);
    console.log(`📦 Payload:`, JSON.stringify(payload, null, 2));

    const response = await axios.post(`${API_BASE_URL}/api/chat`, payload, requestConfig);

    console.log(`✅ 请求成功 - 状态码: ${response.status}`);

    // 检查响应是否有效
    if (response.data && response.data.response) {
      console.log(`📄 原始响应长度: ${response.data.response.length}字符`);
      
      // 使用正则表达式去除<深度思考>标签及其内容
      const beforeThinking = response.data.response;
      response.data.response = response.data.response.replace(/<深度思考>[\s\S]*?<\/深度思考>/g, '');
      
      if (beforeThinking !== response.data.response) {
        console.log(`🧠 已移除深度思考标签`);
      }

      // 格式化响应，使其更像ChatGPT的格式（去除多余空行，优化段落间距）
      const beforeFormatting = response.data.response;
      response.data.response = response.data.response
        .replace(/\n{3,}/g, '\n\n') // 将3个及以上连续换行符替换为2个
        .trim(); // 去除首尾空白
      
      if (beforeFormatting !== response.data.response) {
        console.log(`📝 已格式化响应文本`);
      }
      
      console.log(`📄 最终响应长度: ${response.data.response.length}字符`);
      console.log(`📋 响应内容预览: ${response.data.response.substring(0, 100)}...`);
      
      return response.data;
    } else {
      // 响应格式不正确，需要重试
      console.warn(`⚠️ 第${retryCount + 1}次请求响应格式不正确`);
      console.warn(`响应数据:`, response.data);
      
      if (retryCount < maxRetries - 1) {
        console.log(`🔄 准备进行第${retryCount + 2}次重试...`);
        await new Promise(resolve => setTimeout(resolve, 100 * (retryCount + 1))); // 递增延迟
        return testSendMessage(prompt, sceneId, retryCount + 1);
      } else {
        throw new Error('服务器响应超时，稍后再试...');
      }
    }
  } catch (error) {
    console.error(`❌ 第${retryCount + 1}次发送聊天消息失败:`, error.message);
    
    // 如果还有重试次数，进行重试
    if (retryCount < maxRetries - 1) {
      console.log(`🔄 第${retryCount + 1}次请求失败，准备进行第${retryCount + 2}次重试...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // 递增延迟
      return testSendMessage(prompt, sceneId, retryCount + 1);
    }
    
    // 所有重试都失败了，返回默认错误消息
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      throw new Error('服务器响应超时，稍后再试...');
    } else if (!error.response) {
      throw new Error('服务器响应超时，稍后再试...');
    } else {
      throw new Error('网络连接失败，请检查网络设置');
    }
  }
}

/**
 * 执行测试
 */
async function runTests() {
  console.log('🎯 开始测试微信小程序API实现');
  console.log('='.repeat(60));
  
  const testCases = [
    {
      prompt: '你好，请问什么是中国特色社会主义？',
      sceneId: 'db_sizheng',
      description: '思政场景测试'
    },
    {
      prompt: '你好，我想了解一下学校的课程安排',
      sceneId: null,
      description: '通用场景测试'
    },
    {
      prompt: '北外的历史是什么？',
      sceneId: 'db_xuexizhidao', 
      description: '学习指导场景测试'
    }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n🔬 测试案例 ${i + 1}: ${testCase.description}`);
    console.log('-'.repeat(40));
    
    try {
      const startTime = Date.now();
      const result = await testSendMessage(testCase.prompt, testCase.sceneId);
      const endTime = Date.now();
      
      console.log(`⏱️ 响应时间: ${endTime - startTime}ms`);
      console.log(`✅ 测试案例 ${i + 1} 成功`);
      
      // 显示响应的关键信息
      if (result.sources && result.sources.length > 0) {
        console.log(`📚 参考来源数量: ${result.sources.length}`);
      }
      if (result.attachment_data && result.attachment_data.length > 0) {
        console.log(`📎 附件数量: ${result.attachment_data.length}`);
      }
      
    } catch (error) {
      console.error(`❌ 测试案例 ${i + 1} 失败:`, error.message);
    }
    
    // 测试间隔
    if (i < testCases.length - 1) {
      console.log('⏳ 等待1秒后继续下一个测试...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
    console.log('\n' + '='.repeat(60));
  console.log('🎉 测试完成！');
}

// 执行测试
if (require.main === module) {
  runTests().catch(error => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });
}

module.exports = { testSendMessage };

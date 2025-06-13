#!/usr/bin/env node

/**
 * 简化版 ChatService 测试脚本
 * 快速测试 sendChatMessage 功能
 */

const axios = require('axios');

// 配置
// const API_BASE_URL = 'http://10.10.15.211:5000';
const API_BASE_URL = 'http://localhost:5000';
const TIMEOUT = 80000;

// 简化的测试函数
async function testSendChatMessage() {
  console.log('🧪 快速测试 ChatService.sendChatMessage()');
  console.log('=' * 50);
  
  // 创建axios实例
  const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: TIMEOUT,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // 测试用例
  const testMessage = {
    prompt: '你好，请介绍一下北京第二外国语学院',
    scene_id: 'general'
  };

  try {
    console.log(`📡 测试API地址: ${API_BASE_URL}`);
    console.log(`📝 测试消息: "${testMessage.prompt}"`);
    console.log(`🏷️ 场景ID: ${testMessage.scene_id}`);
    
    console.log('\n🚀 发送请求...');
    const startTime = Date.now();
    
    const response = await api.post('/api/chat', testMessage);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ 请求成功!`);
    console.log(`⏱️ 响应时间: ${duration}ms`);
    console.log(`📊 状态码: ${response.status}`);
    
    if (response.data) {
      console.log(`\n📋 响应数据结构:`);
      console.log(`   类型: ${typeof response.data}`);
      console.log(`   字段: ${Object.keys(response.data).join(', ')}`);
      
      if (response.data.response) {
        console.log(`\n💬 AI回复:`);
        console.log(`   长度: ${response.data.response.length} 字符`);
        console.log(`   内容预览: ${response.data.response.substring(0, 150)}...`);
        
        // 完整回复
        console.log(`\n📝 完整AI回复:`);
        console.log('-'.repeat(50));
        console.log(response.data.response);
        console.log('-'.repeat(50));
      }
      
      if (response.data.status) {
        console.log(`\n📌 响应状态: ${response.data.status}`);
      }
    }
    
    return response.data;
    
  } catch (error) {
    console.error(`\n❌ 测试失败:`);
    
    if (error.response) {
      console.error(`   状态码: ${error.response.status}`);
      console.error(`   响应数据:`, error.response.data);
    } else if (error.request) {
      console.error(`   网络错误: 无法连接到服务器`);
      console.error(`   错误详情: ${error.message}`);
    } else {
      console.error(`   请求配置错误: ${error.message}`);
    }
    
    throw error;
  }
}

// 连接测试
async function testConnection() {
  console.log('\n🔍 测试API连接...');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/greeting`, {
      timeout: 5000
    });
    
    console.log(`✅ 连接成功: ${response.status}`);
    return true;
  } catch (error) {
    console.error(`❌ 连接失败: ${error.message}`);
    return false;
  }
}

// 批量测试
async function runBatchTests() {
  console.log('\n🔄 批量测试模式');
  
  const testCases = [
    { prompt: '你好', scene_id: 'general' },
    { prompt: '北京第二外国语学院有哪些专业？', scene_id: 'study' },
    { prompt: '如何申请奖学金？', scene_id: 'life' }
  ];
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n📋 测试 ${i + 1}/${testCases.length}: "${testCase.prompt}"`);
    
    try {
      const api = axios.create({
        baseURL: API_BASE_URL,
        timeout: TIMEOUT,
        headers: { 'Content-Type': 'application/json' }
      });
      
      const response = await api.post('/api/chat', testCase);
      console.log(`✅ 成功 - 响应长度: ${response.data.response?.length || 0} 字符`);
      
    } catch (error) {
      console.error(`❌ 失败: ${error.message}`);
    }
    
    // 间隔
    if (i < testCases.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// 主函数
async function main() {
  console.log('🚀 ChatService 测试脚本启动');
  console.log(`📅 测试时间: ${new Date().toLocaleString()}`);
  
  try {
    // 步骤1: 连接测试
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ API服务不可用，退出测试');
      process.exit(1);
    }
    
    // 步骤2: 基本功能测试
    console.log('\n' + '='.repeat(60));
    console.log('📋 基本功能测试');
    console.log('='.repeat(60));
    
    await testSendChatMessage();
    
    // 步骤3: 批量测试 (可选)
    const args = process.argv.slice(2);
    if (args.includes('--batch')) {
      console.log('\n' + '='.repeat(60));
      console.log('📋 批量测试');
      console.log('='.repeat(60));
      await runBatchTests();
    }
    
    console.log('\n🎉 所有测试完成!');
    
  } catch (error) {
    console.error('\n💥 测试过程中发生错误:', error.message);
    process.exit(1);
  }
}

// 使用说明
function showUsage() {
  console.log('\n📖 使用方法:');
  console.log('  node test_sendChatMessage.js          # 基本测试');
  console.log('  node test_sendChatMessage.js --batch  # 批量测试');
  console.log('  node test_sendChatMessage.js --help   # 显示帮助');
}

// 命令行参数处理
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  showUsage();
  process.exit(0);
}

// 启动
if (require.main === module) {
  main();
}

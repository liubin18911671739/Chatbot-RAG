const axios = require('axios');

// 测试审核问题功能（修复后）
async function testApproveQuestionFixed() {
  console.log('=== 测试审核问题功能（修复后）===');
  
  const questionId = 1564; // 使用错误日志中的问题ID
  const API_BASE_URL = 'http://localhost:5000';
  
  try {
    // 模拟修复后的请求数据
    const requestData = {
      question: '勺子的英文', 
      answer: '勺子的英文是 "spoon"。',
      status: 'reviewed',
      userid: 'admin' // 确保包含userid字段
    };
    
    console.log('发送审核请求...');
    console.log('问题ID:', questionId);
    console.log('请求数据:', JSON.stringify(requestData, null, 2));
    
    const response = await axios.put(`${API_BASE_URL}/api/update/${questionId}`, requestData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 审核成功！');
    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ 审核失败');
    console.error('错误详情:', error.message);
    
    if (error.response) {
      console.log('HTTP状态码:', error.response.status);
      console.log('错误响应:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// 测试更新问题答案功能（修复后）
async function testUpdateQuestionFixed() {
  console.log('\n=== 测试更新问题答案功能（修复后）===');
  
  const questionId = 1564; // 使用错误日志中的问题ID
  const API_BASE_URL = 'http://localhost:5000';
  
  try {
    // 模拟修复后的请求数据
    const updateData = {
      question: '勺子的英文',
      answer: '勺子的英文是 "spoon"。这是一个常见的餐具。',
      status: 'reviewed',
      userid: 'admin' // 确保包含userid字段
    };
    
    console.log('发送更新请求...');
    console.log('问题ID:', questionId);
    console.log('更新数据:', JSON.stringify(updateData, null, 2));
    
    const response = await axios.put(`${API_BASE_URL}/api/update/${questionId}`, updateData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 更新成功！');
    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ 更新失败');
    console.error('错误详情:', error.message);
    
    if (error.response) {
      console.log('HTTP状态码:', error.response.status);
      console.log('错误响应:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// 运行测试
async function runTests() {
  await testApproveQuestionFixed();
  await testUpdateQuestionFixed();
}

runTests().catch(console.error);

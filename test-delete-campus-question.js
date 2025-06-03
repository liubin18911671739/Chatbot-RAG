// 测试删除校园共建问题功能
const axios = require('axios');

// 模拟admin.js中的deleteCampusQuestion函数
const API_BASE_URL = 'http://localhost:5000';

// 模拟localStorage (Node.js环境中没有localStorage)
const mockLocalStorage = {
  getItem: (key) => {
    if (key === 'token') {
      return 'test-jwt-token-123'; // 模拟JWT token
    }
    return null;
  }
};

/**
 * 删除校园共建问题 (从admin.js复制的函数)
 * @param {number} questionId - 要删除的问题ID
 * @returns {Promise<Object>} 删除结果
 */
const deleteCampusQuestion = async (questionId) => {
  try {
    console.log(`删除校园共建问题ID: ${questionId}`);
    
    const response = await axios.delete(`${API_BASE_URL}/api/delete/${questionId}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mockLocalStorage.getItem('token')}`
      }
    });
    
    console.log('删除问题响应:', response.status, response.statusText);
    console.log('响应数据:', response.data);
    
    // 检查响应是否有效
    if (!response) {
      throw new Error('服务器响应为空');
    }
    
    // 返回响应数据，如果没有data字段则返回整个响应
    return response.data || response;
    
  } catch (error) {
    console.error('删除校园共建问题失败:', error.message);
    
    // 提供更详细的错误信息
    if (error.response) {
      // 服务器返回了错误响应
      console.error('服务器错误响应:', error.response.status, error.response.data);
      const errorMessage = error.response.data && error.response.data.message ? error.response.data.message : '未知错误';
      throw new Error(`服务器错误: ${error.response.status} - ${errorMessage}`);
    } else if (error.request) {
      // 请求发送了但没有收到响应
      console.error('网络错误，没有收到响应');
      throw new Error('网络错误，无法连接到服务器');
    } else {
      // 其他错误
      console.error('请求配置错误:', error.message);
      throw new Error(`请求错误: ${error.message}`);
    }
  }
};

/**
 * 获取问题列表用于测试
 */
const fetchQuestions = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/questions`);
    console.log('获取问题列表响应:', response.status);
    
    if (response.data && response.data.qas && Array.isArray(response.data.qas)) {
      return response.data.qas;
    } else if (Array.isArray(response.data)) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error('获取问题列表失败:', error.message);
    return [];
  }
};

/**
 * 运行删除测试
 */
const runDeleteTest = async () => {
  console.log('=== 开始测试删除校园共建问题功能 ===\n');
  
  try {
    // 1. 首先获取现有问题列表
    console.log('1. 获取现有问题列表...');
    const questions = await fetchQuestions();
    console.log(`   找到 ${questions.length} 个问题`);
    
    if (questions.length > 0) {
      console.log('   前几个问题ID:', questions.slice(0, 3).map(q => q.id));
    } else {
      console.log('   没有找到现有问题，将测试一个假设的ID');
    }
    
    console.log('');
    
    // 2. 测试删除不存在的问题ID (应该失败)
    console.log('2. 测试删除不存在的问题ID (999999)...');
    try {
      await deleteCampusQuestion(999999);
      console.log('   ❌ 意外成功 - 删除不存在的问题应该失败');
    } catch (error) {
      console.log('   ✅ 预期失败:', error.message);
    }
    
    console.log('');
    
    // 3. 如果有现有问题，测试删除第一个
    if (questions.length > 0) {
      const firstQuestionId = questions[0].id;
      console.log(`3. 测试删除现有问题ID (${firstQuestionId})...`);
      
      try {
        const result = await deleteCampusQuestion(firstQuestionId);
        console.log('   ✅ 删除成功:', result);
        
        // 验证删除是否成功 - 再次获取问题列表
        console.log('   验证删除结果...');
        const updatedQuestions = await fetchQuestions();
        const isDeleted = !updatedQuestions.find(q => q.id === firstQuestionId);
        
        if (isDeleted) {
          console.log('   ✅ 验证成功 - 问题已从列表中移除');
        } else {
          console.log('   ⚠️  警告 - 问题仍然存在于列表中');
        }
        
      } catch (error) {
        console.log('   ❌ 删除失败:', error.message);
      }
    } else {
      console.log('3. 跳过真实删除测试 - 没有现有问题');
    }
    
    console.log('');
    
    // 4. 测试无效参数
    console.log('4. 测试无效参数...');
    
    // 测试undefined
    try {
      await deleteCampusQuestion(undefined);
      console.log('   ❌ 意外成功 - undefined参数应该失败');
    } catch (error) {
      console.log('   ✅ undefined参数失败:', error.message);
    }
    
    // 测试null
    try {
      await deleteCampusQuestion(null);
      console.log('   ❌ 意外成功 - null参数应该失败');
    } catch (error) {
      console.log('   ✅ null参数失败:', error.message);
    }
    
    // 测试字符串
    try {
      await deleteCampusQuestion('invalid');
      console.log('   ❌ 意外成功 - 字符串参数应该失败');
    } catch (error) {
      console.log('   ✅ 字符串参数失败:', error.message);
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error.message);
  }
  
  console.log('\n=== 删除测试完成 ===');
};

/**
 * 检查后端服务是否运行
 */
const checkBackendStatus = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/questions`, {
      timeout: 3000
    });
    return true;
  } catch (error) {
    return false;
  }
};

// 主函数
const main = async () => {
  console.log('检查后端服务状态...');
  const isBackendRunning = await checkBackendStatus();
  
  if (!isBackendRunning) {
    console.log('❌ 后端服务未运行！');
    console.log('请先启动后端服务：');
    console.log('  cd backend');
    console.log('  python app.py');
    console.log('\n或者使用：');
    console.log('  start-backend.bat');
    return;
  }
  
  console.log('✅ 后端服务正在运行\n');
  
  // 运行测试
  await runDeleteTest();
};

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  deleteCampusQuestion,
  fetchQuestions,
  runDeleteTest
};
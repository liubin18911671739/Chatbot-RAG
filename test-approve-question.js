/**
 * 测试审核校园共建问题功能
 * 测试前端与后端API响应格式的兼容性
 */

const axios = require('axios');

// 配置
const API_BASE_URL = 'http://localhost:5000';

/**
 * 测试审核问题功能
 * @param {number} questionId - 问题ID
 */
async function testApproveQuestion(questionId) {
  try {
    console.log(`🔄 开始测试审核问题ID: ${questionId}`);
    
    // 模拟前端的审核请求
    const response = await axios.put(`${API_BASE_URL}/api/update/${questionId}`, {
      status: "reviewed"
    }, {
      headers: {
        'Content-Type': 'application/json',
        // 在实际情况下，这里会有 Authorization token
        // Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    console.log('✅ 响应状态:', response.status, response.statusText);
    console.log('📄 响应数据:', JSON.stringify(response.data, null, 2));
    
    // 检查响应格式是否符合预期
    if (response.data && response.data.status === 'success') {
      console.log('✅ 审核成功，响应格式正确');
      return {
        success: true,
        message: '审核成功',
        data: response.data
      };
    } else if (response.data && response.data.status === 'error') {
      console.log('❌ 后端返回错误:', response.data.message);
      return {
        success: false,
        message: response.data.message || '审核失败',
        data: response.data
      };
    } else {
      console.log('⚠️ 意外的响应格式');
      return {
        success: false,
        message: '意外的响应格式',
        data: response.data
      };
    }
    
  } catch (error) {
    console.error('❌ 审核请求失败:', error.message);
    
    if (error.response) {
      console.error('📄 错误响应状态:', error.response.status);
      console.error('📄 错误响应数据:', JSON.stringify(error.response.data, null, 2));
      
      // 分析具体的错误原因
      if (error.response.status === 400) {
        console.error('⚠️ 400错误可能的原因:');
        console.error('   - 请求数据格式不正确');
        console.error('   - 缺少必要的字段');
        console.error('   - 状态值无效');
      } else if (error.response.status === 404) {
        console.error('⚠️ 404错误: 问题不存在');
      } else if (error.response.status >= 500) {
        console.error('⚠️ 服务器内部错误');
      }
    } else if (error.request) {
      console.error('❌ 网络错误: 无法连接到服务器');
    } else {
      console.error('❌ 请求配置错误:', error.message);
    }
    
    return {
      success: false,
      message: error.message,
      error: error.response ? error.response.data : error.message
    };
  }
}

/**
 * 测试编辑问题功能
 * @param {number} questionId - 问题ID
 * @param {Object} updateData - 更新数据
 */
async function testUpdateQuestion(questionId, updateData) {
  try {
    console.log(`🔄 开始测试编辑问题ID: ${questionId}`);
    console.log('📝 更新数据:', JSON.stringify(updateData, null, 2));
    
    const response = await axios.put(`${API_BASE_URL}/api/update/${questionId}`, updateData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 响应状态:', response.status, response.statusText);
    console.log('📄 响应数据:', JSON.stringify(response.data, null, 2));
    
    // 检查响应格式
    if (response.data && response.data.status === 'success') {
      console.log('✅ 编辑成功，响应格式正确');
      return { success: true, data: response.data };
    } else if (response.data && response.data.status === 'error') {
      console.log('❌ 后端返回错误:', response.data.message);
      return { success: false, message: response.data.message };
    } else {
      console.log('⚠️ 意外的响应格式');
      return { success: false, message: '意外的响应格式' };
    }
    
  } catch (error) {
    console.error('❌ 编辑请求失败:', error.message);
    if (error.response) {
      console.error('📄 错误响应:', JSON.stringify(error.response.data, null, 2));
    }
    return { success: false, message: error.message };
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('🚀 开始测试校园共建问题审核和编辑功能...\n');
  
  // 测试用的问题ID（请根据实际情况修改）
  const testQuestionId = 1;
  
  try {
    // 测试1: 审核问题
    console.log('=== 测试1: 审核问题 ===');
    const approveResult = await testApproveQuestion(testQuestionId);
    console.log('审核测试结果:', approveResult.success ? '✅ 成功' : '❌ 失败');
    console.log('');
    
    // 测试2: 编辑问题答案
    console.log('=== 测试2: 编辑问题答案 ===');
    const updateData = {
      answer: "这是一个更新后的答案内容",
      status: "reviewed"
    };
    const updateResult = await testUpdateQuestion(testQuestionId, updateData);
    console.log('编辑测试结果:', updateResult.success ? '✅ 成功' : '❌ 失败');
    console.log('');
    
    // 测试3: 仅更新状态
    console.log('=== 测试3: 仅更新状态 ===');
    const statusData = {
      status: "unreview"
    };
    const statusResult = await testUpdateQuestion(testQuestionId, statusData);
    console.log('状态更新测试结果:', statusResult.success ? '✅ 成功' : '❌ 失败');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
  
  console.log('\n🏁 测试完成!');
}

// 运行测试
if (require.main === module) {
  runTests();
}

module.exports = {
  testApproveQuestion,
  testUpdateQuestion,
  runTests
};

const axios = require('axios');

// 从 chatService 复制的 fetchSuggestions 函数，转换为 CommonJS 语法
async function fetchSuggestions(localSuggestions = []) {
  try {
    const response = await axios.get('http://10.10.15.210:5001/api/suggestions', {
      timeout: 5000 // 5秒超时
    });
    
    if (response.data) {
      console.log('API 原始响应:', response.data);
      
      // 检查响应格式并提取建议数据
      if (response.data.status === 'success' && response.data.suggestions) {
        console.log('Successfully fetched suggestions from API (suggestions field):', response.data.suggestions);
        // 将 suggestions 数据保存到数组
        const Suggestions = response.data.suggestions;
        console.log('提取的 Suggestions 数组:', Suggestions);
        console.log('数组长度:', Suggestions.length);
        return Suggestions;
      } else if (response.data.status === 'success' && response.data.data) {
        console.log('Successfully fetched suggestions from API (data field):', response.data.data);
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        // 如果直接返回数组格式
        console.log('Successfully fetched suggestions from API (array format):', response.data);
        return response.data;
      } else {
        console.warn('API response format unexpected, using local suggestions');
        return localSuggestions;
      }
    } else {
      console.warn('Failed to fetch suggestions from API, using local suggestions');
      return localSuggestions;
    }
  } catch (error) {
    console.error('Error fetching suggestions:', error.message);
    console.log('Using local suggestions due to API error');
    return localSuggestions;
  }
}

// 测试函数
async function testFetchSuggestions() {
  console.log('🚀 开始测试 fetchSuggestions 函数...\n');
  
  // 模拟本地建议数据
  const localSuggestions = [
    '如何申请奖学金？',
    '图书馆开放时间',
    '选课相关问题',
    '宿舍申请流程'
  ];
  
  try {
    console.log('📋 测试 1: 使用本地建议作为回退');
    const result1 = await fetchSuggestions(localSuggestions);
    console.log('结果 1:', result1);
    console.log('类型:', typeof result1, '是否为数组:', Array.isArray(result1));
    
    console.log('\n📋 测试 2: 不提供本地建议');
    const result2 = await fetchSuggestions();
    console.log('结果 2:', result2);
    console.log('类型:', typeof result2, '是否为数组:', Array.isArray(result2));
    
    console.log('\n📋 测试 3: 空数组作为本地建议');
    const result3 = await fetchSuggestions([]);
    console.log('结果 3:', result3);
    console.log('类型:', typeof result3, '是否为数组:', Array.isArray(result3));
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
  
  console.log('\n🏁 测试完成!');
}

// 如果直接运行此脚本
if (require.main === module) {
  testFetchSuggestions().catch(console.error);
}

module.exports = { fetchSuggestions, testFetchSuggestions };
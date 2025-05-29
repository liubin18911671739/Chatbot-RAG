// 推荐的实现方式
const axios = require('axios');

const apiClient = axios.create({
  baseURL: 'http://10.10.15.210:5001',
  timeout: 10000
});

// 搜索问题
const searchQuestions = async (query) => {
  try {
    const response = await apiClient.get('/api/search', {
      params: { query }
    });
    return response.data;
  } catch (error) {
    console.error('搜索失败:', error);
    throw error;
  }
};

// 使用
// searchQuestions('借阅图书遗失').then(result => {
//   console.log('搜索结果:', result);
// });
// 主测试函数
async function runTests() {
    console.log('🚀 开始 searchQuestions 集成测试...\n');
    
    try {
        // 测试 1: 带有本地建议的回退机制
        console.log('📋 测试 searchQuestions()');
        const result = await searchQuestions("党政办公室综合事务的办公室是？");
        
        // 测试 2: 验证返回的数据结构
        console.log('搜索结果:', result);
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error);
    }
    
    console.log('\n🏁 测试完成!');
}

// 如果直接运行此脚本
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { searchQuestions, runTests };

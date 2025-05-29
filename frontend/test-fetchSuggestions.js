// fetchSuggestions 集成测试脚本
// 测试从 ChatView.vue 移动到 chatService.js 的功能

const axios = require('axios');

// 原始的 fetchSuggestions 方法（从 ChatView.vue 复制）
async function FetchSuggestions(BASE_URL='http://10.10.15.210:5001', localQuestions = []) {
    try {
        const response = await axios.get(`${BASE_URL}/api/questions`);
        if (response.data) {
            // 检查响应格式并提取建议数据
            if (response.data.status === 'success' && response.data.data) {
                console.log('✅ Successfully fetched suggestions from API (original):', response.data.data.length, 'items');
                return response.data.data;
            } else {
                console.warn('⚠️ API response format unexpected, using local suggestions (original)');
                return localQuestions;
            }
        } else {
            console.warn('⚠️ Failed to fetch suggestions from API, using local suggestions (original)');
            return localQuestions;
        }
    } catch (error) {
        console.error('❌ Error fetching suggestions (original):', error.message);
        console.log('🔄 Using local suggestions due to API error (original)');
        return localQuestions;
    }
}

const localQuestions = [
    {
      "id": 1,
      "key": "5YWa5pS/5Yqe5YWs5a6k57u85ZCI5LqL5Yqh55qE55S16K+d5piv5aSa5bCR77yf",
      "mode": 1,
      "upload_userid": "origin"
    },
    {
      "id": 2,
      "key": "5YWa5pS/5Yqe5YWs5a6k57u85ZCI5LqL5Yqh55qE5Yqe5YWs5a6k5piv77yf",
      "mode": 1,
      "upload_userid": "origin"
    },
    {
      "id": 3,
      "key": "NjU3NzgwMDXmmK/lk6rkuKrpg6jpl6jnmoTnlLXor53vvJ8=",
      "mode": 1,
      "upload_userid": "origin"
    }
]

// 测试数据 - 添加一些模拟建议
// const localSuggestions = [
//     "如何申请奖学金？",
//     "图书馆开放时间是什么时候？",
//     "如何预约心理咨询？",
//     "校园网如何连接？",
//     "食堂营业时间查询"
// ];



// 主测试函数
async function runTests() {
    console.log('🚀 开始 fetchSuggestions 集成测试...\n');
    
    try {
        // 测试 1: 带有本地建议的回退机制
        console.log('📋 测试 FetchSuggestions() - 带模拟数据');
        const startTime = Date.now();
        // const suggestions = await FetchSuggestions('http://localhost:5000', localQuestions);
        const suggestions = await FetchSuggestions('http://10.10.15.210:5001', localQuestions);
        const endTime = Date.now();
        console.log(`   ⏱️ 耗时: ${endTime - startTime}ms`);
        console.log(`   📊 结果数量: ${suggestions.length}`);
        console.log(`   📝 建议内容:`, suggestions);
        console.log(`   🔧 方法: 原始 fetch 实现\n`);
        
        // 测试 2: 验证返回的数据结构
        console.log('📋 验证数据结构');
        if (Array.isArray(suggestions)) {
            console.log('   ✅ 返回类型正确 (Array)');
            if (suggestions.length > 0) {
                console.log('   ✅ 包含建议数据');
                console.log('   📄 第一个建议:', suggestions[0]);
            } else {
                console.log('   ⚠️ 建议列表为空');
            }
        } else {
            console.log('   ❌ 返回类型错误，期望Array');
        }
        
        // 测试 3: 测试不同的API地址
        // console.log('\n📋 测试不同API地址的错误处理');
        // const invalidResults = await FetchSuggestions('http://invalid-url:9999', localSuggestions);
        // console.log(`   📊 无效API结果数量: ${invalidResults.length}`);
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error);
    }
    
    console.log('\n🏁 测试完成!');
}

// 如果直接运行此脚本
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { FetchSuggestions, runTests };

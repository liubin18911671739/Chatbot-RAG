/**
 * 测试建议功能修复
 * 验证 fetchSuggestions 和 initializeSuggestions 功能
 */

const axios = require('axios');

// 模拟 chatService.fetchSuggestions 方法
class MockChatService {
  // 模拟 API 响应数据
  mockApiResponse = {
    status: "success",
    suggestions: [
      "你好，很高兴认识你！",
      "今天天气真不错，适合出去走走。",
      "请问您需要什么帮助吗？",
      "我正在学习新的编程语言。",
      "最近看了一部很棒的电影。",
      "周末有什么好的计划吗？",
      "感谢您的耐心等待。",
      "这个想法听起来很有趣！",
      "让我想想怎么回答这个问题。",
      "希望能够对您有所帮助。"
    ]
  };

  async fetchSuggestions() {
    try {
      console.log('🚀 正在调用实际 API...\n');
      
      const response = await axios.get('http://10.10.15.210:5001/api/suggestions', {
        timeout: 10000 // 10秒超时
      });
      
      console.log('✅ API 调用成功');
      console.log('响应状态:', response.status);
      console.log('响应数据结构:', Object.keys(response.data));
      
      // 提取 suggestions
      const suggestions = this.extractSuggestions(response.data);
      return suggestions;
      
    } catch (error) {
      console.error('❌ API 调用失败:', error.message);
      if (error.response) {
        console.error('响应状态:', error.response.status);
        console.error('响应数据:', error.response.data);
      }
      
      console.log('\n🔄 使用模拟数据进行演示...');
      return this.extractSuggestions(this.mockApiResponse);
    }
  }

  extractSuggestions(apiResponse) {
    console.log('🔍 提取 suggestions 数据...\n');
    
    // 检查响应格式
    if (apiResponse && apiResponse.status === 'success' && apiResponse.suggestions) {
      const rawSuggestions = apiResponse.suggestions;
      
      console.log('✅ 成功提取 suggestions 数据:');
      console.log('数据类型:', typeof rawSuggestions);
      console.log('是否为数组:', Array.isArray(rawSuggestions));
      console.log('数组长度:', rawSuggestions.length);
      console.log('\n📋 前10条 Suggestions 内容:');
      
      rawSuggestions.slice(0, 10).forEach((suggestion, index) => {
        console.log(`${index + 1}. ${suggestion}`);
      });
      
      // 转换为前端需要的格式
      const formattedSuggestions = rawSuggestions.map(suggestion => ({
        text: suggestion,
        type: 'api'
      }));
      
      console.log('🔄 已转换为前端格式，返回', formattedSuggestions.length, '条建议');
      return formattedSuggestions;
      
    } else {
      console.log('❌ 无法提取 suggestions 数据，响应格式不正确');
      return [];
    }
  }
}

// 模拟前端初始化建议数据的逻辑
async function testInitializeSuggestions() {
  console.log('='.repeat(60));
  console.log('🚀 测试建议数据初始化修复');
  console.log('='.repeat(60));

  // 模拟本地建议
  const localSuggestions = [
    { text: '问题密集书库的图书可以外借吗', type: 'local' },
    { text: '学校浴室开放时间', type: 'local' },
    { text: '浴室几点关门', type: 'local' }
  ];

  const chatService = new MockChatService();
  let suggestions = [];

  try {
    console.log('🚀 正在初始化建议数据...');
    
    // 首先使用本地建议
    suggestions = [...localSuggestions];
    console.log(`📋 本地建议加载完成：${suggestions.length} 条`);
    
    // 异步获取API建议并合并
    const apiSuggestions = await chatService.fetchSuggestions();

    if (apiSuggestions && apiSuggestions.length > 0) {
      console.log('\n🔍 检查API建议格式...');
      
      // 如果API建议已经是正确的格式 {text: "...", type: "api"}
      if (apiSuggestions[0] && typeof apiSuggestions[0] === 'object' && apiSuggestions[0].text) {
        console.log('✅ API建议格式正确：{text: "...", type: "api"}');
        // 合并本地建议和API建议
        suggestions = [...localSuggestions, ...apiSuggestions];
        console.log(`✅ 建议数据初始化完成，共 ${suggestions.length} 条建议 (本地: ${localSuggestions.length}, API: ${apiSuggestions.length})`);
      } else {
        console.log('⚠️ API建议是字符串数组，需要转换格式');
        // 如果API建议是字符串数组，需要转换格式
        const formattedApiSuggestions = apiSuggestions.map(text => ({
          text: text,
          type: 'api'
        }));
        
        // 合并本地建议和API建议
        suggestions = [...localSuggestions, ...formattedApiSuggestions];
        console.log(`✅ 建议数据初始化完成，共 ${suggestions.length} 条建议 (本地: ${localSuggestions.length}, API: ${apiSuggestions.length})`);
      }
    } else {
      console.log('⚠️ API建议获取失败，仅使用本地建议');
    }
  } catch (error) {
    console.error('❌ 建议数据初始化失败:', error);
    // 确保至少有本地建议可用
    suggestions = [...localSuggestions];
  }

  console.log('\n📊 最终建议数据结果:');
  console.log(`总数量：${suggestions.length}`);
  console.log('前5条建议:');
  suggestions.slice(0, 5).forEach((suggestion, index) => {
    console.log(`${index + 1}. [${suggestion.type}] ${suggestion.text}`);
  });

  return suggestions;
}

// 运行测试
if (require.main === module) {
  testInitializeSuggestions()
    .then(() => {
      console.log('\n✅ 测试完成！');
    })
    .catch(error => {
      console.error('\n❌ 测试失败:', error);
    });
}

module.exports = { MockChatService, testInitializeSuggestions };

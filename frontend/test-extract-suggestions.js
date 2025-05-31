import axios from 'axios';

// 模拟 API 响应数据
const mockApiResponse = {
  "status": "success",
  "suggestions": [
    "党政办公室综合事务的电话是多少？",
    "党政办公室综合事务的办公室是？",
    "65778005是哪个部门的电话？",
    "明德楼303是哪个部门的办公室？",
    "党政办公室党办事务的电话是多少？",
    "党政办公室党办事务的办公室是？",
    "65778315是哪个部门的电话？",
    "明德楼316是哪个部门的办公室？",
    "党政办公室发展规划的电话是多少？",
    "党政办公室发展规划的办公室是？",
    "65778312是哪个部门的电话？",
    "明德楼312是哪个部门的办公室？",
    "党政办公室法律事务的电话是多少？"
  ]
};

// 提取 suggestions 数据的函数
function extractSuggestions(apiResponse) {
  console.log('🔍 提取 suggestions 数据...\n');
  
  // 检查响应格式
  if (apiResponse && apiResponse.status === 'success' && apiResponse.suggestions) {
    const Suggestions = apiResponse.suggestions;
    
    console.log('✅ 成功提取 suggestions 数据:');
    console.log('数据类型:', typeof Suggestions);
    console.log('是否为数组:', Array.isArray(Suggestions));
    console.log('数组长度:', Suggestions.length);
    console.log('\n📋 Suggestions 内容:');
    
    Suggestions.forEach((suggestion, index) => {
      console.log(`${index + 1}. ${suggestion}`);
    });
    
    return Suggestions;
  } else {
    console.log('❌ 无法提取 suggestions 数据，响应格式不正确');
    return [];
  }
}

// 实际调用 API 的函数
async function fetchSuggestionsFromAPI() {
  try {
    console.log('🚀 正在调用实际 API...\n');
    console.log('📍 目标地址:', 'http://10.10.15.210:5001/api/suggestions');
    
    // 创建axios实例，禁用代理
    const axiosInstance = axios.create({
      proxy: false, // 禁用代理
      timeout: 10000, // 10秒超时
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Node.js Test Script'
      },
      withCredentials: false // 禁用凭据以避免跨域问题
    });
    
    const response = await axiosInstance.get('http://10.10.15.210:5001/api/suggestions');
    
    console.log('✅ API 调用成功');
    console.log('响应状态:', response.status);
    console.log('响应数据结构:', response.data ? Object.keys(response.data) : 'undefined');
    
    // 提取 suggestions
    const Suggestions = extractSuggestions(response.data || {});
    return Suggestions;
    
  } catch (error) {
    console.error('❌ API 调用失败:', error.message);
    
    // 详细错误信息
    if (error.code === 'ECONNABORTED') {
      console.error('⏰ 请求超时 - 服务器响应时间过长');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🚫 连接被拒绝 - 服务器可能未启动');
    } else if (error.code === 'ENOTFOUND') {
      console.error('🔍 域名解析失败 - 检查网络连接或服务器地址');
    } else if (error.response) {
      console.error('📡 服务器响应错误:');
      console.error('   状态码:', error.response.status);
      console.error('   响应数据:', error.response.data);
    } else if (error.request) {
      console.error('📤 请求发送失败 - 网络连接问题');
    }
    
    console.log('\n🔄 使用模拟数据进行演示...');
    return extractSuggestions(mockApiResponse);
  }
}

// 主测试函数
async function main() {
  console.log('🚀 开始测试 suggestions 数据提取...\n');
  
  // 首先测试模拟数据
  console.log('=== 测试 1: 使用模拟数据 ===');
  const mockSuggestions = extractSuggestions(mockApiResponse);
  console.log(`模拟数据获得 ${mockSuggestions.length} 条建议数据\n`);
  
  console.log('=== 测试 2: 调用实际 API ===');
  const apiSuggestions = await fetchSuggestionsFromAPI();
  
  console.log('\n🏁 测试完成!');
  console.log(`最终获得 ${apiSuggestions.length} 条建议数据`);
}

// 运行测试
main().catch(console.error);

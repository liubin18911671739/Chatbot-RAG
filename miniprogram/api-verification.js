// API服务验证脚本
// 在微信开发者工具控制台中运行此脚本来验证API修复结果

console.log('🚀 开始API服务验证...')

// 验证API服务导入
try {
  const apiService = require('./utils/api.js').default
  console.log('✅ API服务导入成功')
  
  // 验证初始化
  apiService.init()
  console.log('✅ API服务初始化成功')
  console.log('📍 BaseURL:', apiService.baseUrl)
  console.log('⏱️ Timeout:', apiService.timeout)
  
  // 验证配置
  if (apiService.config) {
    console.log('✅ 环境配置加载成功')
    console.log('🌍 环境:', apiService.config.env)
    console.log('🔒 校园网限制:', apiService.config.campusRestriction)
  } else {
    console.log('⚠️ 环境配置未加载')
  }
  
} catch (error) {
  console.error('❌ API服务验证失败:', error)
}

// 验证方法可用性
console.log('\n📋 API方法可用性检查:')
const apiService = require('./utils/api.js').default

const methods = ['request', 'get', 'post', 'sendMessage', 'getScenes', 'getGreeting', 'getSuggestions', 'submitFeedback', 'searchQuestions', 'validateNetworkAccess']

methods.forEach(method => {
  if (typeof apiService[method] === 'function') {
    console.log(`✅ ${method} - 可用`)
  } else {
    console.log(`❌ ${method} - 不可用`)
  }
})

console.log('\n🎉 API服务验证完成!')
console.log('\n📝 使用说明:')
console.log('1. 所有API方法现在统一使用wx.request')
console.log('2. 支持环境配置和网络验证')
console.log('3. 不再依赖axios库')
console.log('4. 包含完整的错误处理和重试机制')

// 测试基础功能(可选)
async function testBasicFunction() {
  console.log('\n🧪 开始基础功能测试...')
  
  try {
    // 测试网络验证
    const networkResult = await apiService.validateNetworkAccess()
    console.log('🌐 网络验证结果:', networkResult.valid ? '✅ 通过' : '❌ 失败')
    console.log('📄 验证消息:', networkResult.message)
    
    // 测试获取欢迎消息(使用默认回退)
    const greeting = await apiService.getGreeting()
    console.log('👋 欢迎消息:', greeting.greeting ? '✅ 获取成功' : '❌ 获取失败')
    
    console.log('🎊 基础功能测试完成!')
    
  } catch (error) {
    console.error('❌ 基础功能测试失败:', error.message)
  }
}

// 如果需要测试基础功能，取消注释下面一行
// testBasicFunction();

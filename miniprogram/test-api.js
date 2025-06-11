// API 测试和验证脚本
// 在小程序控制台中运行此代码来测试API功能

// 测试API初始化
function testApiInit() {
  console.log('=== 测试API初始化 ===')
  
  try {
    const apiService = require('./utils/api.js').default
    apiService.init()
    
    console.log('✅ API初始化成功')
    console.log('BaseURL:', apiService.baseUrl)
    console.log('Timeout:', apiService.timeout)
    console.log('Config:', apiService.config)
    
    return true
  } catch (error) {
    console.error('❌ API初始化失败:', error)
    return false
  }
}

// 测试环境配置
function testEnvConfig() {
  console.log('=== 测试环境配置 ===')
  
  try {
    const { getConfig } = require('./config/env.js')
    const config = getConfig()
    
    console.log('✅ 环境配置获取成功')
    console.log('当前环境:', config.env)
    console.log('BaseURL:', config.baseURL)
    console.log('校园网限制:', config.campusRestriction)
    
    return true
  } catch (error) {
    console.error('❌ 环境配置获取失败:', error)
    return false
  }
}

// 测试网络验证
async function testNetworkValidation() {
  console.log('=== 测试网络验证 ===')
  
  try {
    const apiService = require('./utils/api.js').default
    const result = await apiService.validateNetworkAccess()
    
    console.log('✅ 网络验证完成')
    console.log('验证结果:', result)
    
    return result.valid
  } catch (error) {
    console.error('❌ 网络验证失败:', error)
    return false
  }
}

// 测试聊天API
async function testChatAPI() {
  console.log('=== 测试聊天API ===')
  
  try {
    const apiService = require('./utils/api.js').default
    apiService.init()
    
    const response = await apiService.sendMessage('你好，这是一条测试消息')
    
    console.log('✅ 聊天API测试成功')
    console.log('响应:', response)
    
    return true
  } catch (error) {
    console.error('❌ 聊天API测试失败:', error)
    return false
  }
}

// 测试其他API
async function testOtherAPIs() {
  console.log('=== 测试其他API ===')
  
  try {
    const apiService = require('./utils/api.js').default
    apiService.init()
    
    // 测试获取欢迎消息
    const greeting = await apiService.getGreeting()
    console.log('✅ 获取欢迎消息成功:', greeting)
    
    // 测试获取场景列表
    const scenes = await apiService.getScenes()
    console.log('✅ 获取场景列表成功:', scenes)
    
    // 测试获取建议
    const suggestions = await apiService.getSuggestions()
    console.log('✅ 获取建议成功:', suggestions)
    
    return true
  } catch (error) {
    console.error('❌ 其他API测试失败:', error)
    return false
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('🚀 开始API测试...')
  
  const results = []
  
  results.push(testApiInit())
  results.push(testEnvConfig())
  results.push(await testNetworkValidation())
  results.push(await testChatAPI())
  results.push(await testOtherAPIs())
  
  const passedTests = results.filter(r => r).length
  const totalTests = results.length
  
  console.log(`📊 测试完成: ${passedTests}/${totalTests} 通过`)
  
  if (passedTests === totalTests) {
    console.log('🎉 所有测试通过！API功能正常')
  } else {
    console.log('⚠️ 部分测试失败，请检查上述错误信息')
  }
  
  return passedTests === totalTests
}

// 导出测试函数
module.exports = {
  testApiInit,
  testEnvConfig,
  testNetworkValidation,
  testChatAPI,
  testOtherAPIs,
  runAllTests
}

// 在控制台中使用示例：
// const apiTest = require('./test-api.js')
// apiTest.runAllTests()

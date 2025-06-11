// 配置验证和调试脚本
// 在微信开发者工具控制台中运行此脚本

console.log('🔧 开始环境配置调试...')

// 1. 检查环境配置
try {
  const { getConfig, getCurrentEnv } = require('./config/env.js')
  
  console.log('📍 当前环境:', getCurrentEnv())
  
  const config = getConfig()
  console.log('⚙️ 当前配置:', config)
  console.log('🌐 BaseURL:', config.baseURL)
  console.log('🔒 校园网限制:', config.campusRestriction)
  console.log('🛠️ 开发模式:', config.isDev)
  
} catch (error) {
  console.error('❌ 环境配置检查失败:', error)
}

// 2. 检查API服务配置
try {
  const apiService = require('./utils/api.js').default
  
  console.log('\n📡 API服务配置检查:')
  apiService.init()
  console.log('🌐 API BaseURL:', apiService.baseUrl)
  console.log('⏱️ 超时设置:', apiService.timeout)
  console.log('📋 配置对象:', apiService.config)
  
} catch (error) {
  console.error('❌ API服务配置检查失败:', error)
}

// 3. 测试网络验证
async function testNetworkValidation() {
  console.log('\n🌍 网络验证测试:')
  
  try {
    const apiService = require('./utils/api.js').default
    const result = await apiService.validateNetworkAccess()
    
    console.log('✅ 网络验证结果:', result.valid ? '通过' : '失败')
    console.log('📄 验证原因:', result.reason)
    console.log('💬 验证消息:', result.message)
    
    return result.valid
  } catch (error) {
    console.error('❌ 网络验证测试失败:', error)
    return false
  }
}

// 4. 测试URL构建
function testUrlBuilding() {
  console.log('\n🔗 URL构建测试:')
  
  try {
    const apiService = require('./utils/api.js').default
    apiService.init()
    
    const testUrls = [
      '/api/chat',
      '/api/scenes',
      '/api/greeting'
    ]
    
    testUrls.forEach(url => {
      const fullUrl = url.startsWith('http') ? url : `${apiService.baseUrl}${url}`
      console.log(`📎 ${url} -> ${fullUrl}`)
    })
    
  } catch (error) {
    console.error('❌ URL构建测试失败:', error)
  }
}

// 5. 检查系统信息
function checkSystemInfo() {
  console.log('\n💻 系统信息:')
  
  try {
    const systemInfo = wx.getSystemInfoSync()
    console.log('🖥️ 平台:', systemInfo.platform)
    console.log('📱 系统:', systemInfo.system)
    console.log('📊 版本:', systemInfo.version)
    console.log('🌐 网络类型:', systemInfo.networkType)
    
  } catch (error) {
    console.error('❌ 系统信息获取失败:', error)
  }
}

// 运行所有测试
async function runAllTests() {
  checkSystemInfo()
  testUrlBuilding()
  await testNetworkValidation()
  
  console.log('\n🎉 配置调试完成!')
  console.log('\n📝 解决方案提示:')
  console.log('1. 确保在开发者工具中运行')
  console.log('2. 开发环境应该使用 http://10.10.15.211:5000')
  console.log('3. 开发环境不应该启用校园网限制')
  console.log('4. 如果仍有问题，请检查微信小程序域名白名单设置')
}

// 自动运行测试
runAllTests()

// 手动测试聊天API
async function testChatAPI() {
  console.log('\n💬 手动测试聊天API:')
  
  try {
    const apiService = require('./utils/api.js').default
    apiService.init()
    
    console.log('🚀 发送测试消息...')
    const response = await apiService.sendMessage('你好，这是一条测试消息')
    
    console.log('✅ 聊天API测试成功!')
    console.log('📄 响应内容:', response.response)
    
  } catch (error) {
    console.error('❌ 聊天API测试失败:', error.message)
    console.error('📋 错误详情:', error)
  }
}

// 如果需要测试聊天API，取消注释下面一行
// testChatAPI()

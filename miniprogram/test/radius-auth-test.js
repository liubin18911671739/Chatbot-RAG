// test/radius-auth-test.js
// RADIUS认证功能测试脚本

import authService from '../utils/auth.js'

// 测试RADIUS认证功能
async function testRadiusAuth() {
  console.log('=== RADIUS认证功能测试开始 ===')
  
  // 测试1: 检查初始状态
  console.log('测试1: 检查初始登录状态')
  const initialStatus = authService.checkLoginStatus()
  console.log('初始登录状态:', initialStatus)
  
  // 测试2: 尝试登录（测试账号）
  console.log('测试2: 尝试测试账号登录')
  try {
    const loginResult = await authService.loginWithRADIUS('testing', 'password')
    console.log('登录结果:', loginResult)
    
    if (loginResult.success) {
      // 测试3: 检查登录后状态
      console.log('测试3: 检查登录后状态')
      const loginStatus = authService.checkLoginStatus()
      const currentUser = authService.getCurrentUser()
      console.log('登录状态:', loginStatus)
      console.log('当前用户:', currentUser)
      
      // 测试4: 退出登录
      console.log('测试4: 测试退出登录')
      const logoutResult = authService.logout()
      console.log('退出结果:', logoutResult)
      
      // 测试5: 检查退出后状态
      console.log('测试5: 检查退出后状态')
      const afterLogoutStatus = authService.checkLoginStatus()
      console.log('退出后状态:', afterLogoutStatus)
    }
  } catch (error) {
    console.error('登录测试失败:', error)
  }
  
  console.log('=== RADIUS认证功能测试结束 ===')
}

// 测试网络连接
async function testNetworkConnection() {
  console.log('=== 网络连接测试开始 ===')
  
  return new Promise((resolve) => {
    wx.request({
      url: 'http://10.10.15.211:5000/api/auth/test',
      method: 'GET',
      success: (res) => {
        console.log('网络连接正常:', res)
        resolve(true)
      },
      fail: (error) => {
        console.log('网络连接失败:', error)
        resolve(false)
      }
    })
  })
}

// 导出测试函数
export {
  testRadiusAuth,
  testNetworkConnection
}

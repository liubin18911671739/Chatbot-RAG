// miniprogram/app.js
import networkValidator from './utils/network-validator.js'

App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 检查登录状态
    if (wx.getUserProfile) {
      this.globalData.canIUseGetUserProfile = true
    }

    // 初始化API配置
    this.initializeApp()
    
    // 校园网络环境检测
    this.validateNetworkAccess()
  },
  initializeApp() {
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync()
    this.globalData.systemInfo = systemInfo
      // 设置API基础URL
    this.globalData.apiBaseUrl = 'http://10.10.15.211:5000/api'
    
    console.log('小程序初始化完成')
  },

  // 校园网络环境验证
  async validateNetworkAccess() {
    try {
      console.log('开始校园网络环境验证...')
      
      const result = await networkValidator.validateCampusNetwork()
      
      if (!result.isValid) {
        console.log('校园网验证失败:', result.reason, result.message)
        
        // 记录失败尝试
        networkValidator.logAccessAttempt(false)
        
        // 显示访问限制提示
        setTimeout(() => {
          networkValidator.showAccessDeniedMessage(result)
        }, 1000) // 延迟1秒确保小程序完全启动
        
        return false
      }
      
      console.log('校园网验证通过:', result.message)
      networkValidator.logAccessAttempt(true)
      
      // 保存验证结果到全局数据
      this.globalData.networkValidation = result
      
      return true
      
    } catch (error) {
      console.error('网络验证过程出错:', error)
      
      // 在错误情况下，可以选择是否允许继续使用
      const allowOnError = this.globalData.systemInfo.platform === 'devtools'
      
      if (!allowOnError) {
        setTimeout(() => {
          networkValidator.showAccessDeniedMessage({
            reason: 'validation_error',
            message: '网络环境验证失败，请稍后重试'
          })
        }, 1000)
      }
      
      return allowOnError
    }
  },
  globalData: {
    userInfo: null,
    systemInfo: null,
    apiBaseUrl: '',
    canIUseGetUserProfile: false,
    currentScene: null,
    sessionId: null,
    networkValidation: null,
    campusNetworkValidator: networkValidator
  }
})

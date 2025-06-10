// miniprogram/app.js
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
  },

  initializeApp() {
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync()
    this.globalData.systemInfo = systemInfo
    
    // 设置API基础URL
    this.globalData.apiBaseUrl = 'http://10.10.15.211:5000/api'
    
    console.log('小程序初始化完成')
  },

  globalData: {
    userInfo: null,
    systemInfo: null,
    apiBaseUrl: '',
    canIUseGetUserProfile: false,
    currentScene: null,
    sessionId: null
  }
})

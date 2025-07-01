// pages/profile/profile.js
import storageManager from '../../utils/storage.js'
import utils from '../../utils/utils.js'
import authService from '../../utils/auth.js'

Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    canIUseGetUserProfile: false,
    // RADIUS认证状态
    isLoggedIn: false,
    radiusUser: null,
    settings: {
      enableSound: true,
      enableVibration: true,
      fontSize: 'medium',
      theme: 'light'
    },
    statisticsData: {
      totalChats: 0,
      totalMessages: 0,
      favoriteScene: '通用助手'
    },
    version: '1.0.0'
  },

  onLoad() {
    // 检查RADIUS认证状态
    this.checkAuthStatus()
    
    // 检查getUserProfile支持
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }
    
    // 加载用户数据
    this.loadUserData()
    this.loadSettings()
    this.loadStatistics()
  },

  onShow() {
    // 页面显示时刷新认证状态和统计数据
    this.checkAuthStatus()
    this.loadStatistics()
  },

  loadUserData() {
    const userInfo = storageManager.getUserInfo()
    if (userInfo) {
      this.setData({
        userInfo,
        hasUserInfo: true
      })
    }
  },

  loadSettings() {
    const settings = storageManager.getSettings()
    this.setData({ settings })
  },

  loadStatistics() {
    try {
      const histories = storageManager.getAllChatHistories()
      const totalChats = histories.length
      const totalMessages = histories.reduce((sum, history) => sum + history.messageCount, 0)
      
      // 计算最常用的场景
      const sceneUsage = {}
      histories.forEach(history => {
        const sceneId = history.sceneId || '通用助手'
        sceneUsage[sceneId] = (sceneUsage[sceneId] || 0) + 1
      })
      
      const favoriteScene = Object.keys(sceneUsage).reduce((a, b) => 
        sceneUsage[a] > sceneUsage[b] ? a : b, '通用助手'
      )
      
      this.setData({
        statisticsData: {
          totalChats,
          totalMessages,
          favoriteScene
        }
      })
    } catch (error) {
      console.error('加载统计数据失败:', error)
    }
  },

  // 获取用户信息
  getUserProfile() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const userInfo = res.userInfo
        this.setData({
          userInfo,
          hasUserInfo: true
        })
        storageManager.saveUserInfo(userInfo)
        utils.showToast('登录成功', 'success')
      },
      fail: (error) => {
        console.error('获取用户信息失败:', error)
        utils.showToast('获取用户信息失败', 'none')
      }
    })
  },

  // 设置项变更
  onSettingChange(e) {
    const { key } = e.currentTarget.dataset
    const { value } = e.detail
    
    const settings = { ...this.data.settings }
    settings[key] = value
    
    this.setData({ settings })
    storageManager.saveSettings(settings)
    
    // 应用设置
    this.applySettings(key, value)
  },

  applySettings(key, value) {
    switch (key) {
      case 'enableSound':
        // 这里可以设置音效开关
        break
      case 'enableVibration':
        // 这里可以设置震动开关
        break
      case 'fontSize':
        // 这里可以设置字体大小
        break
      case 'theme':
        // 这里可以设置主题
        break
    }
  },

  // 清空聊天历史
  async clearAllHistory() {
    const confirmed = await utils.showConfirm(
      '确定要清空所有聊天记录吗？此操作无法撤销。',
      '清空确认'
    )
    
    if (confirmed) {
      try {
        const histories = storageManager.getAllChatHistories()
        histories.forEach(history => {
          storageManager.clearChatHistory(history.sceneId)
        })
        
        this.loadStatistics()
        utils.showToast('已清空所有记录', 'success')
      } catch (error) {
        console.error('清空历史记录失败:', error)
        utils.handleError(error, '清空失败')
      }
    }
  },

  // 清空缓存
  async clearCache() {
    const confirmed = await utils.showConfirm(
      '确定要清空应用缓存吗？这将清除所有本地数据。',
      '清空缓存'
    )
    
    if (confirmed) {
      try {
        storageManager.clear()
        this.setData({
          userInfo: null,
          hasUserInfo: false,
          settings: {
            enableSound: true,
            enableVibration: true,
            fontSize: 'medium',
            theme: 'light'
          },
          statisticsData: {
            totalChats: 0,
            totalMessages: 0,
            favoriteScene: '通用助手'
          }
        })
        utils.showToast('缓存已清空', 'success')
      } catch (error) {
        console.error('清空缓存失败:', error)
        utils.handleError(error, '清空缓存失败')
      }
    }
  },

  // 反馈建议
  provideFeedback() {
    wx.navigateTo({
      url: '/pages/feedback/feedback'
    })
  },

  // 关于我们
  showAbout() {
    wx.showModal({
      title: '关于棠心问答',
      content: `棠心问答 v${this.data.version}\n\n北京第二外国语学院AI智能助手\n为师生提供学习生活咨询服务\n\n技术支持：信息技术中心`,
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 查看帮助
  showHelp() {
    wx.showModal({
      title: '使用帮助',
      content: '1. 选择合适的服务场景\n2. 输入您的问题\n3. 获得AI助手的回答\n4. 可以查看聊天历史\n5. 支持分享和反馈\n\n如有其他问题，请联系技术支持。',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 检查更新
  checkUpdate() {
    const updateManager = wx.getUpdateManager()
    
    updateManager.onCheckForUpdate((res) => {
      if (res.hasUpdate) {
        wx.showModal({
          title: '发现新版本',
          content: '发现新版本，是否下载更新？',
          success: (res) => {
            if (res.confirm) {
              updateManager.onUpdateReady(() => {
                wx.showModal({
                  title: '更新完成',
                  content: '新版本已经准备好，是否重启应用？',
                  success: (res) => {
                    if (res.confirm) {
                      updateManager.applyUpdate()
                    }
                  }
                })
              })
              
              updateManager.onUpdateFailed(() => {
                utils.showToast('更新失败，请稍后重试', 'none')
              })
            }
          }
        })
      } else {
        utils.showToast('当前已是最新版本', 'success')
      }
    })
  },
  // 联系客服
  contactSupport() {
    wx.showModal({
      title: '联系技术支持',
      content: '如需技术支持，请联系：\n\n邮箱：support@bisu.edu.cn\n电话：010-65778XXX\n\n工作时间：周一至周五 9:00-17:00',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 打开管理员配置
  openAdminConfig() {
    wx.navigateTo({
      url: '/pages/admin-config/admin-config'
    })
  },

  // 分享功能
  onShareAppMessage() {
    return utils.getShareContent()
  },

  onShareTimeline() {
    return utils.getShareContent()
  },

  // 检查RADIUS认证状态
  checkAuthStatus() {
    const isLoggedIn = authService.checkLoginStatus()
    const currentUser = authService.getCurrentUser()
    
    this.setData({
      isLoggedIn: isLoggedIn,
      radiusUser: currentUser
    })
  },

  // RADIUS退出登录
  onRadiusLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出认证吗？',
      success: (res) => {
        if (res.confirm) {
          const success = authService.logout()
          if (success) {
            this.setData({
              isLoggedIn: false,
              radiusUser: null
            })
            utils.showToast('已退出认证', 'success')
            
            // 跳转到首页
            setTimeout(() => {
              wx.switchTab({
                url: '/pages/index/index'
              })
            }, 1000)
          } else {
            utils.showToast('退出失败', 'none')
          }
        }
      }
    })
  },

  // 跳转到登录页面
  goToLogin() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },
})

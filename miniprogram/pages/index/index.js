// pages/index/index.js
import apiService from '../../utils/api.js'
import storageManager from '../../utils/storage.js'
import utils from '../../utils/utils.js'

Page({
  data: {
    greeting: '欢迎使用棠心问答AI辅导员！',
    quickQuestions: [],
    isLoading: false,
    userInfo: null,
    hasUserInfo: false,
    canIUseGetUserProfile: false,
    recentChats: []
  },

  onLoad() {
    // 初始化API
    apiService.init()
    
    // 检查用户信息
    this.loadUserInfo()
    
    // 加载数据
    this.loadPageData()
    
    // 检查getUserProfile支持
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }
  },

  onShow() {
    // 页面显示时刷新最近聊天
    this.loadRecentChats()
  },

  async loadPageData() {
    this.setData({ isLoading: true })
    
    try {
      // 并行加载欢迎消息和建议问题
      const [greetingRes, suggestionsRes] = await Promise.all([
        apiService.getGreeting(),
        apiService.getSuggestions()
      ])
      
      this.setData({
        greeting: greetingRes.greeting || this.data.greeting,
        quickQuestions: suggestionsRes.suggestions || []
      })
    } catch (error) {
      console.error('加载页面数据失败:', error)
      utils.handleError(error, '加载数据失败')
    } finally {
      this.setData({ isLoading: false })
    }
  },

  loadUserInfo() {
    const userInfo = storageManager.getUserInfo()
    if (userInfo) {
      this.setData({
        userInfo,
        hasUserInfo: true
      })
    }
  },

  loadRecentChats() {
    const recentChats = storageManager.getAllChatHistories().slice(0, 3)
    this.setData({ recentChats })
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

  // 开始新对话
  startNewChat() {
    wx.navigateTo({
      url: '/pages/chat/chat'
    })
  },

  // 选择场景
  selectScene() {
    wx.switchTab({
      url: '/pages/scenes/scenes'
    })
  },

  // 点击快速问题
  onQuickQuestionTap(e) {
    const question = e.currentTarget.dataset.question
    wx.navigateTo({
      url: `/pages/chat/chat?question=${encodeURIComponent(question)}`
    })
  },

  // 查看最近聊天
  onRecentChatTap(e) {
    const { sceneId } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/chat/chat?sceneId=${sceneId}`
    })
  },

  // 查看更多历史
  viewMoreHistory() {
    wx.switchTab({
      url: '/pages/history/history'
    })
  },

  // 分享功能
  onShareAppMessage() {
    return utils.getShareContent()
  },

  onShareTimeline() {
    return utils.getShareContent()
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadPageData().finally(() => {
      wx.stopPullDownRefresh()
    })
  }
})

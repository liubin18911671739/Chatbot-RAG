// pages/index/index.js
import apiService from '../../utils/api.js'
import storageManager from '../../utils/storage.js'
import utils from '../../utils/utils.js'
import authService from '../../utils/auth.js'

Page({
  data: {
    greeting: '欢迎使用棠心问答AI辅导员！',
    quickQuestions: [],
    isLoading: false,
    userInfo: null,
    hasUserInfo: false,
    canIUseGetUserProfile: false,
    recentChats: [],
    // 新增认证相关状态
    isLoggedIn: false,
    showLoginModal: false,
    loginLoading: false,
    username: '',
    password: ''
  },

  onLoad() {
    // 初始化API
    apiService.init()
    
    // 检查RADIUS认证状态
    this.checkAuthStatus()
    
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
    // 页面显示时刷新最近聊天和认证状态
    this.checkAuthStatus()
    this.loadRecentChats()
  },

  // 检查RADIUS认证状态
  checkAuthStatus() {
    const isLoggedIn = authService.checkLoginStatus()
    const currentUser = authService.getCurrentUser()
    
    this.setData({
      isLoggedIn: isLoggedIn,
      userInfo: currentUser
    })
    
    console.log('认证状态检查:', { isLoggedIn, currentUser })
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

  // 显示RADIUS登录弹窗
  showLogin() {
    this.setData({
      showLoginModal: true,
      username: '',
      password: ''
    })
  },

  // 隐藏登录弹窗
  hideLogin() {
    this.setData({
      showLoginModal: false,
      username: '',
      password: '',
      loginLoading: false
    })
  },

  // 输入用户名
  onUsernameInput(e) {
    this.setData({
      username: e.detail.value
    })
  },

  // 输入密码
  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    })
  },

  // RADIUS登录
  async onRadiusLogin() {
    const { username, password } = this.data
    
    if (!username.trim()) {
      utils.showToast('请输入用户名', 'none')
      return
    }
    
    if (!password.trim()) {
      utils.showToast('请输入密码', 'none')
      return
    }
    
    this.setData({ loginLoading: true })
    
    try {
      const result = await authService.loginWithRADIUS(username.trim(), password)
      
      if (result.success) {
        utils.showToast('登录成功', 'success')
        
        // 更新页面状态
        this.setData({
          isLoggedIn: true,
          userInfo: result.userData,
          showLoginModal: false,
          username: '',
          password: '',
          loginLoading: false
        })
        
        // 重新加载页面数据
        this.loadPageData()
        
      } else {
        console.error('RADIUS登录失败:', result)
        utils.showToast(result.message || '登录失败', 'none')
      }
    } catch (error) {
      console.error('登录过程出错:', error)
      utils.showToast('登录过程出错', 'none')
    } finally {
      this.setData({ loginLoading: false })
    }
  },

  // 退出登录
  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          const success = authService.logout()
          if (success) {
            this.setData({
              isLoggedIn: false,
              userInfo: null,
              hasUserInfo: false
            })
            utils.showToast('已退出登录', 'success')
            
            // 清除页面数据
            this.setData({
              quickQuestions: [],
              recentChats: []
            })
          } else {
            utils.showToast('退出登录失败', 'none')
          }
        }
      }
    })
  },

  // 开始新对话
  startNewChat() {
    // 检查是否已登录
    if (!this.data.isLoggedIn) {
      this.showLogin()
      return
    }
    
    wx.navigateTo({
      url: '/pages/chat/chat'
    })
  },

  // 选择场景
  selectScene() {
    // 检查是否已登录
    if (!this.data.isLoggedIn) {
      this.showLogin()
      return
    }
    
    wx.switchTab({
      url: '/pages/scenes/scenes'
    })
  },

  // 点击快速问题
  onQuickQuestionTap(e) {
    // 检查是否已登录
    if (!this.data.isLoggedIn) {
      this.showLogin()
      return
    }
    
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

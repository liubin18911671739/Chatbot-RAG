// pages/scenes/scenes.js
import apiService from '../../utils/api.js'
import storageManager from '../../utils/storage.js'
import utils from '../../utils/utils.js'
import authService from '../../utils/auth.js'

Page({
  data: {
    scenes: [],
    isLoading: false,
    searchText: '',
    filteredScenes: [],
    lastSelectedScene: null
  },

  onLoad() {
    // 检查认证状态
    if (!this.checkAuthStatus()) {
      return
    }
    
    // 初始化API
    apiService.init()
    
    // 加载场景数据
    this.loadScenes()
    
    // 获取上次选择的场景
    this.loadLastSelectedScene()
  },

  onShow() {
    // 页面显示时刷新数据
    if (this.checkAuthStatus()) {
      this.loadScenes()
    }
  },

  // 检查认证状态
  checkAuthStatus() {
    const isLoggedIn = authService.checkLoginStatus()
    if (!isLoggedIn) {
      wx.showModal({
        title: '需要登录',
        content: '请先进行认证后再使用场景功能',
        showCancel: false,
        success: () => {
          wx.switchTab({
            url: '/pages/index/index'
          })
        }
      })
      return false
    }
    return true
  },

  async loadScenes() {
    this.setData({ isLoading: true })
    
    try {
      const response = await apiService.getScenes()
      
      if (response && typeof response === 'object') {
        // 将场景对象转换为数组格式
        const scenesArray = Object.keys(response).map(key => ({
          name: key,
          ...response[key]
        }))
        
        this.setData({
          scenes: scenesArray,
          filteredScenes: scenesArray
        })
      }
    } catch (error) {
      console.error('加载场景失败:', error)
      utils.handleError(error, '加载场景失败')
    } finally {
      this.setData({ isLoading: false })
    }
  },

  loadLastSelectedScene() {
    const lastScene = storageManager.getLastScene()
    this.setData({ lastSelectedScene: lastScene })
  },

  // 搜索场景
  onSearchInput(e) {
    const searchText = e.detail.value.toLowerCase()
    this.setData({ searchText })
    
    if (!searchText) {
      this.setData({ filteredScenes: this.data.scenes })
      return
    }
    
    const filteredScenes = this.data.scenes.filter(scene => 
      scene.name.toLowerCase().includes(searchText) ||
      scene.description.toLowerCase().includes(searchText)
    )
    
    this.setData({ filteredScenes })
  },

  // 选择场景
  onSceneSelect(e) {
    const { scene } = e.currentTarget.dataset
    
    // 检查场景状态
    if (scene.status === 'unavailable') {
      utils.showToast('该场景暂时不可用', 'none')
      return
    }
    
    if (scene.status === 'developing') {
      utils.showToast('该场景正在开发中，部分功能可能不完整', 'none')
    }
    
    // 保存选择的场景
    storageManager.saveLastScene(scene.id)
    
    // 跳转到聊天页面
    wx.navigateTo({
      url: `/pages/chat/chat?sceneId=${scene.id}`
    })
  },

  // 查看场景详情
  onSceneDetail(e) {
    const { scene } = e.currentTarget.dataset
    
    wx.showModal({
      title: scene.name,
      content: `${scene.description}\n\n状态: ${this.getStatusText(scene.status)}`,
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 获取状态文本
  getStatusText(status) {
    const statusMap = {
      'available': '可用',
      'developing': '开发中',
      'unavailable': '不可用'
    }
    return statusMap[status] || '未知'
  },

  // 清空搜索
  clearSearch() {
    this.setData({
      searchText: '',
      filteredScenes: this.data.scenes
    })
  },

  // 刷新场景列表
  onRefresh() {
    this.loadScenes()
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
    this.loadScenes().finally(() => {
      wx.stopPullDownRefresh()
    })
  }
})

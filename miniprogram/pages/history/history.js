// pages/history/history.js
import storageManager from '../../utils/storage.js'
import utils from '../../utils/utils.js'

Page({
  data: {
    chatHistories: [],
    isLoading: false,
    searchText: '',
    filteredHistories: [],
    sortBy: 'time', // time, name, count
    sortOrder: 'desc' // desc, asc
  },

  onLoad() {
    this.loadChatHistories()
  },

  onShow() {
    // 页面显示时刷新历史记录
    this.loadChatHistories()
  },

  loadChatHistories() {
    this.setData({ isLoading: true })
    
    try {
      const histories = storageManager.getAllChatHistories()
      
      // 处理历史记录数据
      const processedHistories = histories.map(history => ({
        ...history,
        formattedTime: utils.formatChatTime(history.timestamp),
        preview: this.getMessagePreview(history.lastMessage)
      }))
      
      this.setData({
        chatHistories: processedHistories,
        filteredHistories: processedHistories
      })
      
      // 应用当前排序
      this.applySorting()
    } catch (error) {
      console.error('加载聊天历史失败:', error)
      utils.handleError(error, '加载历史记录失败')
    } finally {
      this.setData({ isLoading: false })
    }
  },

  getMessagePreview(message) {
    if (!message || !message.content) return '无内容'
    
    const content = message.content.trim()
    if (content.length > 50) {
      return content.substring(0, 50) + '...'
    }
    return content
  },

  // 搜索历史记录
  onSearchInput(e) {
    const searchText = e.detail.value.toLowerCase()
    this.setData({ searchText })
    
    if (!searchText) {
      this.setData({ filteredHistories: this.data.chatHistories })
      this.applySorting()
      return
    }
    
    const filteredHistories = this.data.chatHistories.filter(history => 
      history.sceneId.toLowerCase().includes(searchText) ||
      history.preview.toLowerCase().includes(searchText)
    )
    
    this.setData({ filteredHistories })
    this.applySorting()
  },

  // 清空搜索
  clearSearch() {
    this.setData({
      searchText: '',
      filteredHistories: this.data.chatHistories
    })
    this.applySorting()
  },

  // 排序设置
  onSortChange(e) {
    const { type } = e.currentTarget.dataset
    
    if (type === this.data.sortBy) {
      // 切换排序顺序
      this.setData({
        sortOrder: this.data.sortOrder === 'desc' ? 'asc' : 'desc'
      })
    } else {
      // 改变排序类型
      this.setData({
        sortBy: type,
        sortOrder: 'desc'
      })
    }
    
    this.applySorting()
  },

  // 应用排序
  applySorting() {
    const { filteredHistories, sortBy, sortOrder } = this.data
    
    const sorted = [...filteredHistories].sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'time':
          comparison = a.timestamp - b.timestamp
          break
        case 'name':
          comparison = a.sceneId.localeCompare(b.sceneId)
          break
        case 'count':
          comparison = a.messageCount - b.messageCount
          break
        default:
          comparison = a.timestamp - b.timestamp
      }
      
      return sortOrder === 'desc' ? -comparison : comparison
    })
    
    this.setData({ filteredHistories: sorted })
  },

  // 查看聊天历史
  viewChat(e) {
    const { sceneId } = e.currentTarget.dataset
    
    wx.navigateTo({
      url: `/pages/chat/chat?sceneId=${sceneId}`
    })
  },

  // 删除聊天历史
  async deleteChat(e) {
    e.stopPropagation() // 阻止事件冒泡
    
    const { sceneId } = e.currentTarget.dataset
    
    const confirmed = await utils.showConfirm(
      '确定要删除这个聊天记录吗？删除后无法恢复。',
      '删除确认'
    )
    
    if (confirmed) {
      storageManager.clearChatHistory(sceneId)
      this.loadChatHistories()
      utils.showToast('删除成功', 'success')
    }
  },

  // 清空所有历史记录
  async clearAllHistory() {
    const confirmed = await utils.showConfirm(
      '确定要清空所有聊天记录吗？此操作无法撤销。',
      '清空确认'
    )
    
    if (confirmed) {
      try {
        // 获取所有聊天历史的场景ID
        const histories = this.data.chatHistories
        histories.forEach(history => {
          storageManager.clearChatHistory(history.sceneId)
        })
        
        this.setData({
          chatHistories: [],
          filteredHistories: []
        })
        
        utils.showToast('已清空所有记录', 'success')
      } catch (error) {
        console.error('清空历史记录失败:', error)
        utils.handleError(error, '清空失败')
      }
    }
  },

  // 导出聊天记录
  exportHistory(e) {
    const { sceneId } = e.currentTarget.dataset
    
    try {
      const messages = storageManager.getChatHistory(sceneId)
      
      if (messages.length === 0) {
        utils.showToast('没有可导出的内容', 'none')
        return
      }
      
      // 格式化聊天记录为文本
      const exportText = this.formatChatForExport(messages, sceneId)
      
      // 复制到剪贴板
      utils.copyToClipboard(exportText)
      utils.showToast('聊天记录已复制到剪贴板', 'success')
    } catch (error) {
      console.error('导出失败:', error)
      utils.handleError(error, '导出失败')
    }
  },

  formatChatForExport(messages, sceneId) {
    const header = `=== 棠心问答聊天记录 ===\n场景: ${sceneId}\n导出时间: ${utils.formatTime(new Date())}\n\n`
    
    const content = messages.map(message => {
      const time = utils.formatTime(new Date(message.timestamp))
      const sender = message.sender === 'user' ? '用户' : 'AI助手'
      return `[${time}] ${sender}: ${message.content}`
    }).join('\n\n')
    
    return header + content
  },

  // 显示操作菜单
  showActionSheet(e) {
    const { sceneId } = e.currentTarget.dataset
    
    wx.showActionSheet({
      itemList: ['查看聊天', '导出记录', '删除记录'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.viewChat({ currentTarget: { dataset: { sceneId } } })
            break
          case 1:
            this.exportHistory({ currentTarget: { dataset: { sceneId } } })
            break
          case 2:
            this.deleteChat({ 
              currentTarget: { dataset: { sceneId } },
              stopPropagation: () => {}
            })
            break
        }
      }
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
    this.loadChatHistories()
    wx.stopPullDownRefresh()
  }
})

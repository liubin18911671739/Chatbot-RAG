// pages/chat/chat.js
import apiService from '../../utils/api.js'
import storageManager from '../../utils/storage.js'
import utils from '../../utils/utils.js'

Page({
  data: {
    messages: [],
    inputText: '',
    isLoading: false,
    currentScene: null,
    sceneId: null,
    scrollTop: 0,
    keyboardHeight: 0,
    isRecording: false,
    showScrollToBottom: false
  },

  onLoad(options) {
    // 初始化API
    apiService.init()
    
    // 处理页面参数
    this.handlePageOptions(options)
    
    // 加载聊天历史
    this.loadChatHistory()
    
    // 监听键盘高度变化
    this.setupKeyboardListener()
  },

  onShow() {
    // 滚动到底部
    this.scrollToBottom()
  },

  onUnload() {
    // 保存聊天历史
    this.saveChatHistory()
  },

  handlePageOptions(options) {
    // 处理场景ID
    if (options.sceneId) {
      this.setData({ sceneId: options.sceneId })
      // 可以根据sceneId获取场景信息
      this.loadSceneInfo(options.sceneId)
    }
    
    // 处理预设问题
    if (options.question) {
      const question = decodeURIComponent(options.question)
      // 延迟发送，确保页面加载完成
      setTimeout(() => {
        this.sendMessage(question)
      }, 500)
    }
  },

  async loadSceneInfo(sceneId) {
    try {
      const scenes = await apiService.getScenes()
      if (scenes && typeof scenes === 'object') {
        // 查找对应的场景
        const sceneInfo = Object.values(scenes).find(scene => scene.id === sceneId)
        if (sceneInfo) {
          this.setData({ currentScene: sceneInfo })
          wx.setNavigationBarTitle({
            title: sceneInfo.description || '棠心问答'
          })
        }
      }
    } catch (error) {
      console.error('加载场景信息失败:', error)
    }
  },

  loadChatHistory() {
    const messages = storageManager.getChatHistory(this.data.sceneId)
    this.setData({ messages })
    
    // 如果没有历史消息，显示欢迎消息
    if (messages.length === 0) {
      this.showWelcomeMessage()
    }
  },

  async showWelcomeMessage() {
    try {
      const greetingRes = await apiService.getGreeting()
      const welcomeMessage = {
        id: utils.generateId(),
        content: greetingRes.greeting || '你好！我是棠心问答AI辅导员，有什么可以帮助您的吗？',
        sender: 'ai',
        timestamp: Date.now(),
        type: 'text'
      }
      
      this.setData({
        messages: [welcomeMessage]
      })
    } catch (error) {
      console.error('获取欢迎消息失败:', error)
    }
  },

  setupKeyboardListener() {
    // 监听键盘高度变化
    wx.onKeyboardHeightChange((res) => {
      this.setData({
        keyboardHeight: res.height
      })
      
      // 键盘弹起时滚动到底部
      if (res.height > 0) {
        setTimeout(() => {
          this.scrollToBottom()
        }, 100)
      }
    })
  },

  // 输入框变化
  onInputChange(e) {
    this.setData({
      inputText: e.detail.value
    })
  },

  // 发送消息
  async sendMessage(customText = null) {
    const text = customText || this.data.inputText.trim()
    
    // 验证输入
    const validation = utils.validateInput(text)
    if (!validation.valid) {
      utils.showToast(validation.message)
      return
    }

    // 检查网络状态
    const isConnected = await utils.checkNetworkStatus()
    if (!isConnected) {
      utils.showToast('网络连接异常，请检查网络设置')
      return
    }

    // 创建用户消息
    const userMessage = {
      id: utils.generateId(),
      content: text,
      sender: 'user',
      timestamp: Date.now(),
      type: 'text'
    }

    // 更新UI
    this.setData({
      messages: [...this.data.messages, userMessage],
      inputText: '',
      isLoading: true
    })

    // 滚动到底部
    this.scrollToBottom()

    try {
      // 调用API
      const response = await apiService.sendMessage(text, this.getUserId(), this.data.sceneId)
      
      // 处理响应
      if (response.status === 'success') {
        const aiMessage = {
          id: utils.generateId(),
          content: utils.simpleMarkdownRender(response.response),
          sender: 'ai',
          timestamp: Date.now(),
          type: 'text',
          sources: response.sources || [],
          attachments: response.attachment_data || []
        }

        this.setData({
          messages: [...this.data.messages, aiMessage]
        })
      } else {
        // 处理错误响应
        this.handleApiError(response.message || '请求失败')
      }
    } catch (error) {
      console.error('发送消息失败:', error)
      this.handleApiError('网络请求失败，请稍后重试')
    } finally {
      this.setData({ isLoading: false })
      this.scrollToBottom()
      this.saveChatHistory()
    }
  },

  handleApiError(errorMessage) {
    const errorMsg = {
      id: utils.generateId(),
      content: `抱歉，${errorMessage}`,
      sender: 'ai',
      timestamp: Date.now(),
      type: 'error'
    }

    this.setData({
      messages: [...this.data.messages, errorMsg]
    })
  },

  // 获取用户ID
  getUserId() {
    const userInfo = storageManager.getUserInfo()
    return userInfo ? userInfo.nickName || 'miniprogram_user' : 'anonymous_user'
  },

  // 保存聊天历史
  saveChatHistory() {
    if (this.data.messages.length > 0) {
      storageManager.saveChatHistory(this.data.sceneId, this.data.messages)
    }
  },

  // 滚动到底部
  scrollToBottom() {
    this.setData({
      scrollTop: this.data.scrollTop + 1000
    })
  },

  // 清空聊天记录
  async clearChat() {
    const confirmed = await utils.showConfirm('确定要清空当前聊天记录吗？')
    if (confirmed) {
      this.setData({ messages: [] })
      storageManager.clearChatHistory(this.data.sceneId)
      this.showWelcomeMessage()
      utils.showToast('聊天记录已清空', 'success')
    }
  },

  // 复制消息
  copyMessage(e) {
    const { content } = e.currentTarget.dataset
    utils.copyToClipboard(content)
  },

  // 长按消息
  onMessageLongPress(e) {
    const { content, id } = e.currentTarget.dataset
    
    wx.showActionSheet({
      itemList: ['复制', '删除'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 复制
          utils.copyToClipboard(content)
        } else if (res.tapIndex === 1) {
          // 删除
          this.deleteMessage(id)
        }
      }
    })
  },

  // 删除消息
  deleteMessage(messageId) {
    const messages = this.data.messages.filter(msg => msg.id !== messageId)
    this.setData({ messages })
    this.saveChatHistory()
  },

  // 点击发送按钮
  onSendTap() {
    this.sendMessage()
  },

  // 键盘确认发送
  onInputConfirm() {
    this.sendMessage()
  },

  // 滚动事件
  onScroll(e) {
    const { scrollTop, scrollHeight } = e.detail
    const showScrollToBottom = scrollTop < scrollHeight - 1000
    
    if (showScrollToBottom !== this.data.showScrollToBottom) {
      this.setData({ showScrollToBottom })
    }
  },

  // 分享功能
  onShareAppMessage() {
    return utils.getShareContent(this.data.sceneId)
  },

  onShareTimeline() {
    return utils.getShareContent(this.data.sceneId)
  }
})

// pages/chat/chat.js
import apiService from '../../utils/api.js'
import storageManager from '../../utils/storage.js'
import utils from '../../utils/utils.js'
import networkValidator from '../../utils/network-validator.js'
import authService from '../../utils/auth.js'
const { getConfig } = require('../../config/env.js')

Page({
  data: {
    messages: [],
    inputText: '',
    isLoading: false,
    isInputEmpty: true, // 新增：用于判断输入是否为空
    currentScene: null,
    sceneId: null,
    scrollTop: 0,
    keyboardHeight: 0,
    isRecording: false,
    showScrollToBottom: false,
    networkStatus: 'wifi', // 网络状态
    isOnline: true, // 是否在线
    config: null // 环境配置
  },
  onLoad(options) {
    console.log('chat页面加载，参数:', options)
    
    // 检查认证状态
    if (!this.checkAuthStatus()) {
      return
    }
    
    // 获取环境配置
    const config = getConfig()
    this.setData({ config })
    
    // 验证校园网访问权限
    this.validateCampusAccess()
    
    // 检查网络状态
    this.checkNetworkStatus()
    
    // 初始化API
    apiService.init()
    console.log('API服务已初始化，baseUrl:', apiService.baseUrl)
    
    // 处理页面参数
    this.handlePageOptions(options)
    
    // 加载聊天历史
    this.loadChatHistory()
    
    // 监听键盘高度变化
    this.setupKeyboardListener()
    
    // 监听网络状态变化
    this.setupNetworkListener()
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
    })  },

  // 输入框变化
  onInputChange(e) {
    const inputText = e.detail.value
    const isEmpty = inputText.trim() === '';
    console.log('输入框内容变化:', {
      inputText,
      trimmed: inputText.trim(),
      length: inputText.trim().length,
      isEmpty: isEmpty
    })
    
    this.setData({
      inputText,
      isInputEmpty: isEmpty // 更新 isInputEmpty 状态
    })
  },

  // 发送消息
  async sendMessage(customText = null) {
    console.log('sendMessage 方法被调用', {
      customText,
      inputText: this.data.inputText,
      isLoading: this.data.isLoading
    })
    
    const text = customText || this.data.inputText.trim()
    console.log('准备发送的文本:', text)
    
    // 验证输入
    const validation = utils.validateInput(text)
    console.log('输入验证结果:', validation)
    
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
      isLoading: true,
      isInputEmpty: true // 输入框清空，所以设置为 true
    })

    // 滚动到底部
    this.scrollToBottom()

    try {
      // 调用API
      const response = await apiService.sendMessage(text, this.getUserId(), this.data.sceneId)
      
      console.log('API响应:', response)
      
      // 处理响应
      if (response && response.response) {
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
        
        console.log('AI消息已添加到聊天记录')
      } else {
        // 处理错误响应
        console.error('API响应格式异常:', response)
        this.handleApiError('服务器响应格式异常，请稍后重试')
      }
    } catch (error) {
      console.error('发送消息失败:', error)
      this.handleApiError('网络请求失败，请稍后重试')
    } finally {
      this.setData({ isLoading: false }) // isInputEmpty 保持 true 因为 inputText 为空
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
    console.log('发送按钮被点击', {
      inputText: this.data.inputText,
      isLoading: this.data.isLoading
    })
    
    const text = this.data.inputText.trim()
    if (!text) {
      utils.showToast('请输入消息内容')
      return
    }
    
    // 直接发送消息
    this.sendMessage()
  },

  // 键盘确认发送
  onInputConfirm() {
    console.log('键盘确认发送', {
      inputText: this.data.inputText,
      isLoading: this.data.isLoading
    })
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
  },

  // 检查网络状态
  checkNetworkStatus() {
    wx.getNetworkType({
      success: (res) => {
        console.log('网络类型:', res.networkType)
        this.setData({
          networkStatus: res.networkType,
          isOnline: res.networkType !== 'none'
        })
        
        if (res.networkType === 'none') {
          wx.showToast({
            title: '网络连接异常',
            icon: 'error'
          })
        }
      }
    })
  },

  // 监听网络状态变化
  setupNetworkListener() {
    wx.onNetworkStatusChange((res) => {
      console.log('网络状态变化:', res)
      this.setData({
        isOnline: res.isConnected,
        networkStatus: res.networkType
      })
      
      if (!res.isConnected) {
        wx.showToast({
          title: '网络已断开',
          icon: 'error'
        })
      } else {
        wx.showToast({
          title: '网络已恢复',
          icon: 'success',
          duration: 1000
        })
      }
    })
  },

  // 验证校园网访问权限
  async validateCampusAccess() {
    try {
      const app = getApp()
      
      // 如果全局已有验证结果且验证通过，直接返回
      if (app.globalData.networkValidation && app.globalData.networkValidation.isValid) {
        console.log('使用已缓存的网络验证结果')
        return true
      }

      console.log('聊天页面重新验证校园网环境...')
      const result = await networkValidator.validateCampusNetwork()
      
      if (!result.isValid) {
        console.log('聊天页面校园网验证失败:', result.reason)
        
        // 显示提示并跳转到限制页面
        wx.showModal({
          title: '访问受限',
          content: '检测到您不在校园网环境内，将跳转到说明页面',
          showCancel: false,
          confirmText: '确定',
          success: () => {
            wx.redirectTo({
              url: '/pages/access-denied/access-denied'
            })
          }
        })
        
        return false
      }

      console.log('聊天页面校园网验证通过')
      return true
      
    } catch (error) {
      console.error('聊天页面网络验证出错:', error)
      
      // 错误情况下是否允许继续使用（开发环境允许）
      const systemInfo = wx.getSystemInfoSync()
      const allowOnError = systemInfo.platform === 'devtools'
      
      if (!allowOnError) {
        wx.showModal({
          title: '网络验证失败',
          content: '无法验证网络环境，请检查网络连接后重试',
          showCancel: false,
          confirmText: '确定',
          success: () => {
            wx.navigateBack({
              delta: 1
            })
          }
        })
      }
      
      return allowOnError
    }
  },

  // 检查认证状态
  checkAuthStatus() {
    const isLoggedIn = authService.checkLoginStatus()
    if (!isLoggedIn) {
      wx.showModal({
        title: '需要登录',
        content: '请先进行认证后再使用聊天功能',
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
  }
})

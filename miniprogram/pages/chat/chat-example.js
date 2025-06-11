// 微信小程序 sendMessage 功能使用示例
// 文件: miniprogram/pages/chat/chat-example.js

// 导入必要的服务
import apiService from '../../utils/api.js'
import storageManager from '../../utils/storage.js'
import utils from '../../utils/utils.js'

Page({
  data: {
    messages: [],
    inputText: '',
    isLoading: false,
    sceneId: null,
    currentScene: null
  },

  onLoad() {
    // 初始化API服务
    apiService.init()
  },

  /**
   * 发送消息的完整实现示例
   * 包含所有错误处理和状态管理
   */
  async sendMessage(customText = null) {
    const text = customText || this.data.inputText.trim()
    
    // 1. 输入验证
    if (!text) {
      utils.showToast('请输入消息内容')
      return
    }

    if (text.length > 500) {
      utils.showToast('消息内容过长，请控制在500字以内')
      return
    }

    // 2. 网络状态检查
    const isConnected = await utils.checkNetworkStatus()
    if (!isConnected) {
      utils.showToast('网络连接异常，请检查网络设置')
      return
    }

    // 3. 创建用户消息
    const userMessage = {
      id: utils.generateId(),
      content: text,
      sender: 'user',
      timestamp: Date.now(),
      type: 'text'
    }

    // 4. 更新UI状态
    this.setData({
      messages: [...this.data.messages, userMessage],
      inputText: '',
      isLoading: true
    })

    // 5. 滚动到底部显示最新消息
    this.scrollToBottom()

    try {
      console.log('📤 发送消息:', {
        prompt: text,
        userId: this.getUserId(),
        sceneId: this.data.sceneId
      })

      // 6. 调用新的 sendMessage API
      const response = await apiService.sendMessage(
        text, 
        this.getUserId(), 
        this.data.sceneId
      )

      console.log('📥 收到响应:', response)

      // 7. 处理成功响应
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

        console.log('✅ AI消息已添加到聊天记录')
        
      } else {
        // 处理响应格式异常
        this.handleApiError('收到了无效的响应格式')
      }

    } catch (error) {
      console.error('❌ 发送消息失败:', error)
      
      // 8. 错误处理 - 根据错误类型显示不同提示
      let errorMessage = '发送失败，请稍后重试'
      
      if (error.message.includes('超时')) {
        errorMessage = '网络响应超时，请检查网络连接后重试'
      } else if (error.message.includes('网络')) {
        errorMessage = '网络连接失败，请检查网络设置'
      } else if (error.message.includes('服务器')) {
        errorMessage = '服务器暂时无法响应，请稍后重试'
      }
      
      this.handleApiError(errorMessage)
      
    } finally {
      // 9. 清理状态
      this.setData({ isLoading: false })
      this.scrollToBottom()
      this.saveChatHistory()
    }
  },

  /**
   * 处理API错误
   */
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

    utils.showToast(errorMessage)
  },

  /**
   * 获取用户ID
   */
  getUserId() {
    const userInfo = storageManager.getUserInfo()
    return userInfo ? userInfo.nickName || 'miniprogram_user' : 'anonymous_user'
  },

  /**
   * 保存聊天历史
   */
  saveChatHistory() {
    if (this.data.messages.length > 0) {
      storageManager.saveChatHistory(this.data.sceneId, this.data.messages)
    }
  },

  /**
   * 滚动到底部
   */
  scrollToBottom() {
    this.setData({
      scrollTop: this.data.scrollTop + 1000
    })
  },

  /**
   * 输入框变化处理
   */
  onInputChange(e) {
    this.setData({
      inputText: e.detail.value
    })
  },

  /**
   * 发送按钮点击
   */
  onSendTap() {
    this.sendMessage()
  },

  /**
   * 键盘确认发送
   */
  onInputConfirm() {
    this.sendMessage()
  },

  /**
   * 快速发送预设问题
   */
  sendQuickQuestion(e) {
    const question = e.currentTarget.dataset.question
    this.sendMessage(question)
  },

  /**
   * 重试发送上一条消息
   */
  async retryLastMessage() {
    const messages = this.data.messages
    const lastUserMessage = messages.reverse().find(msg => msg.sender === 'user')
    
    if (lastUserMessage) {
      await this.sendMessage(lastUserMessage.content)
    } else {
      utils.showToast('没有找到可重试的消息')
    }
  }
})

/**
 * 使用场景示例：
 * 
 * 1. 基本发送消息：
 *    this.sendMessage('你好，请问什么是AI？')
 * 
 * 2. 带场景的消息：
 *    this.setData({ sceneId: 'db_sizheng' })
 *    this.sendMessage('请解释中国特色社会主义')
 * 
 * 3. 处理快速问题：
 *    <button bindtap="sendQuickQuestion" data-question="学校的历史是什么？">
 *      快速提问
 *    </button>
 * 
 * 4. 重试机制：
 *    <button bindtap="retryLastMessage">重试</button>
 */

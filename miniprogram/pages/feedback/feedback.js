// pages/feedback/feedback.js
import apiService from '../../utils/api.js'
import storageManager from '../../utils/storage.js'
import utils from '../../utils/utils.js'

Page({
  data: {
    feedbackType: 'suggestion', // suggestion, bug, other
    feedbackContent: '',
    contactInfo: '',
    isSubmitting: false,
    images: [], // 截图附件
    maxImages: 3,
    feedbackTypes: [
      { value: 'suggestion', label: '功能建议', icon: '💡' },
      { value: 'bug', label: '问题反馈', icon: '🐛' },
      { value: 'content', label: '内容问题', icon: '📝' },
      { value: 'other', label: '其他', icon: '💬' }
    ]
  },

  onLoad() {
    // 初始化API
    apiService.init()
    
    // 加载用户联系信息
    this.loadUserContact()
  },

  loadUserContact() {
    const userInfo = storageManager.getUserInfo()
    if (userInfo && userInfo.nickName) {
      this.setData({
        contactInfo: userInfo.nickName
      })
    }
  },

  // 选择反馈类型
  onTypeSelect(e) {
    const { type } = e.currentTarget.dataset
    this.setData({ feedbackType: type })
  },

  // 输入反馈内容
  onContentInput(e) {
    this.setData({
      feedbackContent: e.detail.value
    })
  },

  // 输入联系信息
  onContactInput(e) {
    this.setData({
      contactInfo: e.detail.value
    })
  },

  // 选择图片
  chooseImage() {
    const { images, maxImages } = this.data
    const remainingCount = maxImages - images.length
    
    if (remainingCount <= 0) {
      utils.showToast(`最多只能上传${maxImages}张图片`, 'none')
      return
    }
    
    wx.chooseImage({
      count: remainingCount,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newImages = [...images, ...res.tempFilePaths]
        this.setData({ images: newImages })
      },
      fail: (error) => {
        console.error('选择图片失败:', error)
        utils.showToast('选择图片失败', 'none')
      }
    })
  },

  // 预览图片
  previewImage(e) {
    const { index } = e.currentTarget.dataset
    const { images } = this.data
    
    wx.previewImage({
      current: images[index],
      urls: images
    })
  },

  // 删除图片
  deleteImage(e) {
    const { index } = e.currentTarget.dataset
    const images = [...this.data.images]
    images.splice(index, 1)
    this.setData({ images })
  },

  // 提交反馈
  async submitFeedback() {
    // 验证输入
    const validation = this.validateInput()
    if (!validation.valid) {
      utils.showToast(validation.message, 'none')
      return
    }

    this.setData({ isSubmitting: true })

    try {
      // 准备反馈数据
      const feedbackData = {
        type: this.data.feedbackType,
        content: this.data.feedbackContent.trim(),
        contact: this.data.contactInfo.trim(),
        timestamp: Date.now(),
        userAgent: this.getUserAgent(),
        images: [] // 简化处理，暂不上传图片
      }

      // 提交反馈
      const response = await apiService.submitFeedback(feedbackData)
      
      if (response.status === 'success') {
        // 保存到本地（备份）
        this.saveFeedbackLocally(feedbackData)
        
        // 显示成功信息
        await this.showSuccessDialog()
        
        // 返回上一页
        wx.navigateBack()
      } else {
        throw new Error(response.message || '提交失败')
      }
    } catch (error) {
      console.error('提交反馈失败:', error)
      
      // 保存到本地（离线提交）
      this.saveFeedbackLocally({
        type: this.data.feedbackType,
        content: this.data.feedbackContent.trim(),
        contact: this.data.contactInfo.trim(),
        timestamp: Date.now(),
        status: 'offline'
      })
      
      utils.handleError(error, '提交失败，已保存到本地，稍后会自动重试')
    } finally {
      this.setData({ isSubmitting: false })
    }
  },

  // 验证输入
  validateInput() {
    const { feedbackContent, feedbackType } = this.data
    
    if (!feedbackType) {
      return { valid: false, message: '请选择反馈类型' }
    }
    
    if (!feedbackContent.trim()) {
      return { valid: false, message: '请输入反馈内容' }
    }
    
    if (feedbackContent.trim().length < 10) {
      return { valid: false, message: '反馈内容至少需要10个字符' }
    }
    
    if (feedbackContent.trim().length > 500) {
      return { valid: false, message: '反馈内容不能超过500个字符' }
    }
    
    return { valid: true }
  },

  // 获取用户代理信息
  getUserAgent() {
    try {
      const systemInfo = wx.getSystemInfoSync()
      return {
        platform: systemInfo.platform,
        version: systemInfo.version,
        model: systemInfo.model,
        brand: systemInfo.brand,
        system: systemInfo.system
      }
    } catch (error) {
      return {}
    }
  },

  // 本地保存反馈
  saveFeedbackLocally(feedbackData) {
    try {
      const feedbacks = storageManager.get('feedbacks', [])
      feedbacks.push({
        id: utils.generateId(),
        ...feedbackData
      })
      storageManager.set('feedbacks', feedbacks)
    } catch (error) {
      console.error('保存反馈到本地失败:', error)
    }
  },

  // 显示成功对话框
  showSuccessDialog() {
    return new Promise((resolve) => {
      wx.showModal({
        title: '提交成功',
        content: '感谢您的反馈！我们会认真处理您的建议。',
        showCancel: false,
        confirmText: '确定',
        success: resolve
      })
    })
  },

  // 清空表单
  clearForm() {
    this.setData({
      feedbackType: 'suggestion',
      feedbackContent: '',
      contactInfo: '',
      images: []
    })
    utils.showToast('表单已清空', 'success')
  },

  // 获取反馈类型标签
  getTypeLabel(type) {
    const typeObj = this.data.feedbackTypes.find(t => t.value === type)
    return typeObj ? typeObj.label : '未知类型'
  },

  // 分享功能
  onShareAppMessage() {
    return utils.getShareContent()
  },

  onShareTimeline() {
    return utils.getShareContent()
  }
})

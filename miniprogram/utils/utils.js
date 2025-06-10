// utils/utils.js

// 通用工具函数
export const utils = {
  
  // 格式化时间
  formatTime(date) {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()
    const second = date.getSeconds()

    return `${[year, month, day].map(this.formatNumber).join('/')} ${[hour, minute, second].map(this.formatNumber).join(':')}`
  },

  // 格式化数字（补零）
  formatNumber(n) {
    n = n.toString()
    return n[1] ? n : '0' + n
  },

  // 格式化聊天时间
  formatChatTime(timestamp) {
    const now = new Date()
    const date = new Date(timestamp)
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) {
      return '刚刚'
    } else if (diffMins < 60) {
      return `${diffMins}分钟前`
    } else if (diffHours < 24) {
      return `${diffHours}小时前`
    } else if (diffDays < 7) {
      return `${diffDays}天前`
    } else {
      return this.formatTime(date)
    }
  },

  // 防抖函数
  debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  },

  // 节流函数
  throttle(func, limit) {
    let inThrottle
    return function() {
      const args = arguments
      const context = this
      if (!inThrottle) {
        func.apply(context, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  },

  // 显示Toast
  showToast(title, icon = 'none', duration = 2000) {
    wx.showToast({
      title,
      icon,
      duration
    })
  },

  // 显示Loading
  showLoading(title = '加载中...') {
    wx.showLoading({
      title,
      mask: true
    })
  },

  // 隐藏Loading
  hideLoading() {
    wx.hideLoading()
  },

  // 显示确认对话框
  showConfirm(content, title = '提示') {
    return new Promise((resolve) => {
      wx.showModal({
        title,
        content,
        success(res) {
          resolve(res.confirm)
        }
      })
    })
  },

  // 复制到剪贴板
  copyToClipboard(text) {
    return new Promise((resolve, reject) => {
      wx.setClipboardData({
        data: text,
        success() {
          wx.showToast({
            title: '已复制到剪贴板',
            icon: 'success'
          })
          resolve()
        },
        fail: reject
      })
    })
  },

  // 分享功能
  getShareContent(scene = null) {
    return {
      title: '棠心问答 - 北京第二外国语学院AI助手',
      path: scene ? `/pages/chat/chat?scene=${scene}` : '/pages/index/index',
      imageUrl: '/images/share-logo.png'
    }
  },

  // 检查网络状态
  checkNetworkStatus() {
    return new Promise((resolve) => {
      wx.getNetworkType({
        success(res) {
          resolve(res.networkType !== 'none')
        },
        fail() {
          resolve(false)
        }
      })
    })
  },

  // 获取用户系统信息
  getSystemInfo() {
    return new Promise((resolve) => {
      wx.getSystemInfo({
        success: resolve,
        fail: () => resolve({})
      })
    })
  },

  // 生成唯一ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  },

  // 处理错误信息
  handleError(error, defaultMessage = '操作失败') {
    console.error('Error:', error)
    
    let message = defaultMessage
    if (error && typeof error === 'object') {
      if (error.errMsg) {
        message = error.errMsg
      } else if (error.message) {
        message = error.message
      } else if (error.data && error.data.message) {
        message = error.data.message
      }
    } else if (typeof error === 'string') {
      message = error
    }

    this.showToast(message, 'none')
  },

  // 验证输入内容
  validateInput(text, maxLength = 500) {
    if (!text || !text.trim()) {
      return { valid: false, message: '请输入内容' }
    }
    
    if (text.trim().length > maxLength) {
      return { valid: false, message: `内容不能超过${maxLength}个字符` }
    }
    
    return { valid: true }
  },

  // 处理Markdown简单渲染（微信小程序用）
  simpleMarkdownRender(text) {
    if (!text) return ''
    
    // 处理换行
    text = text.replace(/\n/g, '\n')
    
    // 处理粗体
    text = text.replace(/\*\*(.*?)\*\*/g, '$1')
    
    // 处理链接（转换为纯文本）
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    
    return text
  }
}

export default utils

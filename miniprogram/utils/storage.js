// utils/storage.js

// 存储管理工具
class StorageManager {
  constructor() {
    this.prefix = 'ichat_'
  }

  // 设置存储
  set(key, value) {
    try {
      const fullKey = this.prefix + key
      wx.setStorageSync(fullKey, JSON.stringify(value))
      return true
    } catch (error) {
      console.error('存储数据失败:', error)
      return false
    }
  }

  // 获取存储
  get(key, defaultValue = null) {
    try {
      const fullKey = this.prefix + key
      const value = wx.getStorageSync(fullKey)
      return value ? JSON.parse(value) : defaultValue
    } catch (error) {
      console.error('获取存储数据失败:', error)
      return defaultValue
    }
  }

  // 删除存储
  remove(key) {
    try {
      const fullKey = this.prefix + key
      wx.removeStorageSync(fullKey)
      return true
    } catch (error) {
      console.error('删除存储数据失败:', error)
      return false
    }
  }

  // 清空所有存储
  clear() {
    try {
      wx.clearStorageSync()
      return true
    } catch (error) {
      console.error('清空存储失败:', error)
      return false
    }
  }

  // 聊天历史相关
  saveChatHistory(sceneId, messages) {
    const key = `chat_history_${sceneId || 'general'}`
    return this.set(key, {
      messages,
      timestamp: Date.now()
    })
  }

  getChatHistory(sceneId) {
    const key = `chat_history_${sceneId || 'general'}`
    const data = this.get(key)
    if (data && data.messages) {
      return data.messages
    }
    return []
  }

  // 用户信息相关
  saveUserInfo(userInfo) {
    return this.set('user_info', userInfo)
  }

  getUserInfo() {
    return this.get('user_info')
  }

  // 场景选择历史
  saveLastScene(sceneId) {
    return this.set('last_scene', sceneId)
  }

  getLastScene() {
    return this.get('last_scene')
  }

  // 设置项
  saveSettings(settings) {
    return this.set('settings', settings)
  }

  getSettings() {
    return this.get('settings', {
      enableSound: true,
      enableVibration: true,
      fontSize: 'medium',
      theme: 'light'
    })
  }

  // 获取所有聊天历史列表
  getAllChatHistories() {
    try {
      const res = wx.getStorageInfoSync()
      const chatKeys = res.keys.filter(key => 
        key.startsWith(this.prefix + 'chat_history_')
      )
      
      const histories = []
      chatKeys.forEach(key => {
        const data = wx.getStorageSync(key)
        if (data) {
          const parsed = JSON.parse(data)
          const sceneId = key.replace(this.prefix + 'chat_history_', '')
          histories.push({
            sceneId,
            lastMessage: parsed.messages[parsed.messages.length - 1],
            timestamp: parsed.timestamp,
            messageCount: parsed.messages.length
          })
        }
      })
      
      // 按时间戳倒序排列
      return histories.sort((a, b) => b.timestamp - a.timestamp)
    } catch (error) {
      console.error('获取聊天历史列表失败:', error)
      return []
    }
  }

  // 删除特定场景的聊天历史
  clearChatHistory(sceneId) {
    const key = `chat_history_${sceneId || 'general'}`
    return this.remove(key)
  }
}

// 创建全局存储管理器实例
const storageManager = new StorageManager()

export default storageManager

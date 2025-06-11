// pages/admin-config/admin-config.js
import networkValidator from '../../utils/network-validator.js'

Page({
  data: {
    isAdmin: false,
    adminPassword: '',
    showPasswordInput: false,
    networkConfig: {
      restrictionEnabled: true,
      allowDevelopment: true,
      campusApiHosts: [],
      maxRetries: 3
    },
    accessLogs: [],
    systemInfo: {}
  },

  onLoad() {
    this.checkAdminAccess()
    this.loadSystemInfo()
    this.loadNetworkConfig()
    this.loadAccessLogs()
  },

  // 检查管理员访问权限
  checkAdminAccess() {
    const adminKey = wx.getStorageSync('admin_key')
    if (adminKey === 'bisu_admin_2024') {
      this.setData({ isAdmin: true })
    } else {
      this.setData({ showPasswordInput: true })
    }
  },

  // 输入管理员密码
  onPasswordInput(e) {
    this.setData({
      adminPassword: e.detail.value
    })
  },

  // 验证管理员密码
  onAdminLogin() {
    const password = this.data.adminPassword
    if (password === 'bisu2024admin') {
      wx.setStorageSync('admin_key', 'bisu_admin_2024')
      this.setData({
        isAdmin: true,
        showPasswordInput: false,
        adminPassword: ''
      })
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })
    } else {
      wx.showToast({
        title: '密码错误',
        icon: 'error'
      })
    }
  },

  // 加载系统信息
  loadSystemInfo() {
    const systemInfo = wx.getSystemInfoSync()
    this.setData({ systemInfo })
  },

  // 加载网络配置
  loadNetworkConfig() {
    const config = {
      restrictionEnabled: networkValidator.restrictionEnabled,
      allowDevelopment: networkValidator.allowDevelopment,
      campusApiHosts: networkValidator.campusApiHosts,
      maxRetries: 3
    }
    this.setData({ networkConfig: config })
  },

  // 加载访问日志
  loadAccessLogs() {
    const logs = networkValidator.getAccessLogs()
    this.setData({ accessLogs: logs.slice(-20) }) // 显示最近20条
  },

  // 切换校园网限制
  onToggleRestriction(e) {
    const enabled = e.detail.value
    networkValidator.setRestrictionEnabled(enabled)
    this.setData({
      'networkConfig.restrictionEnabled': enabled
    })
    
    wx.showToast({
      title: enabled ? '已启用校园网限制' : '已禁用校园网限制',
      icon: 'success'
    })
  },

  // 清空访问日志
  onClearLogs() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有访问日志吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('access_logs')
          this.setData({ accessLogs: [] })
          wx.showToast({
            title: '日志已清空',
            icon: 'success'
          })
        }
      }
    })
  },
  // 测试网络连接
  async onTestNetwork() {
    wx.showLoading({
      title: '正在测试...',
      mask: true
    })

    try {
      // 测试基础网络连接
      const networkResult = await networkValidator.checkNetworkConnectivity()
      console.log('网络连接测试:', networkResult)

      // 测试校园API访问
      const apiResult = await networkValidator.checkCampusApiAccess()
      console.log('校园API测试:', apiResult)

      // 测试地理位置
      let locationMessage = '地理位置测试未执行'
      try {
        const locationResult = await this.testGeolocation()
        locationMessage = `地理位置: ${locationResult.valid ? '校园内' : '校园外'}`
      } catch (error) {
        locationMessage = `地理位置测试失败: ${error.message}`
      }

      // 汇总测试结果
      const testResults = [
        `网络连接: ${networkResult.connected ? '✓ 正常' : '✗ 异常'}`,
        `校园API: ${apiResult.accessible ? '✓ 可访问' : '✗ 不可访问'}`,
        `${locationMessage}`,
        `系统平台: ${this.data.systemInfo.platform}`,
        `网络类型: ${this.data.systemInfo.networkType || '未知'}`
      ]

      wx.hideLoading()
      wx.showModal({
        title: '网络连接测试结果',
        content: testResults.join('\n'),
        showCancel: false,
        confirmText: '确定'
      })

    } catch (error) {
      wx.hideLoading()
      console.error('网络测试失败:', error)
      wx.showModal({
        title: '测试失败',
        content: `测试过程中发生错误: ${error.message}`,
        showCancel: false,
        confirmText: '确定'
      })
    }
  },

  // 测试地理位置
  testGeolocation() {
    return new Promise((resolve, reject) => {
      wx.getLocation({
        type: 'gcj02',
        isHighAccuracy: true,
        success: (res) => {
          const { latitude, longitude } = res
          const isInCampus = networkValidator.isInCampusBoundary(latitude, longitude)
          resolve({
            valid: isInCampus,
            latitude,
            longitude,
            message: `坐标: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          })
        },
        fail: (error) => {
          reject(new Error('获取地理位置失败: ' + (error.errMsg || '未知错误')))
        }
      })
    })
  },

  // 导出配置
  onExportConfig() {
    const config = {
      networkConfig: this.data.networkConfig,
      systemInfo: this.data.systemInfo,
      accessLogs: this.data.accessLogs,
      exportTime: new Date().toISOString()
    }
    
    wx.setClipboardData({
      data: JSON.stringify(config, null, 2),
      success: () => {
        wx.showToast({
          title: '配置已复制到剪贴板',
          icon: 'success'
        })
      }
    })
  },

  // 退出管理员模式
  onLogout() {
    wx.removeStorageSync('admin_key')
    this.setData({
      isAdmin: false,
      showPasswordInput: true
    })
    wx.showToast({
      title: '已退出管理员模式',
      icon: 'success'
    })
  }
})

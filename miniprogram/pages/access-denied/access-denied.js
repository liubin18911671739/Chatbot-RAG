// pages/access-denied/access-denied.js
import networkValidator from '../../utils/network-validator.js'

Page({
  data: {
    title: '访问受限',
    subtitle: '此应用仅限校园网内使用',
    instructions: [
      '请确保您已连接到校园WiFi网络',
      '或使用校园有线网络连接',
      '如仍无法访问，请联系网络与信息中心'
    ],
    contactInfo: {
      phone: '65778941',
      office: '人文楼316',
      email: 'netcenter@bisu.edu.cn'
    },
    retryCount: 0,
    maxRetries: 3
  },

  onLoad() {
    console.log('访问拒绝页面加载')
    this.checkSystemInfo()
  },

  // 检查系统信息
  checkSystemInfo() {
    const systemInfo = wx.getSystemInfoSync()
    this.setData({
      systemInfo: {
        platform: systemInfo.platform,
        system: systemInfo.system,
        version: systemInfo.version
      }
    })
  },

  // 重试网络检测
  async onRetry() {
    if (this.data.retryCount >= this.data.maxRetries) {
      wx.showToast({
        title: '重试次数已达上限',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '检测网络环境...'
    })

    try {
      const result = await networkValidator.validateCampusNetwork()
      
      this.setData({
        retryCount: this.data.retryCount + 1
      })

      if (result.isValid) {
        wx.hideLoading()
        wx.showToast({
          title: '网络验证通过',
          icon: 'success'
        })
        
        // 延迟跳转到首页
        setTimeout(() => {
          wx.reLaunch({
            url: '/pages/index/index'
          })
        }, 1500)
      } else {
        wx.hideLoading()
        wx.showToast({
          title: result.message || '网络验证失败',
          icon: 'none',
          duration: 2000
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('重试检测失败:', error)
      wx.showToast({
        title: '检测失败，请稍后重试',
        icon: 'none'
      })
    }
  },

  // 查看网络设置帮助
  onNetworkHelp() {
    wx.showModal({
      title: '网络连接帮助',
      content: '1. 打开手机设置\n2. 进入无线网络设置\n3. 连接到以下WiFi之一：\n   • BISUWIFI\n   • BISU-Student\n   • eduroam\n4. 输入您的校园网账号密码',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 联系技术支持
  onContactSupport() {
    wx.showActionSheet({
      itemList: [
        '拨打技术支持电话',
        '查看办公地点',
        '发送邮件咨询'
      ],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.callSupport()
            break
          case 1:
            this.showOfficeLocation()
            break
          case 2:
            this.sendEmail()
            break
        }
      }
    })
  },

  // 拨打技术支持电话
  callSupport() {
    wx.makePhoneCall({
      phoneNumber: this.data.contactInfo.phone,
      fail: () => {
        wx.setClipboardData({
          data: this.data.contactInfo.phone,
          success: () => {
            wx.showToast({
              title: '电话号码已复制',
              icon: 'success'
            })
          }
        })
      }
    })
  },

  // 显示办公地点
  showOfficeLocation() {
    wx.showModal({
      title: '技术支持办公地点',
      content: `办公地点：${this.data.contactInfo.office}\n电话：${this.data.contactInfo.phone}`,
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 发送邮件
  sendEmail() {
    wx.setClipboardData({
      data: this.data.contactInfo.email,
      success: () => {
        wx.showToast({
          title: '邮箱地址已复制',
          icon: 'success'
        })
      }
    })
  },

  // 查看访问日志（调试用）
  onShowLogs() {
    const logs = networkValidator.getAccessLogs()
    console.log('访问日志:', logs)
    
    wx.showModal({
      title: '访问记录',
      content: `共${logs.length}条访问记录\n最近访问：${logs.length > 0 ? new Date(logs[logs.length - 1].timestamp).toLocaleString() : '无'}`,
      showCancel: false,
      confirmText: '知道了'
    })
  }
})

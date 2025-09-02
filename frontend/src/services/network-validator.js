// utils/network-validator.js
// 校园网络访问控制工具类

class NetworkValidator {
  constructor() {
    this.campusNetworkRanges = [
      '10.10.0.0/16',      // 校园网主要段
      '192.168.0.0/16',    // 内网段
      '172.16.0.0/12'      // 私有网络段
    ]
    
    this.campusApiHosts = [
      '10.10.15.211',      // 当前API服务器
      '10.10.15.210',      // 备用服务器
      // 'localhost',         // 本地开发
      // '127.0.0.1'          // 本地回环
    ]
    
    this.restrictionEnabled = true  // 是否启用校园网限制
    this.allowDevelopment = true    // 是否允许开发环境绕过
  }
  /**
   * 检测是否在校园网环境
   * @returns {Promise<Object>} 检测结果
   */
  async validateCampusNetwork() {
    try {
      console.log('开始校园网环境检测...')
      
      // 检查环境配置是否启用校园网限制
      const { getConfig } = require('../config/env.js')
      const config = getConfig()
      
      if (!config.campusRestriction) {
        console.log('当前环境已禁用校园网限制:', config.env)
        return {
          isValid: true,
          reason: 'restriction_disabled_by_config',
          message: `${config.env}环境已禁用校园网限制`
        }
      }
      
      // 检查是否在开发环境
      if (this.allowDevelopment && this.isDevelopmentEnvironment()) {
        console.log('开发环境，跳过校园网检测')
        return {
          isValid: true,
          reason: 'development_environment',
          message: '开发环境'
        }
      }

      // 如果限制功能被禁用
      if (!this.restrictionEnabled) {
        console.log('校园网限制已禁用')
        return {
          isValid: true,
          reason: 'restriction_disabled',
          message: '访问限制已禁用'
        }
      }

      // 检测网络连接性
      const networkCheck = await this.checkNetworkConnectivity()
      if (!networkCheck.connected) {
        return {
          isValid: false,
          reason: 'no_network',
          message: '无网络连接'
        }
      }

      // 检测API服务器可达性
      const apiCheck = await this.checkCampusApiAccess()
      if (!apiCheck.accessible) {
        return {
          isValid: false,
          reason: 'api_unreachable',
          message: '无法访问校园网服务器，请确保您在校园网环境内'
        }
      }

      // 检查用户位置（如果支持）
      const locationCheck = await this.checkUserLocation()
      
      console.log('校园网环境验证通过')
      return {
        isValid: true,
        reason: 'campus_network_verified',
        message: '校园网环境验证通过',
        location: locationCheck
      }

    } catch (error) {
      console.error('校园网检测失败:', error)
      return {
        isValid: false,
        reason: 'detection_failed',
        message: '网络环境检测失败，请稍后重试'
      }
    }
  }

  /**
   * 检查是否为开发环境
   */
  isDevelopmentEnvironment() {
    const systemInfo = wx.getSystemInfoSync()
    return systemInfo.platform === 'devtools'
  }

  /**
   * 检测基本网络连接性
   */
  async checkNetworkConnectivity() {
    return new Promise((resolve) => {
      wx.getNetworkType({
        success: (res) => {
          const connected = res.networkType !== 'none'
          console.log('网络连接状态:', connected ? '已连接' : '未连接', res.networkType)
          resolve({
            connected,
            type: res.networkType
          })
        },
        fail: () => {
          console.log('获取网络状态失败')
          resolve({ connected: false })
        }
      })
    })
  }

  /**
   * 检测校园API服务器可达性
   */
  async checkCampusApiAccess() {
    console.log('检测校园API服务器可达性...')
    
    for (const host of this.campusApiHosts) {
      try {
        const url = host.includes('://') ? host : `http://${host}:5000`
        console.log(`测试访问: ${url}/api/health`)
        
        const accessible = await this.testApiEndpoint(`${url}/api/health`)
        if (accessible) {
          console.log(`校园API服务器可访问: ${host}`)
          return {
            accessible: true,
            host: host,
            url: url
          }
        }
      } catch (error) {
        console.log(`服务器 ${host} 不可访问:`, error.message)
      }
    }

    console.log('所有校园API服务器均不可访问')
    return {
      accessible: false,
      host: null
    }
  }

  /**
   * 测试API端点连通性
   */
  async testApiEndpoint(url) {
    return new Promise((resolve) => {
      wx.request({
        url: url,
        method: 'GET',
        timeout: 5000,
        success: (res) => {
          console.log(`API端点 ${url} 响应:`, res.statusCode)
          resolve(res.statusCode >= 200 && res.statusCode < 400)
        },
        fail: (error) => {
          console.log(`API端点 ${url} 请求失败:`, error)
          resolve(false)
        }
      })
    })
  }

  /**
   * 检查用户地理位置（可选）
   */
  async checkUserLocation() {
    return new Promise((resolve) => {
      wx.getLocation({
        type: 'gcj02',
        success: (res) => {
          const location = {
            latitude: res.latitude,
            longitude: res.longitude,
            accuracy: res.accuracy
          }
          
          // 这里可以添加校园地理位置验证逻辑
          // 例如检查是否在学校坐标范围内
          const inCampus = this.isLocationInCampus(location)
          
          console.log('位置信息:', location, '是否在校园:', inCampus)
          resolve({
            available: true,
            inCampus: inCampus,
            ...location
          })
        },
        fail: () => {
          console.log('无法获取位置信息')
          resolve({
            available: false,
            inCampus: null
          })
        }
      })
    })
  }

  /**
   * 检查位置是否在校园内（示例实现）
   */
  isLocationInCampus(location) {
    // 北京第二外国语学院大致坐标范围（示例）
    const campusBounds = {
      north: 39.9500,
      south: 39.9400,
      east: 116.4700,
      west: 116.4600
    }

    return location.latitude >= campusBounds.south &&
           location.latitude <= campusBounds.north &&
           location.longitude >= campusBounds.west &&
           location.longitude <= campusBounds.east
  }

  /**
   * 显示访问限制提示
   */
  showAccessDeniedMessage(result) {
    let title = '访问受限'
    let content = '此应用仅限在校园网环境内使用'

    switch (result.reason) {
      case 'no_network':
        content = '网络连接异常，请检查网络设置'
        break
      case 'api_unreachable':
        content = '无法连接到校园网服务器\n\n请确保您已连接到校园WiFi网络或使用校园有线网络'
        break
      case 'detection_failed':
        content = '网络环境检测失败，请稍后重试'
        break
      default:
        content = result.message || '此应用仅限在校园网环境内使用'
    }

    wx.showModal({
      title: title,
      content: content,
      showCancel: false,
      confirmText: '知道了',
      success: () => {
        // 可以选择退出小程序或跳转到说明页面
        this.handleAccessDenied()
      }
    })
  }

  /**
   * 处理访问被拒绝的情况
   */
  handleAccessDenied() {
    // 记录访问尝试
    this.logAccessAttempt(false)
    
    // 可以选择以下策略之一：
    // 1. 退出小程序
    // wx.exitMiniProgram()
    
    // 2. 跳转到说明页面
    wx.redirectTo({
      url: '/pages/access-denied/access-denied'
    })
    
    // 3. 显示离线模式
    // this.enableOfflineMode()
  }

  /**
   * 记录访问尝试
   */
  logAccessAttempt(success) {
    const timestamp = new Date().toISOString()
    const systemInfo = wx.getSystemInfoSync()
    
    const log = {
      timestamp,
      success,
      platform: systemInfo.platform,
      system: systemInfo.system,
      version: systemInfo.version
    }

    console.log('访问日志:', log)
    
    // 保存到本地存储
    try {
      const logs = wx.getStorageSync('access_logs') || []
      logs.push(log)
      
      // 只保留最近50条记录
      if (logs.length > 50) {
        logs.splice(0, logs.length - 50)
      }
      
      wx.setStorageSync('access_logs', logs)
    } catch (error) {
      console.error('保存访问日志失败:', error)
    }
  }

  /**
   * 启用/禁用校园网限制
   */
  setRestrictionEnabled(enabled) {
    this.restrictionEnabled = enabled
    console.log('校园网限制已', enabled ? '启用' : '禁用')
  }

  /**
   * 获取访问日志
   */
  getAccessLogs() {
    try {
      return wx.getStorageSync('access_logs') || []
    } catch (error) {
      console.error('获取访问日志失败:', error)
      return []
    }
  }
}

// 创建全局实例
const networkValidator = new NetworkValidator()

export default networkValidator

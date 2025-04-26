import axios from 'axios';
import { ElMessage } from 'element-plus';

/**
 * 网络连接监控工具类
 * 用于监控前端应用与API服务器的连接状态
 */
class NetworkMonitor {
  constructor() {
    this.isConnected = false;
    this.checkInterval = null;
    this.listeners = [];
    this.lastCheckTime = 0;
    this.checkIntervalTime = 30000; // 默认每30秒检查一次
  }

  /**
   * 开始网络监控
   * @param {number} intervalTime - 检查间隔时间（毫秒）
   */
  startMonitoring(intervalTime = 30000) {
    this.checkIntervalTime = intervalTime;
    
    // 清除可能存在的旧定时器
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    // 立即执行一次检查
    this.checkConnection();
    
    // 设置定期检查
    this.checkInterval = setInterval(() => {
      this.checkConnection();
    }, this.checkIntervalTime);
    
    // 添加浏览器在线状态监听
    window.addEventListener('online', this.handleOnlineEvent.bind(this));
    window.addEventListener('offline', this.handleOfflineEvent.bind(this));
    
    console.log('网络监控已启动，检查间隔:', this.checkIntervalTime, 'ms');
  }

  /**
   * 停止网络监控
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    window.removeEventListener('online', this.handleOnlineEvent);
    window.removeEventListener('offline', this.handleOfflineEvent);
    
    console.log('网络监控已停止');
  }

  /**
   * 检查与API服务器的连接
   * @returns {Promise<boolean>} 连接状态
   */
  async checkConnection() {
    const now = Date.now();
    
    // 避免短时间内多次检查
    if (now - this.lastCheckTime < 600000) {
      return this.isConnected;
    }
    
    this.lastCheckTime = now;
    
    try {
      const endpoints = [
        // '/api/health',
        '/api/greeting'
      ];
      
      // 尝试所有端点，任一成功即视为连接正常
      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint, { timeout: 600000 });
          if (response.status >= 200 && response.status < 300) {
            this.updateConnectionState(true);
            return true;
          }
        } catch (err) {
          console.log(`端点 ${endpoint} 检查失败`);
          // 继续尝试下一个端点
        }
      }
      
      // 所有端点都失败了
      this.updateConnectionState(false);
      return false;
    } catch (error) {
      this.updateConnectionState(false);
      return false;
    }
  }

  /**
   * 更新连接状态并通知监听器
   * @param {boolean} isConnected - 新的连接状态
   */
  updateConnectionState(isConnected) {
    // 状态变化时才通知
    if (this.isConnected !== isConnected) {
      const prevState = this.isConnected;
      this.isConnected = isConnected;
      
      if (isConnected && !prevState) {
        console.log('API连接已恢复');
        // ElMessage.success('网络连接已恢复');
      } else if (!isConnected && prevState) {
        console.log('API连接已断开');
        ElMessage.error('网络连接已断开，部分功能可能不可用');
      }
      
      // 通知所有监听器
      this.notifyListeners();
    }
  }

  /**
   * 添加连接状态变化监听器
   * @param {Function} listener - 监听器函数，接收isConnected参数
   */
  addListener(listener) {
    if (typeof listener === 'function' && !this.listeners.includes(listener)) {
      this.listeners.push(listener);
    }
  }

  /**
   * 移除连接状态变化监听器
   * @param {Function} listener - 要移除的监听器函数
   */
  removeListener(listener) {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 通知所有监听器连接状态变化
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.isConnected);
      } catch (error) {
        console.error('监听器执行出错:', error);
      }
    });
  }

  /**
   * 处理浏览器online事件
   */
  handleOnlineEvent() {
    console.log('浏览器报告网络已连接，正在检查API可用性...');
    this.checkConnection();
  }

  /**
   * 处理浏览器offline事件
   */
  handleOfflineEvent() {
    console.log('浏览器报告网络已断开');
    this.updateConnectionState(false);
  }
}

// 创建单例实例
const networkMonitor = new NetworkMonitor();

export default networkMonitor;

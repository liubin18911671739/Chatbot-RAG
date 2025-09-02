// utils/auth.js
// 微信小程序版本的RADIUS认证服务

const API_BASE_URL = 'http://10.10.15.211:5000';

class AuthService {
  constructor() {
    this.isLoggedIn = false;
    this.userInfo = null;
  }

  // 使用RADIUS进行认证
  async loginWithRADIUS(username, password) {
    console.log('开始RADIUS认证流程...');
    
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${API_BASE_URL}/api/auth/radius-login`,
        method: 'POST',
        data: {
          username,
          password
        },
        header: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000,
        success: (res) => {
          console.log('RADIUS认证响应:', res);
          
          // 检查后端返回的状态码和消息
          if (res.statusCode === 200 && res.data && res.data.message === "Login successful") {
            console.log('RADIUS认证成功');
            
            // 存储用户信息
            const userData = {
              username: username,
              authenticated: true,
              authType: 'RADIUS',
              timestamp: new Date().getTime()
            };
            
            // 使用微信小程序的存储API
            wx.setStorageSync('user', userData);
            
            this.isLoggedIn = true;
            this.userInfo = userData;
            
            resolve({ 
              success: true,
              token: res.data.token,
              userData: userData
            });
          } else {
            console.log('RADIUS认证失败:', res.data);
            resolve({ 
              success: false, 
              message: res.data && res.data.message ? res.data.message : 'RADIUS认证失败'
            });
          }
        },
        fail: (error) => {
          console.error('RADIUS认证错误:', error);
          
          let errorMessage = 'RADIUS认证服务请求失败';
          let devDetails = null;
          
          if (error.errno && error.errno === -2) {
            // 网络连接问题
            errorMessage = '认证服务连接异常';
            devDetails = '网络连接问题';
            
            // 开发环境下的测试账号处理
            // if (username === 'testing' && password === 'password') {
            //   console.log('开发模式：使用RADIUS测试账号登录成功');
            //   const userData = {
            //     username: username,
            //     authenticated: true,
            //     authType: 'RADIUS_DEV',
            //     timestamp: new Date().getTime()
            //   };
            //   wx.setStorageSync('user', userData);
              
            //   this.isLoggedIn = true;
            //   this.userInfo = userData;
              
            //   resolve({ 
            //     success: true,
            //     message: '开发模式：RADIUS模拟认证成功',
            //     token: 'radius-dev-token',
            //     userData: userData
            //   });
            //   return;
            // }
          } else if (error.errno === -1) {
            // 请求超时
            errorMessage = '认证服务响应超时';
            devDetails = '请求超时';
          } else {
            // 其他错误
            errorMessage = 'RADIUS认证请求配置错误';
            devDetails = error.errMsg || '未知错误';
          }
          
          resolve({ 
            success: false, 
            message: errorMessage,
            devDetails: devDetails,
            error: error.errMsg
          });
        }
      });
    });
  }

  // 检查登录状态
  checkLoginStatus() {
    try {
      const userData = wx.getStorageSync('user');
      if (userData && userData.authenticated) {
        this.isLoggedIn = true;
        this.userInfo = userData;
        return true;
      }
    } catch (error) {
      console.error('检查登录状态失败:', error);
    }
    
    this.isLoggedIn = false;
    this.userInfo = null;
    return false;
  }

  // 获取当前用户信息
  getCurrentUser() {
    if (this.isLoggedIn && this.userInfo) {
      return this.userInfo;
    }
    
    try {
      const userData = wx.getStorageSync('user');
      if (userData && userData.authenticated) {
        this.userInfo = userData;
        this.isLoggedIn = true;
        return userData;
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
    
    return null;
  }

  // 退出登录
  logout() {
    try {
      wx.removeStorageSync('user');
      this.isLoggedIn = false;
      this.userInfo = null;
      console.log('用户已退出登录');
      return true;
    } catch (error) {
      console.error('退出登录失败:', error);
      return false;
    }
  }

  // 验证token是否有效（如果后端提供token验证接口）
  async validateToken(token) {
    return new Promise((resolve) => {
      wx.request({
        url: `${API_BASE_URL}/api/auth/validate-token`,
        method: 'POST',
        data: { token },
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        success: (res) => {
          resolve(res.statusCode === 200 && res.data.valid);
        },
        fail: () => {
          resolve(false);
        }
      });
    });
  }
}

// 创建单例实例
const authService = new AuthService();

export default authService;

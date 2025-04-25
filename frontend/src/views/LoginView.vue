<template>
  <div class="login-container">
    <div class="campus-decor-leaves top-left"></div>
    <div class="campus-decor-books bottom-right"></div>
    
    <div class="login-form campus-card">
      <div class="logo-container">
        <img src="/haitang.png" alt="北京第二外国语学院" class="school-logo" />
        <!-- <h2 class="school-name"></h2> -->

        <div class="campus-badge">智慧校园 · 学习助手</div>
      </div>
      
      <form @submit.prevent="login">
        <div class="form-group">
          <label for="username" class="campus-label">学号/工号</label>
          <input 
            type="text" 
            id="username" 
            v-model="username" 
            placeholder="请输入学号或工号" 
            required
            class="campus-input"
          />
        </div>
        <div class="form-group">
          <label for="password" class="campus-label">密码</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            placeholder="请输入密码" 
            required
            class="campus-input"
          />
        </div>
        
        <div class="remember-me">
          <input type="checkbox" id="remember" v-model="rememberMe" />
          <label for="remember">记住账号</label>
        </div>
        
        <div class="error-message" v-if="error">{{ error }}</div>
        
        <button type="submit" :disabled="loading" class="campus-btn login-btn">
          <span v-if="!loading">登录系统</span>
          <span v-else class="loading-spinner"></span>
        </button>
        
        <div class="campus-notice">
          <span class="notice-icon">📢</span>
          <span>首次使用请使用校园账号密码登录</span>
        </div>
      </form>
      
      <div class="campus-footer">
        <div class="school-contact">
          <p>联系电话：010-65778941</p>
          <p>地址：北京市朝阳区定福庄南里1号</p>
        </div>
        <div class="copyright">© {{ currentYear }} 北京第二外国语学院 - 智慧校园平台</div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { encrypt } from '../utils/encryption'; // 现有的加密工具函数
import CryptoJS from 'crypto-js'; // 直接导入CryptoJS用于SHA3加密

export default {
  name: 'LoginView',
  data() {
    return {
      username: '',
      password: '',
      rememberMe: false,
      loading: false,
      error: null,
      isDevelopment: process.env.NODE_ENV === 'development', // 添加环境判断
      // 添加模拟用户信息
      mockUsers: [
        {
          username: 'admin',
          password: 'Admin@123',
          role: 'admin' // 管理员角色
        },
        {
          username: 'user',
          password: 'User@123',
          role: 'user' // 普通用户角色
        }
      ],
      // 添加API连接状态标志
      apiConnected: false,
      currentYear: new Date().getFullYear(), // 获取当前年份
      // 添加东软Webservice配置
      webserviceEnabled: true, // 控制是否启用东软Webservice验证
      webserviceUrl: 'http://cas.bisu.edu.cn/tpass/service/LoginService?wsdl'
    }
  },
  methods: {
    async login() {
      this.error = null;
      this.loading = true;
      
      try {
        // 开发模式且API未连接时，直接使用模拟方式登录
        if (this.isDevelopment && !this.apiConnected) {
          // 检查是否是合法用户名/密码
          if (this.username && this.password.length >= 6) {
            console.log('开发模式：模拟登录成功');
            // 设置模拟token
            localStorage.setItem('token', 'dev-mode-token');
            localStorage.setItem('userId', this.username);
            localStorage.setItem('userRole', 'user'); // 默认为普通用户角色
            
            if (this.rememberMe) {
              localStorage.setItem('rememberedUsername', this.username);
            } else {
              localStorage.removeItem('rememberedUsername');
            }
            
            // 登录成功后重定向到聊天页面
            this.$router.push('/chat');
            return;
          } else {
            this.error = '用户名或密码格式不正确';
            this.loading = false;
            return;
          }
        }

        // 检查是否是模拟用户
        const mockUser = this.mockUsers.find(user => 
          user.username === this.username && user.password === this.password
        );
        
        if (mockUser) {
          console.log(`使用模拟用户登录成功，角色: ${mockUser.role}`);
          // 设置模拟token
          localStorage.setItem('token', 'mock-user-token');
          localStorage.setItem('userId', this.username);
          localStorage.setItem('userRole', mockUser.role);
          
          if (this.rememberMe) {
            localStorage.setItem('rememberedUsername', this.username);
          } else {
            localStorage.removeItem('rememberedUsername');
          }
          
          // 根据角色重定向到不同页面
          if (mockUser.role === 'admin') {
            this.$router.push('/admin');
          } else {
            this.$router.push('/chat');
          }
          return;
        }
        
        // 非模拟用户，继续正常登录流程
        // 根据配置选择使用东软Webservice或后端API
        if (this.webserviceEnabled) {
          // 使用东软Webservice进行身份验证
          await this.loginWithWebservice();
        } else {
          // 使用原有的后端API验证
          await this.loginWithBackendApi();
        }
      } catch (err) {
        console.error('Login error:', err);
        // 在开发模式下，如果遇到网络错误，提示使用模拟登录
        if (this.isDevelopment) {
          this.error = '后端API连接失败，可使用任意合法用户名/密码进行开发模式登录';
          this.apiConnected = false;
        } else if (err.response && err.response.data) {
          this.error = err.response.data.message || '登录服务暂时不可用，请稍后再试';
        } else {
          this.error = '网络错误，请检查网络连接';
        }
      } finally {
        this.loading = false;
      }
    },

    // 使用东软Webservice进行身份验证
    async loginWithWebservice() {
      try {
        this.loading = true;
        
        // 导入 AuthService
        const AuthService = require('@/services/auth').default;
        
        // 使用改进的CAS认证服务
        const result = await AuthService.loginWithCAS(this.username, this.password);
        
        if (result.success) {
          console.log('东软Webservice登录成功');
          
          // 获取存储在localStorage中的用户信息
          const userData = AuthService.getCurrentUser();
          
          // 设置本地存储，与之前兼容
          localStorage.setItem('token', 'webservice-token');
          localStorage.setItem('userId', this.username);
          localStorage.setItem('userRole', 'user'); // 默认角色
          
          if (this.rememberMe) {
            localStorage.setItem('rememberedUsername', this.username);
          } else {
            localStorage.removeItem('rememberedUsername');
          }
          
          // 显示登录方式信息（仅在开发环境）
          if (this.isDevelopment && userData && userData.authType) {
            console.log(`认证方式: ${userData.authType}`);
          }
          
          // 登录成功，导航到聊天页面
          this.$router.push('/chat');
        } else {
          this.error = result.message || '用户名或密码错误，请重新输入';
          console.error('认证失败:', result);
        }
      } catch (error) {
        console.error('东软Webservice登录处理错误:', error);
        this.error = '登录过程发生错误，请稍后重试';
        
        // 在开发环境下提供更详细的错误信息
        if (this.isDevelopment) {
          this.error = `登录处理错误: ${error.message}`;
        }
      } finally {
        this.loading = false;
      }
    },

    // 原有的后端API身份验证方法
    async loginWithBackendApi() {
      // 加密用户名和密码
      const encryptedUsername = encrypt(this.username);
      const encryptedPassword = encrypt(this.password);
      
      // 调用后端API
      const response = await axios.post('/api/auth/login', {
        username: encryptedUsername,
        password: encryptedPassword
      });
      
      if (response.data.success) {
        // 登录成功，保存token和用户角色到localStorage
        localStorage.setItem('token', response.data.token || 'default-token');
        localStorage.setItem('userId', this.username);
        localStorage.setItem('userRole', response.data.role || 'user');
        
        if (this.rememberMe) {
          localStorage.setItem('rememberedUsername', this.username);
        } else {
          localStorage.removeItem('rememberedUsername');
        }
        
        // 根据角色重定向到不同页面
        if (response.data.role === 'admin') {
          this.$router.push('/admin');
        } else {
          this.$router.push('/chat');
        }
      } else {
        this.error = '登录失败，请检查用户名和密码';
      }
    },
    
    // 添加开发模式自动登录方法
    devModeLogin() {
      console.log('开发模式：自动登录');
      // 设置一个临时token
      localStorage.setItem('token', 'dev-mode-token');
      localStorage.setItem('userId', 'dev-user');
      // 跳转到聊天页面
      this.$router.push('/chat');
    },
    
    showPasswordHelp() {
      alert('请联系系统管理员重置密码');
    },
    
    // 检查API连接状态
    async checkApiConnection() {
      if (!this.isDevelopment) return true;
      
      try {
        // 尝试调用一个简单的API接口
        await axios.get('/api/greeting');
        this.apiConnected = true;
        console.log('后端API连接成功');
        return true;
      } catch (err) {
        console.warn('后端API连接失败，将使用模拟模式:', err);
        this.apiConnected = false;
        return false;
      }
    }
  },
  async mounted() {
    // 检查API连接状态
    await this.checkApiConnection();
    
    // 开发模式且未连接API时自动跳过登录
    if (this.isDevelopment && !this.apiConnected) {
      const token = localStorage.getItem('token');
      if (token) {
        this.devModeLogin();
        return;
      }
    } else {
      // 正常的登录流程，如之前记住用户名等
      const rememberedUsername = localStorage.getItem('rememberedUsername');
      if (rememberedUsername) {
        this.username = rememberedUsername;
        this.rememberMe = true;
      }
      
      // 如果已有token，则自动跳转到聊天页面
      const token = localStorage.getItem('token');
      if (token) {
        this.$router.push('/chat');
      }
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--campus-secondary);
  background-image: linear-gradient(120deg, rgba(240, 240, 235, 0.8) 0%, rgba(245, 245, 240, 0.9) 100%);
  position: relative;
  overflow: hidden;
}

/* 装饰元素定位 */
.top-left {
  top: 40px;
  left: 40px;
  transform: rotate(-15deg);
}

.bottom-right {
  bottom: 40px;
  right: 40px;
  transform: rotate(15deg);
}

.login-form {
  width: 100%;
  max-width: 420px;
  padding: 2.5rem;
  border-radius: var(--campus-radius-lg);
  box-shadow: var(--campus-shadow-lg);
  background-color: var(--campus-neutral-100);
  position: relative;
  z-index: 2;
  border-top: 4px solid var(--campus-primary);
}

.logo-container {
  text-align: center;
  margin-bottom: 2rem;
}

.school-logo {
  max-width: 400px;
  height: auto;
  margin-bottom: 0.5rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.school-name {
  margin: 0.75rem 0;
  font-size: 1.5rem;
  color: var(--campus-neutral-900);
  font-weight: 600;
}

.campus-badge {
  display: inline-block;
  margin-top: 0.5rem;
  padding: 0.375rem 1rem;
  font-size: 0.875rem;
  color: white;
  background-color: var(--campus-primary);
  border-radius: 1.25rem;
  box-shadow: var(--campus-shadow-sm);
  letter-spacing: 0.05em;
}

.form-group {
  margin-bottom: 1.5rem;
}

.remember-me {
  display: flex;
  align-items: center;
  margin-bottom: 1.25rem;
  user-select: none;
}

.remember-me input {
  margin-right: 0.5rem;
  accent-color: var(--campus-primary);
}

.remember-me label {
  font-size: 0.875rem;
  color: var(--campus-neutral-700);
  cursor: pointer;
}

.error-message {
  background-color: rgba(244, 67, 54, 0.1);
  color: var(--campus-error);
  padding: 0.75rem 1rem;
  margin-bottom: 1.25rem;
  border-radius: var(--campus-radius);
  font-size: 0.875rem;
  border-left: 3px solid var(--campus-error);
}

.login-btn {
  width: 100%;
  padding: 0.875rem;
  background-color: var(--campus-primary);
  color: white;
  border: none;
  border-radius: var(--campus-radius);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--campus-shadow-sm);
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-btn:hover {
  background-color: var(--campus-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--campus-shadow-md);
}

.login-btn:active {
  transform: translateY(0);
  box-shadow: var(--campus-shadow-sm);
}

.login-btn:disabled {
  background-color: var(--campus-neutral-400);
  color: var(--campus-neutral-600);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.loading-spinner {
  display: inline-block;
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.campus-notice {
  margin-top: 1.5rem;
  padding: 0.875rem;
  background-color: var(--campus-neutral-200);
  border-radius: var(--campus-radius);
  font-size: 0.875rem;
  color: var(--campus-neutral-800);
  display: flex;
  align-items: center;
}

.notice-icon {
  margin-right: 0.625rem;
  font-size: 1rem;
}

.campus-footer {
  margin-top: 2rem;
  border-top: 1px solid var(--campus-neutral-300);
  padding-top: 1.5rem;
  text-align: center;
}

.school-contact {
  margin-bottom: 0.75rem;
}

.school-contact p {
  margin: 0.25rem 0;
  font-size: 0.75rem;
  color: var(--campus-neutral-600);
}

.copyright {
  font-size: 0.75rem;
  color: var(--campus-neutral-500);
}

/* 添加校园风格的背景装饰 */
.login-container::before {
  content: "";
  position: absolute;
  top: -10%;
  right: -10%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(62, 128, 85, 0.1) 0%, rgba(62, 128, 85, 0) 70%);
  z-index: 1;
}

.login-container::after {
  content: "";
  position: absolute;
  bottom: -10%;
  left: -10%;
  width: 50%;
  height: 50%;
  background: radial-gradient(circle, rgba(29, 78, 137, 0.1) 0%, rgba(29, 78, 137, 0) 70%);
  z-index: 1;
}
</style>
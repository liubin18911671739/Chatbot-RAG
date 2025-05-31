import { defineStore } from 'pinia';
import axios from 'axios';
import router from '@/router';
import { ElMessage } from 'element-plus';

export const useUserStore = defineStore('user', {
  state: () => ({
    userId: localStorage.getItem('userId') || '',
    token: localStorage.getItem('token') || '',
    userInfo: null,
    isAuthenticated: !!localStorage.getItem('token'),
    authLoading: false,
    userRole: localStorage.getItem('userRole') || 'student',  // 默认为学生角色
  }),

  getters: {
    // 获取用户信息
    getUserInfo: (state) => state.userInfo,
    // 获取用户ID
    getUserId: (state) => state.userId,
    // 判断用户是否已登录
    isLoggedIn: (state) => state.isAuthenticated,
    // 判断用户是否为管理员
    isAdmin: (state) => state.userRole === 'admin',
  },

  actions: {
    /**
     * 设置身份认证状态
     */
    setAuth(authData) {
      if (authData && authData.token) {
        this.token = authData.token;
        this.userId = authData.userId || '';
        this.userRole = authData.role || 'student';
        
        // 存储到本地存储
        localStorage.setItem('token', authData.token);
        localStorage.setItem('userId', this.userId);
        localStorage.setItem('userRole', this.userRole);
        
        this.isAuthenticated = true;
      }
    },

    /**
     * 登录操作
     * @param {Object} credentials - 登录凭证
     * @returns {Promise}
     */
    async login(credentials) {
      try {
        this.authLoading = true;
        
        const response = await axios.post('/api/auth/login', credentials);
        
        if (response.data.success) {
          // 设置认证状态
          this.setAuth({
            token: response.data.token,
            userId: credentials.username,
            role: response.data.role || 'student'
          });
          
          // 获取用户信息
          await this.fetchUserInfo();
          
          return { success: true };
        } else {
          return { success: false, message: response.data.message || '登录失败' };
        }      } catch (error) {
        console.error('登录失败:', error);
        const errorMessage = error.response && error.response.data && error.response.data.message 
          ? error.response.data.message 
          : '登录服务暂时不可用';
        return { 
          success: false, 
          message: errorMessage
        };
      } finally {
        this.authLoading = false;
      }
    },

    /**
     * 退出登录
     */
    logout() {
      // 清除状态
      this.token = '';
      this.userId = '';
      this.userInfo = null;
      this.isAuthenticated = false;
      this.userRole = 'student';
      
      // 清除本地存储
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
      
      // 重定向到登录页
      router.push('/login');
    },

    /**
     * 获取用户信息
     */
    async fetchUserInfo() {
      if (!this.isAuthenticated) return;
      
      try {
        const response = await axios.get('/api/auth/user');
        this.userInfo = response.data;
        return response.data;
      } catch (error) {
        console.error('获取用户信息失败:', error);
        if (error.response && error.response.status === 401) {
          // 如果是未授权错误，则登出
          this.logout();
          ElMessage.error('会话已过期，请重新登录');
        }
      }
    },

    /**
     * 检查认证状态
     * @returns {boolean} - 是否已认证
     */
    checkAuth() {
      const token = localStorage.getItem('token');
      
      if (token) {
        this.token = token;
        this.userId = localStorage.getItem('userId') || '';
        this.userRole = localStorage.getItem('userRole') || 'student';
        this.isAuthenticated = true;
        return true;
      }
      
      this.isAuthenticated = false;
      return false;
    },

    /**
     * 更新用户信息
     * @param {Object} userInfo - 更新的用户信息
     */
    async updateUserInfo(userInfo) {
      try {
        const response = await axios.put('/api/auth/user', userInfo);
        this.userInfo = response.data;
        ElMessage.success('用户信息更新成功');
        return { success: true };
      } catch (error) {
        console.error('更新用户信息失败:', error);
        ElMessage.error('更新用户信息失败');
        return { success: false };
      }
    }
  }
});
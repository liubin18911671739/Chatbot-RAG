<template>
  <div class="login-container">
    <div class="login-form">
      <h1>登录</h1>
      <form @submit.prevent="login">
        <div class="form-group">
          <label for="username">用户名</label>
          <input 
            type="text" 
            id="username" 
            v-model="username" 
            placeholder="请输入用户名" 
            required
          />
        </div>
        <div class="form-group">
          <label for="password">密码</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            placeholder="请输入密码" 
            required
          />
        </div>
        <div class="form-options">
          <div class="remember-me">
            <input type="checkbox" id="remember" v-model="rememberMe" />
            <label for="remember">记住我</label>
          </div>
          <div class="forgot-password">
            <router-link to="/forgot-password">忘记密码？</router-link>
          </div>
        </div>
        <div class="error" v-if="error">{{ error }}</div>
        <button type="submit" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
        <div class="register-link">
          还没有账号？ <router-link to="/register">立即注册</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'LoginView',
  data() {
    return {
      username: '',
      password: '',
      rememberMe: false,
      loading: false,
      error: null,
      isDevelopment: process.env.NODE_ENV === 'development' // 添加环境判断
    }
  },
  methods: {
    async login() {
      this.error = null;
      this.loading = true;
      
      try {
        // 调用后端API进行用户验证
        const response = await axios.post('/api/login', {
          username: this.username,
          password: this.password
        });
        
        // 保存token到localStorage
        localStorage.setItem('token', response.data.token);
        
        if (this.rememberMe) {
          localStorage.setItem('rememberedUsername', this.username);
        } else {
          localStorage.removeItem('rememberedUsername');
        }
        
        // 登录成功后重定向到聊天页面
        this.$router.push('/chat');
      } catch (err) {
        console.error('Login error:', err);
        if (err.response && err.response.data && err.response.data.message) {
          this.error = err.response.data.message;
        } else {
          this.error = '登录失败，请检查用户名和密码';
        }
      } finally {
        this.loading = false;
      }
    },
    // 添加开发模式自动登录方法
    devModeLogin() {
      console.log('开发模式：自动登录');
      // 设置一个临时token
      localStorage.setItem('token', 'dev-mode-token');
      // 跳转到聊天页面
      this.$router.push('/chat');
    }
  },
  mounted() {
    // 开发模式自动跳过登录
    if (this.isDevelopment) {
      this.devModeLogin();
      return;
    }
    
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
</script>

<style scoped>
/* 保持原有样式不变 */
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.login-form {
  width: 100%;
  max-width: 400px;
  padding: 30px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  margin-bottom: 24px;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

input[type="text"],
input[type="password"] {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.remember-me {
  display: flex;
  align-items: center;
}

.remember-me input {
  margin-right: 8px;
}

button {
  width: 100%;
  padding: 12px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #45a049;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.error {
  color: red;
  margin-bottom: 20px;
}

.register-link {
  text-align: center;
  margin-top: 20px;
}

a {
  color: #4CAF50;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>
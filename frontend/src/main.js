import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
// 使用完整导入
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import axios from 'axios'

// 配置axios默认URL和拦截器
axios.defaults.baseURL = process.env.VUE_APP_API_URL || 'http://localhost:5000'

// 请求拦截器添加token
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const app = createApp(App)

// 使用插件
app.use(router)
app.use(ElementPlus)

// 全局配置
app.config.globalProperties.$axios = axios

// 挂载应用
app.mount('#app')
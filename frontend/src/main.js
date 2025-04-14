import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import networkMonitor from './utils/NetworkMonitor'
import { createPinia } from 'pinia'

// 开发环境下打印更多请求信息
if (process.env.NODE_ENV !== 'production') {
  console.log('=== API调试模式已开启 ===');
  console.log('当前环境:', process.env.NODE_ENV);
  console.log('API基础URL:', process.env.VUE_APP_API_BASE_URL || '使用代理默认值(http://localhost:5000)');
}

// 设置合理的超时时间和基础URL
axios.defaults.timeout = 30000;
// 不再单独设置baseURL，完全依赖Vue的代理配置

// 请求拦截器增强
axios.interceptors.request.use(config => {
  // 开发环境下记录请求详情
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[API请求] ${config.method.toUpperCase()} ${config.url}`, 
      config.params ? `参数: ${JSON.stringify(config.params)}` : '',
      config.data ? `数据: ${JSON.stringify(config.data)}` : '');
  }
  
  // 添加更多请求标识和调试信息
  config.headers['X-Requested-With'] = 'XMLHttpRequest';
  config.headers['X-Client-Version'] = '1.0.0';
  config.headers['X-Request-Time'] = new Date().toISOString();
  
  return config;
}, error => {
  console.error('[API请求错误]', error);
  return Promise.reject(error);
});

// 增强的响应拦截器
axios.interceptors.response.use(
  response => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`请求成功: ${response.config.url}`, response.data)
    }
    return response;
  },
  error => {
    let errorMessage = '未知错误';
    
    if (error.response) {
      // 服务器返回了错误状态码
      const status = error.response.status;
      console.error(`API错误(${status}):`, error.response.data);
      
      switch(status) {
        case 404:
          errorMessage = `接口不存在: ${error.config.url}`;
          break;
        case 500:
          errorMessage = '服务器内部错误';
          break;
        default:
          errorMessage = `服务器返回错误(${status}): ${error.response.data.message || '未知错误'}`;
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      errorMessage = `无法连接到API服务器(${error.config.url}): ${error.message}`;
      console.error(errorMessage);
      // 尝试检查Flask API是否运行
      console.log('请检查Flask API是否已启动,并且运行在正确的端口(默认5000)上');
    } else {
      // 请求配置有误
      errorMessage = `请求配置错误: ${error.message}`;
      console.error(errorMessage);
    }
    
    // 使用Element Plus显示错误消息
    ElMessage.error(errorMessage);
    
    return Promise.reject(error);
  }
);

// 启动网络监控
networkMonitor.startMonitoring(60000); // 每60秒检查一次

const app = createApp(App);
app.config.devtools = false

// 创建Pinia实例
const pinia = createPinia()

// 使用插件
app.use(router);
app.use(ElementPlus);
app.use(pinia);

// 全局配置和实例属性
app.config.globalProperties.$axios = axios;
app.config.globalProperties.$networkMonitor = networkMonitor;

// 挂载应用
app.mount('#app');

// 添加全局的未捕获错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('未捕获的应用错误:', err, info);
  // ElMessage.error('应用发生错误，请刷新页面或联系管理员');
};
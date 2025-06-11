// 环境配置
const envConfig = {
  // 开发环境
  development: {
    baseURL: 'http://10.10.15.211:5000',
    timeout: 40000,
    enableMock: false,
    enableLog: true,
    useProxy: false,
    campusRestriction: false  // 开发环境不启用校园网限制
  },
  // 测试环境 - 使用云函数代理
  staging: {
    baseURL: 'https://service-placeholder.tencentcs.com/release',
    timeout: 30000,
    enableMock: false,
    enableLog: true,
    useProxy: true,
    campusRestriction: true   // 测试环境启用校园网限制
  },
  // 生产环境 - 使用云函数代理
  production: {
    baseURL: 'https://service-placeholder.tencentcs.com/release',
    timeout: 30000,
    enableMock: false,
    enableLog: false,
    useProxy: true,
    campusRestriction: true   // 生产环境启用校园网限制
  },
  // 本地测试环境（无网络）
  local: {
    baseURL: '',
    timeout: 1000,
    enableMock: true,
    enableLog: true,
    useProxy: false,
    campusRestriction: false  // 本地环境不启用校园网限制
  }
}

// 自动检测环境
function getCurrentEnv() {
  const systemInfo = wx.getSystemInfoSync()
  
  // 开发者工具
  if (systemInfo.platform === 'devtools') {
    return 'development'
  }
  
  // 根据版本号判断环境
  const accountInfo = wx.getAccountInfoSync()
  const envVersion = accountInfo.miniProgram.envVersion
  
  switch (envVersion) {
    case 'develop':
      return 'development'
    case 'trial':
      return 'staging'
    case 'release':
      return 'production'
    default:
      return 'development'
  }
}

// 获取当前环境配置
function getConfig() {
  const env = getCurrentEnv()
  const config = envConfig[env]
  
  console.log('当前环境:', env)
  console.log('环境配置:', config)
  
  return {
    ...config,
    env,
    isDev: env === 'development'
  }
}

module.exports = {
  getConfig,
  getCurrentEnv,
  envConfig
}

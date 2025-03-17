const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8080',
    env: {
      apiUrl: 'http://10.101.0.208:5000', // 用于测试的API地址
    },
    setupNodeEvents(on, config) {
      // 可以在这里添加更多配置
    },
  },
});

module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? '/bisu-qa-system/' : '/',
  outputDir: 'dist',
  lintOnSave: false,
  devServer: {
    proxy: {
      '/api': {
        // 确保target是一个有效的URL字符串
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        pathRewrite: {
          '^/api': '/api'
        },
        logLevel: 'debug'
      }
    }
  }
};
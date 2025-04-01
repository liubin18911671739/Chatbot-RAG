module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? '/bisu-qa-system/' : '/',
  outputDir: 'dist',
  lintOnSave: false,
  devServer: {
    proxy: {
      '/api': {
        // target: process.env.VUE_APP_API_BASE_URL || 'http://127.0.0.1:5000',
        target: 'http://10.101.0.208:5000',
        changeOrigin: true,
        pathRewrite: {
          '^/api': '/api'
        },
        logLevel: 'debug'
      }
    }
  }
};
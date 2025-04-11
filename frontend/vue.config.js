module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? '/bisu-qa-system/' : '/',
  outputDir: 'dist',
  lintOnSave: false,
  devServer: {
    proxy: {
      '/api': {
        // target: process.env.VUE_APP_API_BASE_URL || '10.10.15.210:5000',
        target: 'http://10.10.15.210:5000',
        changeOrigin: true,
      }
    }
  }
};
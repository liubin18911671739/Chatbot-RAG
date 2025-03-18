module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? '/rag-qa-system/' : '/',
  outputDir: 'dist',
  lintOnSave: false,
  devServer: {
    proxy: {
      '/api': {
        target: process.env.VUE_APP_API_URL || 'http://10.101.0.208:5000',
        changeOrigin: true,
        timeout: 60000,  // 增加超时时间
        onProxyReq(proxyReq) {
          // 添加额外请求头
          proxyReq.setHeader('X-Requested-With', 'XMLHttpRequest');
        },
        onError: (err, req, res) => {
          console.error('代理错误:', err);
          res.writeHead(500, {
            'Content-Type': 'application/json',
          });
          res.end(JSON.stringify({ error: '无法连接到API服务器', details: err.message }));
        }
      }
    }
  }
};
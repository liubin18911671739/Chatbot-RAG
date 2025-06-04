module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? '/ibisu/' : '/',
  outputDir: 'dist',
  lintOnSave: false,
  transpileDependencies: ['birpc', '@vue/devtools-kit'],
  devServer: {
    proxy: {
      '/api': {
        // 使用生产服务器地址
        target: 'http://10.10.15.211:5000',
        // 使用开发服务器地址
        // target: 'http://localhost:5000',

        changeOrigin: true,
        // 正确设置超时
        proxyTimeout: 60000, // 60秒超时
        // 或者使用 http-proxy-middleware 的配置格式
        onProxyReq: (proxyReq) => {
          proxyReq.timeout = 60000; // 60秒超时
        },
        // 添加错误处理
        onError: (err, req, res) => {
          console.error('代理错误:', err);
        }
      }
    }
  },
  configureWebpack: {
    module: {
      rules: [
        {
          test: /\.m?js$/,
          include: [
            /node_modules\/birpc/,
            /node_modules\/@vue\/devtools-kit/
          ],
          use: {
            loader: 'babel-loader',
            options: {
              plugins: ['@babel/plugin-proposal-optional-chaining']
            }
          }
        }
      ]
    },
    resolve: {
      alias: {
        // 更精确地定义birpc别名，确保所有引用都能正确解析
        'birpc': require('path').resolve(__dirname, 'node_modules/birpc'),
        '@vue/devtools-kit/node_modules/birpc': require('path').resolve(__dirname, 'node_modules/birpc')
      }
      // 移除了fallback配置，因为它在Webpack 4中不支持
    }
  }
};
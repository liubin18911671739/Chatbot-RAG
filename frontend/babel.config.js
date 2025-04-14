module.exports = {
  presets: [
    '@vue/cli-plugin-babel/preset'
  ],
  plugins: [
    // 全局插件在此处添加
  ],
  env: {
    development: {
      plugins: [
        '@babel/plugin-proposal-optional-chaining'
      ]
    }
  }
}
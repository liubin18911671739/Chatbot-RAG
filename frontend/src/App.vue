<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
#app {
  font-family: "Microsoft YaHei", "Hiragino Sans GB", "WenQuanYi Micro Hei", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #333;
  margin: 0;
  padding: 0;
  height: 100vh;
  background-color: #f8f8f8;
}

/* 全局样式 */
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-size: 16px;
}

/* 全局变量 - 校园主题色 */
:root {
  /* 主色调 - 浅蓝色系 */
  --campus-primary: #4a90e2;
  --campus-primary-light: #64a5f6;
  --campus-primary-dark: #3273c4;
  
  /* 次要色调 - 象牙白与淡蓝 */
  --campus-secondary: #f5f9ff;
  --campus-accent: #2c88d9;
  
  /* 中性色调 */
  --campus-neutral-100: #ffffff;
  --campus-neutral-200: #f0f7ff;
  --campus-neutral-300: #e4eef8;
  --campus-neutral-400: #d0dfee;
  --campus-neutral-500: #9cb3c9;
  --campus-neutral-600: #6b7e92;
  --campus-neutral-700: #4b5a6a;
  --campus-neutral-800: #374151;
  --campus-neutral-900: #1f2937;
  
  /* 功能色 */
  --campus-info: #2196f3;
  --campus-success: #4caf50;
  --campus-warning: #ff9800;
  --campus-error: #f44336;
  
  /* 阴影 */
  --campus-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --campus-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  --campus-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --campus-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  
  /* 排版 */
  --campus-font-sans: "Microsoft YaHei", "Hiragino Sans GB", "WenQuanYi Micro Hei", sans-serif;
  --campus-font-serif: "SimSun", "NSimSun", "FangSong", "KaiTi", serif;
  
  /* 圆角 */
  --campus-radius-sm: 2px;
  --campus-radius: 4px;
  --campus-radius-md: 6px;
  --campus-radius-lg: 8px;
  --campus-radius-xl: 12px;
  
  /* 动画 */
  --campus-transition: all 0.3s ease;
}

/* 校园主题的按钮样式 */
.campus-btn {
  display: inline-block;
  padding: 8px 16px;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.5;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: var(--campus-radius);
  transition: var(--campus-transition);
}

.campus-btn-primary {
  background-color: var(--campus-primary);
  color: var(--campus-neutral-100);
  box-shadow: var(--campus-shadow-sm);
}

.campus-btn-primary:hover {
  background-color: var(--campus-primary-dark);
  box-shadow: var(--campus-shadow);
}

.campus-btn-secondary {
  background-color: var(--campus-neutral-300);
  color: var(--campus-neutral-800);
  box-shadow: var(--campus-shadow-sm);
}

.campus-btn-secondary:hover {
  background-color: var(--campus-neutral-400);
  box-shadow: var(--campus-shadow);
}

/* 校园卡片样式 */
.campus-card {
  background-color: var(--campus-neutral-100);
  border-radius: var(--campus-radius-lg);
  box-shadow: var(--campus-shadow);
  padding: 1.5rem;
  transition: var(--campus-transition);
}

.campus-card:hover {
  box-shadow: var(--campus-shadow-md);
}

/* 校园输入框样式 */
.campus-input {
  padding: 0.625rem 0.75rem;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--campus-neutral-800);
  background-color: var(--campus-neutral-100);
  border: 1px solid var(--campus-neutral-400);
  border-radius: var(--campus-radius);
  transition: var(--campus-transition);
}

.campus-input:focus {
  border-color: var(--campus-primary);
  outline: none;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.2);
}

.campus-input::placeholder {
  color: var(--campus-neutral-500);
}

/* 校园标签样式 */
.campus-label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--campus-neutral-700);
}

/* 添加校园装饰元素 */
.campus-decor-leaves {
  position: absolute;
  width: 180px;
  height: 180px;
  opacity: 0.15;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="%234a90e2" d="M30,10 C10,25 10,75 30,90 C50,75 50,25 30,10 Z"/><path fill="%234a90e2" d="M70,10 C50,25 50,75 70,90 C90,75 90,25 70,10 Z"/><path fill="%234a90e2" d="M50,20 C30,35 30,85 50,100 C70,85 70,35 50,20 Z"/></svg>');
  background-size: contain;
  background-repeat: no-repeat;
  pointer-events: none;
  z-index: -1;
}

.campus-decor-books {
  position: absolute;
  width: 120px;
  height: 120px;
  opacity: 0.1;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%232c88d9" x="10" y="20" width="15" height="60" rx="2" /><rect fill="%233273c4" x="30" y="15" width="15" height="70" rx="2" /><rect fill="%234a90e2" x="50" y="25" width="15" height="55" rx="2" /><rect fill="%23f5f9ff" x="70" y="10" width="15" height="80" rx="2" /></svg>');
  background-size: contain;
  background-repeat: no-repeat;
  pointer-events: none;
  z-index: -1;
}
</style>
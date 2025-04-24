// frontend/src/router/index.js

import { createRouter, createWebHistory } from 'vue-router';
import ChatView from '../views/ChatView.vue';
import ChatComponent from '../views/ChatView.vue';
import LoginView from '../views/LoginView.vue';

const routes = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/chat',
    name: 'Chat',
    // component: ChatComponent,
    // meta: { requiresAuth: true },
    component: ChatView,
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
  },
  // 添加管理界面路由
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/AdminView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// 导航守卫
router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  const isDevelopment = process.env.NODE_ENV === 'development';

  // 检查是否需要身份验证
  if (to.matched.some(record => record.meta.requiresAuth) && !isAuthenticated && !isDevelopment) {
    // 需要认证但用户未登录且不是开发模式，重定向到登录页
    next('/login');
    return;
  }
  
  // 检查是否需要管理员权限
  if (to.matched.some(record => record.meta.requiresAdmin) && userRole !== 'admin') {
    // 需要管理员权限但用户不是管理员，重定向到聊天页面
    next('/chat');
    return;
  }
  
  next();
});

export default router;
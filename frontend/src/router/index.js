// frontend/src/router/index.js

import { createRouter, createWebHistory } from 'vue-router';
import ChatView from '../views/ChatView.vue';
import ChatComponent from '../views/ChatComponent.vue';
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
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// 导航守卫
router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('token');
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (to.matched.some(record => record.meta.requiresAuth) && !isAuthenticated && !isDevelopment) {
    // 需要认证但用户未登录且不是开发模式，重定向到登录页
    next('/login');
  } else {
    next();
  }
});

export default router;
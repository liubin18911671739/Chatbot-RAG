import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
	history: createWebHistory(process.env.BASE_URL),
	routes: [
		{
			path: '/',
			name: 'Home',
			component: () => import('@/views/Home.vue')
		},
		{
			path: '/login',
			name: 'Login',
			component: () => import('@/views/Login.vue') 
		},
		// 添加一个捕获所有未匹配路由的404页面
		{
			path: '/:pathMatch(.*)*',
			name: 'NotFound',
			component: () => import('@/views/NotFound.vue')
		}
	]
});

export default router;
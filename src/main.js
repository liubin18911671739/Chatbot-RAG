import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
// 添加store导入
import store from './store';

const app = createApp(App);
app.use(router);
// 注册store
app.use(store);

app.mount('#app');
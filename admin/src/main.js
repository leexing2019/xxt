import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import App from './App.vue';
import { routes, setupRouterGuard } from './router';
import { useAuthStore } from './stores/auth';
import './style.css';
const app = createApp(App);
const pinia = createPinia();
const router = createRouter({
    history: createWebHistory(),
    routes
});
// 初始化认证状态（恢复刷新后的登录状态）
const authStore = useAuthStore(pinia);
authStore.initAuth();
// 注册路由守卫
setupRouterGuard(router);
// 注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
}
app.use(pinia);
app.use(router);
app.use(ElementPlus, { locale: zhCn });
app.mount('#app');

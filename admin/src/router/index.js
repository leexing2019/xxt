import { useAuthStore } from '@/stores/auth';
export const routes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/Login.vue'),
        meta: { title: '登录' }
    },
    {
        path: '/',
        redirect: '/dashboard'
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '数据统计', requiresAuth: true }
    },
    {
        path: '/users',
        name: 'Users',
        component: () => import('@/views/Users.vue'),
        meta: { title: '用户管理', requiresAuth: true }
    },
    {
        path: '/medications',
        name: 'Medications',
        component: () => import('@/views/Medications.vue'),
        meta: { title: '药品库管理', requiresAuth: true }
    },
    {
        path: '/api-settings',
        name: 'ApiSettings',
        component: () => import('@/views/ApiSettings.vue'),
        meta: { title: 'API 配置', requiresAuth: true }
    },
    {
        path: '/remote-notification',
        name: 'RemoteNotification',
        component: () => import('@/views/RemoteNotification.vue'),
        meta: { title: '通知演示', requiresAuth: true }
    }
];
// 路由守卫
export function setupRouterGuard(router) {
    router.beforeEach(async (to, from, next) => {
        const authStore = useAuthStore();
        // 等待 auth 初始化完成（防止刷新时未初始化就跳转）
        if (!authStore.initialized) {
            // 轮询等待初始化完成，最多等待 5 秒
            const maxWait = 5000;
            const interval = 50;
            let waited = 0;
            while (!authStore.initialized && waited < maxWait) {
                await new Promise(resolve => setTimeout(resolve, interval));
                waited += interval;
            }
            // 如果超时仍未初始化，警告但继续
            if (!authStore.initialized) {
                console.warn('[Router] Auth initialization timeout, proceeding anyway');
            }
        }
        // 设置页面标题
        if (to.meta.title) {
            document.title = `${to.meta.title} - 用药助手后台`;
        }
        // 检查是否需要登录
        if (to.meta.requiresAuth && !authStore.isLoggedIn) {
            next('/login');
        }
        else if (to.path === '/login' && authStore.isLoggedIn) {
            next('/dashboard');
        }
        else {
            next();
        }
    });
}

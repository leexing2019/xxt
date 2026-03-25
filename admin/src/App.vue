<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import {
  DataAnalysis,
  User,
  Goods,
  Setting,
  Menu,
  Fold,
  SwitchButton
} from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()

const isLoggedIn = computed(() => authStore.isLoggedIn)
const isCollapsed = computed(() => authStore.sidebarCollapsed)

function handleCommand(command: string) {
  if (command === 'logout') {
    authStore.logout()
    router.push('/login')
  }
}

function toggleSidebar() {
  authStore.toggleSidebar()
}
</script>

<template>
  <el-config-provider :locale="zhCn">
    <router-view v-if="!isLoggedIn" />
    <el-container v-else class="admin-layout">
      <el-aside :width="isCollapsed ? '64px' : '240px'" class="sidebar">
        <div class="logo">
          <span class="logo-icon">💊</span>
          <span v-show="!isCollapsed" class="logo-text">用药助手后台</span>
        </div>
        <el-menu
          :default-active="$route.path"
          :collapse="isCollapsed"
          background-color="#1e293b"
          text-color="#94a3b8"
          active-text-color="#3b82f6"
          router
          class="sidebar-menu"
        >
          <el-menu-item index="/dashboard">
            <el-icon><DataAnalysis /></el-icon>
            <template #title>
              <span>数据统计</span>
            </template>
          </el-menu-item>
          <el-menu-item index="/users">
            <el-icon><User /></el-icon>
            <template #title>
              <span>用户管理</span>
            </template>
          </el-menu-item>
          <el-menu-item index="/medications">
            <el-icon><Goods /></el-icon>
            <template #title>
              <span>药品库管理</span>
            </template>
          </el-menu-item>
          <el-menu-item index="/api-settings">
            <el-icon><Setting /></el-icon>
            <template #title>
              <span>API 配置</span>
            </template>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-container class="main-container">
        <el-header class="header">
          <div class="header-left">
            <el-button
              class="toggle-btn"
              :icon="isCollapsed ? Menu : Fold"
              circle
              @click="toggleSidebar"
            />
            <span class="page-title">
              {{ $route.meta.title || '首页' }}
            </span>
          </div>
          <div class="header-right">
            <el-dropdown @command="handleCommand">
              <span class="user-info">
                <el-avatar :size="36" icon="User" class="user-avatar" />
                <span class="username">管理员</span>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="logout">
                    <el-icon><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>
        <el-main class="main-content">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </el-config-provider>
</template>

<style scoped>
.admin-layout {
  height: 100vh;
}

.sidebar {
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
  border-right: 1px solid #334155;
  transition: width 0.3s ease;
  overflow: hidden;
  flex-shrink: 0;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid #334155;
}

.logo-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: #f1f5f9;
  white-space: nowrap;
  transition: opacity 0.3s ease;
}

.sidebar-menu {
  border-right: none;
  padding: 12px 0;
}

.sidebar-menu .el-menu-item {
  height: 50px;
  margin: 4px 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.sidebar-menu .el-menu-item:hover {
  background-color: rgba(59, 130, 246, 0.1);
}

.sidebar-menu .el-menu-item.is-active {
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.05) 100%);
  color: #3b82f6;
}

.sidebar-menu .el-menu-item .el-icon {
  font-size: 18px;
  width: 20px;
}

.main-container {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  height: 64px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.toggle-btn {
  border: 1px solid #e2e8f0;
  color: #64748b;
}

.toggle-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.user-info:hover {
  background: #f1f5f9;
}

.user-avatar {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
}

.username {
  color: #475569;
  font-size: 14px;
  font-weight: 500;
}

.main-content {
  flex: 1;
  background: #f1f5f9;
  overflow-y: auto;
  padding: 24px;
  width: 100%;
  box-sizing: border-box;
}

.main-content > * {
  width: 100%;
  max-width: 100%;
}
</style>

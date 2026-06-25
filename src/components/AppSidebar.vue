<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const navigationLinks = [
  { label: '工作台', icon: 'grid', to: '/workbench', testId: 'nav-workbench' },
  { label: '项目管理', icon: 'folder', to: '/projects', testId: 'nav-projects' },
  { label: '用例编排', icon: 'route', to: '/cases', testId: 'nav-cases' },
]

const upcomingNavigation = [
  { label: '环境变量', icon: 'sliders' },
  { label: '执行记录', icon: 'pulse' },
  { label: '测试报告', icon: 'report' },
]

const activePath = computed(() => route.path)
</script>

<template>
  <aside class="app-sidebar">
    <div class="brand">
      <span class="brand-mark">
        <span />
        <span />
        <span />
      </span>
      <div>
        <strong>接口自动化测试平台</strong>
        <small>测试管理、编排与执行</small>
      </div>
    </div>

    <nav class="navigation" aria-label="主导航">
      <p class="navigation-label">PLATFORM</p>
      <RouterLink
        v-for="item in navigationLinks"
        :key="item.label"
        class="navigation-item"
        :class="{ active: activePath === item.to }"
        :to="item.to"
        :data-testid="item.testId"
      >
        <span class="navigation-icon" :data-icon="item.icon" aria-hidden="true" />
        <span>{{ item.label }}</span>
        <span v-if="activePath === item.to" class="active-dot" />
      </RouterLink>
      <button
        v-for="item in upcomingNavigation"
        :key="item.label"
        class="navigation-item"
        type="button"
        disabled
        title="该模块将在后续版本开放"
      >
        <span class="navigation-icon" :data-icon="item.icon" aria-hidden="true" />
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <div class="sidebar-footer">
      <div class="status-row">
        <span class="status-dot" />
        <span>服务运行正常</span>
      </div>
      <div class="profile">
        <span class="avatar">AP</span>
        <div>
          <strong>本地演示空间</strong>
          <small>单用户模式</small>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.app-sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 20;
  display: flex;
  width: var(--sidebar-width);
  flex-direction: column;
  color: #dbe7fa;
  background:
    radial-gradient(circle at 20% 0%, rgb(54 107 190 / 24%), transparent 34%),
    linear-gradient(180deg, var(--brand-800), var(--brand-900));
}

.brand {
  display: flex;
  height: var(--header-height);
  align-items: center;
  gap: 11px;
  padding: 0 22px;
  border-bottom: 1px solid rgb(255 255 255 / 8%);
}

.brand-mark {
  display: flex;
  width: 31px;
  height: 31px;
  align-items: end;
  justify-content: center;
  gap: 3px;
  padding: 7px 6px;
  border-radius: 9px;
  background: linear-gradient(145deg, #4d8cff, #1f62ea);
  box-shadow: 0 8px 18px rgb(24 89 220 / 36%);
}

.brand-mark span {
  width: 4px;
  border-radius: 2px;
  background: #fff;
}

.brand-mark span:nth-child(1) {
  height: 8px;
  opacity: 0.72;
}

.brand-mark span:nth-child(2) {
  height: 15px;
}

.brand-mark span:nth-child(3) {
  height: 11px;
  opacity: 0.86;
}

.brand strong,
.brand small {
  display: block;
}

.brand strong {
  color: #fff;
  font-size: 16px;
  letter-spacing: 0.2px;
}

.brand small {
  margin-top: 2px;
  color: #87a0c5;
  font-size: 9px;
}

.navigation {
  flex: 1;
  padding: 22px 12px;
}

.navigation-label {
  margin: 0 10px 10px;
  color: #6f88ad;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.5px;
}

.navigation-item {
  position: relative;
  display: flex;
  width: 100%;
  height: 44px;
  align-items: center;
  gap: 12px;
  margin-bottom: 5px;
  padding: 0 14px;
  border: 0;
  border-radius: 8px;
  color: #9eb1cf;
  background: transparent;
  font-size: 13px;
  text-decoration: none;
  text-align: left;
  transition:
    color 160ms ease,
    background 160ms ease;
}

.navigation-item:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.navigation-item:hover {
  color: #fff;
  background: rgb(255 255 255 / 6%);
}

.navigation-item.active {
  color: #fff;
  background: linear-gradient(90deg, rgb(48 119 255 / 95%), rgb(48 119 255 / 72%));
  box-shadow: 0 8px 20px rgb(11 56 139 / 30%);
}

.navigation-icon {
  position: relative;
  width: 17px;
  height: 17px;
  border: 1.5px solid currentcolor;
  border-radius: 4px;
  opacity: 0.92;
}

.navigation-icon::before,
.navigation-icon::after {
  position: absolute;
  content: "";
  background: currentcolor;
}

.navigation-icon::before {
  inset: 4px 2px auto;
  height: 1.5px;
}

.navigation-icon::after {
  inset: 8px 2px auto;
  height: 1.5px;
}

.active-dot {
  width: 5px;
  height: 5px;
  margin-left: auto;
  border-radius: 50%;
  background: #fff;
}

.sidebar-footer {
  padding: 0 14px 16px;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 8px 15px;
  color: #8298b9;
  font-size: 11px;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #32d296;
  box-shadow: 0 0 0 4px rgb(50 210 150 / 12%);
}

.profile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid rgb(255 255 255 / 7%);
  border-radius: 10px;
  background: rgb(255 255 255 / 4%);
}

.avatar {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 9px;
  color: #d8e7ff;
  background: #274c7f;
  font-size: 11px;
  font-weight: 700;
}

.profile strong,
.profile small {
  display: block;
}

.profile strong {
  color: #dbe7fa;
  font-size: 11px;
}

.profile small {
  margin-top: 3px;
  color: #738aaa;
  font-size: 9px;
}
</style>

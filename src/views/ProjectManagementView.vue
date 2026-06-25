<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import {
  ElAlert,
  ElButton,
  ElDialog,
  ElEmpty,
  ElInput,
} from 'element-plus'

import { ApiClientError, api } from '@/api/client'
import AppSidebar from '@/components/AppSidebar.vue'
import type { Project } from '@/types/api'

const projects = ref<Project[]>([])
const loading = ref(false)
const creating = ref(false)
const createDialogVisible = ref(false)
const errorMessage = ref('')
const form = reactive({
  name: '',
  description: '',
})

onMounted(() => {
  void loadProjects()
})

async function loadProjects(): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  try {
    projects.value = await api.listProjects()
  } catch (error) {
    errorMessage.value =
      error instanceof ApiClientError ? error.message : '项目列表加载失败'
  } finally {
    loading.value = false
  }
}

function openCreateDialog(): void {
  form.name = ''
  form.description = ''
  errorMessage.value = ''
  createDialogVisible.value = true
}

async function createProject(): Promise<void> {
  const name = form.name.trim()
  if (!name) {
    errorMessage.value = '请输入项目名称'
    return
  }

  creating.value = true
  errorMessage.value = ''
  try {
    const project = await api.createProject({
      name,
      description: form.description.trim(),
    })
    projects.value = [project, ...projects.value]
    createDialogVisible.value = false
  } catch (error) {
    errorMessage.value =
      error instanceof ApiClientError ? error.message : '项目创建失败'
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <div class="project-shell">
    <AppSidebar />

    <section class="project-application">
      <header class="project-topbar">
        <div>
          <span>API Pilot</span>
          <i>/</i>
          <strong>项目管理</strong>
        </div>
        <ElButton
          type="primary"
          data-testid="create-project"
          @click="openCreateDialog"
        >
          + 新建项目
        </ElButton>
      </header>

      <main class="project-page">
        <div class="project-heading">
          <div>
            <span class="eyebrow">PROJECTS</span>
            <h1>项目管理</h1>
            <p>集中维护接口自动化项目及其测试资产。</p>
          </div>
          <span class="project-count">{{ projects.length }} 个项目</span>
        </div>

        <ElAlert
          v-if="errorMessage"
          class="project-alert"
          type="error"
          :title="errorMessage"
          show-icon
          closable
          @close="errorMessage = ''"
        />

        <section v-loading="loading" class="project-grid">
          <article v-for="project in projects" :key="project.id" class="project-card">
            <div class="project-icon">API</div>
            <div class="project-card-body">
              <div class="project-card-title">
                <h2>{{ project.name }}</h2>
                <span>#{{ project.id }}</span>
              </div>
              <p>{{ project.description || '暂无项目描述' }}</p>
              <div class="project-meta">
                <span>接口自动化项目</span>
                <RouterLink to="/cases">进入编排</RouterLink>
              </div>
            </div>
          </article>
          <ElEmpty
            v-if="!loading && projects.length === 0"
            description="暂无项目，请创建第一个项目"
          />
        </section>
      </main>
    </section>

    <ElDialog
      v-model="createDialogVisible"
      title="新建项目"
      width="520px"
      append-to-body
    >
      <div class="project-form">
        <label>
          <span>项目名称</span>
          <ElInput
            v-model="form.name"
            aria-label="项目名称"
            maxlength="255"
            placeholder="例如：订单中心 API"
          />
        </label>
        <label>
          <span>项目描述</span>
          <ElInput
            v-model="form.description"
            aria-label="项目描述"
            type="textarea"
            :rows="4"
            maxlength="500"
            placeholder="说明项目覆盖的系统和测试范围"
          />
        </label>
      </div>
      <template #footer>
        <ElButton @click="createDialogVisible = false">取消</ElButton>
        <ElButton
          type="primary"
          data-testid="confirm-create-project"
          :loading="creating"
          @click="createProject"
        >
          创建项目
        </ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped>
.project-shell {
  min-height: 100%;
  min-width: 1024px;
  background: var(--surface-page);
}

.project-application {
  min-height: 100vh;
  margin-left: var(--sidebar-width);
}

.project-topbar {
  position: sticky;
  top: 0;
  z-index: 12;
  display: flex;
  height: var(--header-height);
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  border-bottom: 1px solid var(--border-default);
  background: rgb(255 255 255 / 94%);
  backdrop-filter: blur(12px);
}

.project-topbar > div {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--text-tertiary);
  font-size: 12px;
}

.project-topbar i {
  color: #c0c7d3;
  font-style: normal;
}

.project-topbar strong {
  color: var(--text-secondary);
}

.project-page {
  padding: 30px;
}

.project-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  margin-bottom: 24px;
}

.eyebrow {
  color: var(--brand-600);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.3px;
}

.project-heading h1 {
  margin: 8px 0 6px;
  font-size: 28px;
}

.project-heading p {
  margin: 0;
  color: var(--text-tertiary);
  font-size: 13px;
}

.project-count {
  padding: 8px 12px;
  border: 1px solid var(--border-default);
  border-radius: 999px;
  color: var(--text-secondary);
  background: #fff;
  font-size: 12px;
}

.project-alert {
  margin-bottom: 16px;
}

.project-grid {
  display: grid;
  min-height: 220px;
  grid-template-columns: repeat(3, minmax(240px, 1fr));
  gap: 16px;
}

.project-card {
  display: flex;
  min-height: 170px;
  gap: 16px;
  padding: 20px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: #fff;
  box-shadow: var(--shadow-panel);
}

.project-icon {
  display: grid;
  width: 48px;
  height: 48px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 12px;
  color: #fff;
  background: linear-gradient(145deg, var(--brand-500), var(--brand-700));
  font-size: 11px;
  font-weight: 700;
}

.project-card-body {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}

.project-card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.project-card-title h2 {
  overflow: hidden;
  margin: 0;
  font-size: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-card-title span {
  color: var(--text-tertiary);
  font-size: 10px;
}

.project-card-body > p {
  display: -webkit-box;
  overflow: hidden;
  margin: 12px 0;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.7;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.project-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 13px;
  border-top: 1px solid var(--border-default);
  color: var(--text-tertiary);
  font-size: 10px;
}

.project-meta a {
  color: var(--brand-600);
  font-size: 11px;
  font-weight: 600;
  text-decoration: none;
}

.project-form {
  display: grid;
  gap: 18px;
}

.project-form label {
  display: grid;
  gap: 8px;
}

.project-form label > span {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
}

@media (max-width: 1279px) {
  .project-grid {
    grid-template-columns: repeat(2, minmax(280px, 1fr));
  }
}
</style>

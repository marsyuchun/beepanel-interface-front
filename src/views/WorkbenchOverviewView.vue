<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElAlert, ElButton, ElTag } from 'element-plus'

import { ApiClientError, api } from '@/api/client'
import AppSidebar from '@/components/AppSidebar.vue'
import type { Project, TestRun } from '@/types/api'

const projects = ref<Project[]>([])
const runs = ref<TestRun[]>([])
const loading = ref(false)
const errorMessage = ref('')

const passedRuns = computed(
  () => runs.value.filter((run) => run.status === 'PASSED').length,
)
const activeRuns = computed(
  () => runs.value.filter((run) => ['QUEUED', 'RUNNING'].includes(run.status)).length,
)
const recentRuns = computed(() => runs.value.slice(0, 5))

onMounted(() => {
  void loadOverview()
})

async function loadOverview(): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  try {
    const [loadedProjects, loadedRuns] = await Promise.all([
      api.listProjects(),
      api.listRuns(),
    ])
    projects.value = loadedProjects
    runs.value = loadedRuns
  } catch (error) {
    errorMessage.value =
      error instanceof ApiClientError ? error.message : '工作台数据加载失败'
  } finally {
    loading.value = false
  }
}

function statusType(
  status: TestRun['status'],
): 'success' | 'warning' | 'danger' | 'info' {
  if (status === 'PASSED') return 'success'
  if (status === 'RUNNING' || status === 'QUEUED') return 'warning'
  if (status === 'FAILED' || status === 'ERROR') return 'danger'
  return 'info'
}
</script>

<template>
  <div class="overview-shell">
    <AppSidebar />

    <section class="overview-application">
      <header class="overview-topbar">
        <div>
          <span>beepanel-interface-front</span>
          <i>/</i>
          <strong>工作台</strong>
        </div>
        <div class="overview-actions">
          <RouterLink to="/projects">
            <ElButton>项目管理</ElButton>
          </RouterLink>
          <RouterLink to="/cases">
            <ElButton type="primary">进入用例编排</ElButton>
          </RouterLink>
        </div>
      </header>

      <main v-loading="loading" class="overview-page">
        <div class="overview-heading">
          <span class="eyebrow">OVERVIEW</span>
          <h1>工作台</h1>
          <p>查看项目资产和测试执行概况，快速进入核心工作流。</p>
        </div>

        <ElAlert
          v-if="errorMessage"
          class="overview-alert"
          type="error"
          :title="errorMessage"
          show-icon
        />

        <section class="metrics-grid">
          <article>
            <span class="metric-icon projects">P</span>
            <div>
              <small>项目总数</small>
              <strong>{{ projects.length }}</strong>
              <p>已维护的接口测试项目</p>
            </div>
          </article>
          <article>
            <span class="metric-icon runs">R</span>
            <div>
              <small>运行总数</small>
              <strong>{{ runs.length }}</strong>
              <p>平台累计执行记录</p>
            </div>
          </article>
          <article>
            <span class="metric-icon passed">✓</span>
            <div>
              <small>通过运行</small>
              <strong>{{ passedRuns }}</strong>
              <p>状态为 PASSED 的运行</p>
            </div>
          </article>
          <article>
            <span class="metric-icon active">↻</span>
            <div>
              <small>执行中</small>
              <strong>{{ activeRuns }}</strong>
              <p>排队或正在执行的任务</p>
            </div>
          </article>
        </section>

        <section class="overview-content">
          <article class="panel quick-panel">
            <div class="panel-heading">
              <h2>快捷入口</h2>
            </div>
            <div class="quick-actions">
              <RouterLink to="/projects">
                <strong>创建与管理项目</strong>
                <span>维护项目名称、描述和测试资产</span>
              </RouterLink>
              <RouterLink to="/cases">
                <strong>编排测试套件</strong>
                <span>编辑用例、调整步骤并执行测试</span>
              </RouterLink>
            </div>
          </article>

          <article class="panel runs-panel">
            <div class="panel-heading">
              <h2>最近运行</h2>
              <span class="subtle-count">{{ recentRuns.length }} 条记录</span>
            </div>
            <div v-if="recentRuns.length" class="run-list">
              <div v-for="run in recentRuns" :key="run.id" class="run-row">
                <div>
                  <strong>运行 #{{ run.id }}</strong>
                  <span>{{ run.completed }} / {{ run.total }} 个步骤</span>
                </div>
                <ElTag :type="statusType(run.status)" effect="light" size="small">
                  {{ run.status }}
                </ElTag>
              </div>
            </div>
            <div v-else class="empty-runs">暂无运行记录，可前往用例编排执行测试。</div>
          </article>
        </section>
      </main>
    </section>
  </div>
</template>

<style scoped>
.overview-shell {
  min-height: 100%;
  min-width: 1024px;
  background: var(--surface-page);
}

.overview-application {
  min-height: 100vh;
  margin-left: var(--sidebar-width);
}

.overview-topbar {
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

.overview-topbar > div:first-child {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--text-tertiary);
  font-size: 12px;
}

.overview-topbar i {
  color: #c0c7d3;
  font-style: normal;
}

.overview-topbar strong {
  color: var(--text-secondary);
}

.overview-actions {
  display: flex;
  gap: 8px;
}

.overview-actions a {
  text-decoration: none;
}

.overview-page {
  min-height: calc(100vh - var(--header-height));
  padding: 30px;
}

.overview-heading {
  margin-bottom: 24px;
}

.eyebrow {
  color: var(--brand-600);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.3px;
}

.overview-heading h1 {
  margin: 8px 0 6px;
  font-size: 28px;
}

.overview-heading p {
  margin: 0;
  color: var(--text-tertiary);
  font-size: 13px;
}

.overview-alert {
  margin-bottom: 16px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 18px;
}

.metrics-grid article {
  display: flex;
  min-height: 138px;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: #fff;
  box-shadow: var(--shadow-panel);
}

.metric-icon {
  display: grid;
  width: 48px;
  height: 48px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 14px;
  font-size: 17px;
  font-weight: 700;
}

.metric-icon.projects {
  color: var(--brand-600);
  background: #eaf1ff;
}

.metric-icon.runs {
  color: #7d4ed8;
  background: #f1eafd;
}

.metric-icon.passed {
  color: var(--success);
  background: #e5f7f1;
}

.metric-icon.active {
  color: var(--warning);
  background: #fff3df;
}

.metrics-grid small,
.metrics-grid strong,
.metrics-grid p {
  display: block;
}

.metrics-grid small {
  color: var(--text-tertiary);
  font-size: 10px;
}

.metrics-grid strong {
  margin: 5px 0;
  font-size: 24px;
}

.metrics-grid p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 10px;
}

.overview-content {
  display: grid;
  grid-template-columns: minmax(300px, 0.8fr) minmax(420px, 1.2fr);
  gap: 16px;
}

.quick-actions {
  display: grid;
  gap: 12px;
  padding: 16px;
}

.quick-actions a {
  display: grid;
  gap: 6px;
  padding: 18px;
  border: 1px solid var(--border-default);
  border-radius: 9px;
  color: inherit;
  background: var(--surface-muted);
  text-decoration: none;
  transition:
    border-color 160ms ease,
    transform 160ms ease;
}

.quick-actions a:hover {
  border-color: #a8c5ff;
  transform: translateY(-1px);
}

.quick-actions strong {
  font-size: 13px;
}

.quick-actions span {
  color: var(--text-secondary);
  font-size: 11px;
}

.run-list {
  padding: 4px 16px 12px;
}

.run-row {
  display: flex;
  min-height: 62px;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-default);
}

.run-row div {
  display: grid;
  gap: 5px;
}

.run-row strong {
  font-size: 12px;
}

.run-row span {
  color: var(--text-tertiary);
  font-size: 10px;
}

.empty-runs {
  padding: 50px 20px;
  color: var(--text-tertiary);
  font-size: 12px;
  text-align: center;
}

@media (max-width: 1199px) {
  .metrics-grid {
    grid-template-columns: repeat(2, minmax(240px, 1fr));
  }
}
</style>

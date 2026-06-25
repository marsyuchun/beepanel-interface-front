<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import {
  ElAlert,
  ElButton,
  ElDialog,
  ElDrawer,
  ElOption,
  ElSelect,
  ElTag,
} from 'element-plus'

import AppSidebar from '@/components/AppSidebar.vue'
import CaseEditor from '@/components/CaseEditor.vue'
import CaseStepList from '@/components/CaseStepList.vue'
import RunProgressCard from '@/components/RunProgressCard.vue'
import SuiteTree from '@/components/SuiteTree.vue'
import VersionPanel from '@/components/VersionPanel.vue'
import { useWorkbenchStore } from '@/stores/workbench'

const store = useWorkbenchStore()
const {
  project,
  suites,
  activeSuite,
  steps,
  cases,
  versions,
  environments,
  activeStepId,
  activeEnvironmentId,
  activeCase,
  latestRun,
  runResults,
  runLogs,
  versionDiff,
  conflictMessage,
  errorMessage,
  loading,
  saving,
  realtimeState,
  canRun,
} = storeToRefs(store)

const versionDrawerVisible = ref(false)
const insertDialogVisible = ref(false)
const diffDialogVisible = ref(false)
const selectedCaseId = ref<number | null>(null)
const insertionAnchor = ref<{ beforeStepId?: number; afterStepId?: number }>({})

const pageSubtitle = computed(() => {
  if (activeSuite.value) {
    return `${steps.value.length} 个步骤 · 草稿 revision ${activeSuite.value.draft_revision}`
  }
  return '正在载入测试套件'
})

onMounted(() => {
  void store.load(1, 1).catch(() => undefined)
})

function openInsert(anchor: { beforeStepId?: number; afterStepId?: number }): void {
  insertionAnchor.value = anchor
  selectedCaseId.value = cases.value[0]?.id ?? null
  insertDialogVisible.value = true
}

function openTopInsert(): void {
  openInsert(activeStepId.value ? { afterStepId: activeStepId.value } : {})
}

async function confirmInsert(): Promise<void> {
  if (!selectedCaseId.value) {
    return
  }
  await store.insertExistingCase(selectedCaseId.value, insertionAnchor.value)
  insertDialogVisible.value = false
}

async function selectSuite(suiteId: number): Promise<void> {
  if (!project.value || suiteId === activeSuite.value?.id) {
    return
  }
  await store.load(project.value.id, suiteId)
}

async function compareVersions(fromVersionId: number, toVersionId: number): Promise<void> {
  await store.compareVersions(fromVersionId, toVersionId)
  diffDialogVisible.value = true
}
</script>

<template>
  <div class="app-shell">
    <AppSidebar />

    <section class="application">
      <header class="topbar">
        <div class="breadcrumb">
          <span>项目</span>
          <i>/</i>
          <strong>{{ project?.name ?? '用户中心 API' }}</strong>
          <i>/</i>
          <span>用例编排</span>
        </div>
        <div class="topbar-actions">
          <span class="save-indicator">
            <i :class="{ saving }" />
            {{ saving ? '正在保存' : '草稿已保存' }}
          </span>
          <ElSelect
            v-model="activeEnvironmentId"
            class="environment-select"
            aria-label="运行环境"
            placeholder="选择环境"
          >
            <ElOption
              v-for="environment in environments"
              :key="environment.id"
              :label="`${environment.name} 环境`"
              :value="environment.id"
            />
          </ElSelect>
          <button class="help-button" type="button" aria-label="帮助">?</button>
        </div>
      </header>

      <main class="page">
        <ElAlert
          v-if="conflictMessage"
          class="page-alert"
          type="warning"
          :title="conflictMessage"
          show-icon
          closable
        />
        <ElAlert
          v-if="errorMessage"
          class="page-alert"
          type="error"
          :title="errorMessage"
          show-icon
          closable
        />

        <div class="page-title-row">
          <div>
            <div class="eyebrow">
              <span>{{ project?.name ?? '用户中心 API' }}</span>
              <i />
              <span>{{ activeSuite?.name ?? '回归测试' }}</span>
            </div>
            <h1>用例编排</h1>
            <p>{{ pageSubtitle }}</p>
          </div>
          <div class="primary-actions">
            <ElButton class="version-trigger" @click="versionDrawerVisible = true">
              版本与运行
            </ElButton>
            <ElButton data-testid="insert-case" :disabled="loading" @click="openTopInsert">
              <span class="button-symbol">+</span>
              插入用例
            </ElButton>
            <ElButton
              type="primary"
              data-testid="run-suite"
              :disabled="!canRun"
              @click="store.createRun()"
            >
              <span class="play-symbol" />
              执行测试
            </ElButton>
          </div>
        </div>

        <div class="workspace" :class="{ loading }">
          <SuiteTree
            :project="project"
            :suites="suites"
            :active-suite-id="activeSuite?.id ?? null"
            @select="selectSuite"
          />
          <CaseStepList
            :steps="steps"
            :active-step-id="activeStepId"
            @select="store.selectStep"
            @insert="openInsert"
            @reorder="store.reorderSteps"
          />
          <CaseEditor
            :api-case="activeCase"
            :saving="saving"
            :revision="activeSuite?.draft_revision ?? 0"
            @update="store.updateActiveCase"
            @save="store.saveActiveCase"
          />
          <aside class="right-rail">
            <VersionPanel
              :versions="versions"
              @publish="store.publishVersion"
              @restore="store.restoreVersion"
              @compare="compareVersions"
            />
            <RunProgressCard
              :run="latestRun"
              :results="runResults"
              :logs="runLogs"
              :realtime-state="realtimeState"
              @cancel="store.cancelRun"
            />
          </aside>
        </div>
      </main>
    </section>

    <ElDialog v-model="insertDialogVisible" title="插入已有用例" width="520px">
      <p class="dialog-hint">
        复用已有接口定义，只在当前套件中创建新的步骤位置，不复制源用例。
      </p>
      <ElSelect v-model="selectedCaseId" class="case-select" placeholder="选择接口用例">
        <ElOption
          v-for="apiCaseItem in cases"
          :key="apiCaseItem.id"
          :label="`${apiCaseItem.method} · ${apiCaseItem.name} · ${apiCaseItem.path}`"
          :value="apiCaseItem.id"
        />
      </ElSelect>
      <template #footer>
        <ElButton @click="insertDialogVisible = false">取消</ElButton>
        <ElButton type="primary" :disabled="!selectedCaseId" @click="confirmInsert">
          确认插入
        </ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="diffDialogVisible" title="版本差异" width="640px">
      <div v-if="versionDiff" class="diff-grid">
        <div>
          <strong>{{ versionDiff.added_steps.length }}</strong>
          <span>新增步骤</span>
        </div>
        <div>
          <strong>{{ versionDiff.removed_steps.length }}</strong>
          <span>删除步骤</span>
        </div>
        <div>
          <strong>{{ versionDiff.reordered_steps.length }}</strong>
          <span>顺序变化</span>
        </div>
        <div>
          <strong>{{ versionDiff.changed_cases.length }}</strong>
          <span>用例变化</span>
        </div>
      </div>
      <pre v-if="versionDiff" class="diff-json">{{ JSON.stringify(versionDiff, null, 2) }}</pre>
    </ElDialog>

    <ElDrawer
      v-model="versionDrawerVisible"
      title="版本与最近运行"
      size="380px"
      class="version-drawer"
    >
      <div class="drawer-content">
        <VersionPanel
          :versions="versions"
          @publish="store.publishVersion"
          @restore="store.restoreVersion"
          @compare="compareVersions"
        />
        <RunProgressCard
          :run="latestRun"
          :results="runResults"
          :logs="runLogs"
          :realtime-state="realtimeState"
          @cancel="store.cancelRun"
        />
      </div>
    </ElDrawer>

  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100%;
  min-width: 1024px;
  background: var(--surface-page);
}

.application {
  min-height: 100vh;
  margin-left: var(--sidebar-width);
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 12;
  display: flex;
  height: var(--header-height);
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-bottom: 1px solid var(--border-default);
  background: rgb(255 255 255 / 94%);
  backdrop-filter: blur(12px);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--text-tertiary);
  font-size: 12px;
}

.breadcrumb strong {
  color: var(--text-secondary);
  font-weight: 600;
}

.breadcrumb i {
  color: #c0c7d3;
  font-style: normal;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.save-indicator {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--text-tertiary);
  font-size: 11px;
}

.save-indicator i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--success);
}

.save-indicator i.saving {
  background: var(--warning);
  animation: pulse 1s infinite;
}

.environment-select {
  width: 142px;
}

.help-button {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 1px solid var(--border-default);
  border-radius: 50%;
  color: var(--text-secondary);
  background: transparent;
  font-weight: 700;
}

.page {
  padding: 24px;
}

.page-alert {
  margin-bottom: 14px;
}

.page-title-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: var(--brand-600);
  font-size: 11px;
  font-weight: 650;
}

.eyebrow i {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #a8b3c4;
}

.page-title-row h1 {
  margin: 0;
  color: var(--text-primary);
  font-size: 25px;
  line-height: 1.2;
  letter-spacing: -0.4px;
}

.page-title-row p {
  margin: 7px 0 0;
  color: var(--text-tertiary);
  font-size: 12px;
}

.primary-actions {
  display: flex;
  align-items: center;
}

.button-symbol {
  margin-right: 5px;
  font-size: 18px;
  line-height: 10px;
}

.play-symbol {
  display: inline-block;
  width: 0;
  height: 0;
  margin-right: 7px;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-left: 8px solid currentcolor;
}

.version-trigger {
  display: none;
}

.workspace {
  display: grid;
  min-height: calc(100vh - 181px);
  grid-template-columns: 210px 250px minmax(400px, 1fr) 270px;
  gap: 12px;
  transition: opacity 160ms ease;
}

.workspace.loading {
  opacity: 0.62;
  pointer-events: none;
}

.right-rail {
  display: flex;
  min-height: 620px;
  flex-direction: column;
  gap: 12px;
}

.dialog-hint {
  margin: 0 0 14px;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.case-select {
  width: 100%;
}

.diff-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 14px;
}

.diff-grid div {
  padding: 13px;
  border: 1px solid var(--border-default);
  border-radius: 8px;
  background: var(--surface-muted);
  text-align: center;
}

.diff-grid strong,
.diff-grid span {
  display: block;
}

.diff-grid strong {
  margin-bottom: 5px;
  color: var(--brand-600);
  font-size: 18px;
}

.diff-grid span {
  color: var(--text-tertiary);
  font-size: 9px;
}

.diff-json {
  overflow: auto;
  max-height: 340px;
  padding: 12px;
  border-radius: 8px;
  color: #d7e5f8;
  background: #15243a;
  font: 10px/1.7 "SFMono-Regular", Consolas, monospace;
}

.drawer-content {
  display: grid;
  gap: 12px;
}

@keyframes pulse {
  50% {
    opacity: 0.35;
  }
}

@media (max-width: 1399px) {
  .workspace {
    grid-template-columns: 196px 232px minmax(380px, 1fr) 248px;
  }
}

@media (max-width: 1279px) {
  .workspace {
    grid-template-columns: 200px 240px minmax(390px, 1fr);
  }

  .right-rail {
    display: none;
  }

  .version-trigger {
    display: inline-flex;
  }
}

@media (max-width: 1023px) {
  .workspace {
    grid-template-columns: 200px 240px minmax(390px, 1fr);
  }
}
</style>

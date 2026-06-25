<script setup lang="ts">
import type { Project, TestSuite } from '@/types/api'

defineProps<{
  project: Project | null
  suites: TestSuite[]
  activeSuiteId: number | null
}>()

const emit = defineEmits<{
  select: [suiteId: number]
}>()
</script>

<template>
  <section class="panel suite-panel">
    <div class="panel-heading">
      <h2>套件目录</h2>
      <button class="icon-button" type="button" aria-label="新增套件">+</button>
    </div>
    <div class="tree-body">
      <div class="project-node">
        <span class="chevron">⌄</span>
        <span class="folder-shape" />
        <strong>{{ project?.name ?? '加载项目...' }}</strong>
      </div>
      <button
        v-for="suite in suites"
        :key="suite.id"
        class="suite-node"
        :class="{ active: suite.id === activeSuiteId }"
        type="button"
        @click="emit('select', suite.id)"
      >
        <span class="branch-line" />
        <span class="suite-icon" />
        <span>
          <strong>{{ suite.name }}</strong>
          <small>revision {{ suite.draft_revision }} · 草稿</small>
        </span>
      </button>
      <p v-if="suites.length === 0" class="empty-state">暂无测试套件</p>
    </div>
    <div class="suite-summary">
      <span>{{ suites.length }} 个测试套件</span>
      <span>自动保存草稿</span>
    </div>
  </section>
</template>

<style scoped>
.suite-panel {
  position: relative;
  min-height: 620px;
}

.icon-button {
  width: 27px;
  height: 27px;
  border: 1px solid var(--border-default);
  border-radius: 6px;
  color: var(--text-secondary);
  background: transparent;
  font-size: 17px;
}

.tree-body {
  padding: 14px 10px 58px;
}

.project-node {
  display: flex;
  align-items: center;
  gap: 7px;
  min-height: 34px;
  padding: 0 7px;
  font-size: 12px;
}

.chevron {
  color: var(--text-tertiary);
}

.folder-shape {
  position: relative;
  width: 16px;
  height: 12px;
  border-radius: 3px;
  background: #f0b94c;
}

.folder-shape::before {
  position: absolute;
  top: -3px;
  left: 1px;
  width: 7px;
  height: 4px;
  border-radius: 2px 2px 0 0;
  background: #f0b94c;
  content: "";
}

.suite-node {
  position: relative;
  display: flex;
  width: 100%;
  min-height: 58px;
  align-items: center;
  gap: 9px;
  margin: 4px 0;
  padding: 8px 7px 8px 27px;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--text-primary);
  background: transparent;
  text-align: left;
}

.suite-node.active {
  border-color: #cfe0ff;
  background: var(--surface-selected);
}

.branch-line {
  position: absolute;
  top: -10px;
  bottom: 29px;
  left: 14px;
  width: 10px;
  border-bottom: 1px solid #dfe4ed;
  border-left: 1px solid #dfe4ed;
}

.suite-icon {
  width: 16px;
  height: 18px;
  flex: 0 0 auto;
  border: 1.5px solid var(--brand-500);
  border-radius: 3px;
  background: #fff;
}

.suite-node strong,
.suite-node small {
  display: block;
}

.suite-node strong {
  overflow: hidden;
  max-width: 135px;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.suite-node small {
  margin-top: 5px;
  color: var(--text-tertiary);
  font-size: 9px;
}

.empty-state {
  margin: 28px 10px;
  color: var(--text-tertiary);
  font-size: 11px;
  text-align: center;
}

.suite-summary {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  justify-content: space-between;
  padding: 13px 14px;
  border-top: 1px solid var(--border-default);
  color: var(--text-tertiary);
  background: var(--surface-muted);
  font-size: 9px;
}
</style>

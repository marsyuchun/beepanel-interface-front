<script setup lang="ts">
import { ref } from 'vue'
import { ElButton, ElInput, ElTag } from 'element-plus'

import type { SuiteVersion } from '@/types/api'

defineProps<{
  versions: SuiteVersion[]
}>()

const emit = defineEmits<{
  publish: [summary: string]
  compare: [fromVersionId: number, toVersionId: number]
  restore: [versionId: number]
}>()

const summary = ref('')

function publish(): void {
  emit('publish', summary.value.trim())
  summary.value = ''
}
</script>

<template>
  <section class="panel version-panel">
    <div class="panel-heading">
      <h2>版本</h2>
      <span class="subtle-count">{{ versions.length }} 个发布版本</span>
    </div>
    <div v-if="versions[0]" class="version-current">
      <div>
        <span class="version-label">当前发布版本</span>
        <strong>v{{ versions[0].version_number }}</strong>
      </div>
      <ElTag type="success" effect="light" size="small">稳定</ElTag>
    </div>
    <div v-else class="version-empty">发布首个版本后即可执行测试</div>

    <div class="version-timeline">
      <article v-for="(version, index) in versions.slice(0, 4)" :key="version.id">
        <span class="timeline-dot" :class="{ current: index === 0 }" />
        <div>
          <div class="version-title">
            <strong>v{{ version.version_number }}</strong>
            <button type="button" @click="emit('restore', version.id)">恢复</button>
          </div>
          <p>{{ version.change_summary || '无变更说明' }}</p>
          <small>revision {{ version.source_revision }}</small>
        </div>
      </article>
    </div>

    <div class="version-actions">
      <ElInput v-model="summary" size="small" placeholder="本次变更说明" />
      <ElButton type="primary" size="small" @click="publish">发布新版本</ElButton>
      <ElButton
        size="small"
        :disabled="versions.length < 2"
        @click="
          versions[1] && versions[0] && emit('compare', versions[1].id, versions[0].id)
        "
      >
        对比最近版本
      </ElButton>
    </div>
  </section>
</template>

<style scoped>
.version-panel {
  flex: 1;
}

.version-current {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 14px;
  padding: 13px;
  border: 1px solid #d9e5fb;
  border-radius: 8px;
  background: #f5f8ff;
}

.version-label {
  display: block;
  margin-bottom: 5px;
  color: var(--text-tertiary);
  font-size: 9px;
}

.version-current strong {
  font-size: 17px;
}

.version-empty {
  margin: 14px;
  padding: 18px 12px;
  border: 1px dashed var(--border-strong);
  border-radius: 8px;
  color: var(--text-tertiary);
  font-size: 10px;
  text-align: center;
}

.version-timeline {
  padding: 2px 16px 8px;
}

.version-timeline article {
  position: relative;
  display: flex;
  gap: 11px;
  min-height: 78px;
}

.version-timeline article:not(:last-child)::before {
  position: absolute;
  top: 13px;
  bottom: -2px;
  left: 5px;
  width: 1px;
  background: var(--border-default);
  content: "";
}

.timeline-dot {
  z-index: 1;
  width: 11px;
  height: 11px;
  flex: 0 0 auto;
  margin-top: 3px;
  border: 3px solid #fff;
  border-radius: 50%;
  background: #aab5c5;
  box-shadow: 0 0 0 1px #cdd5e1;
}

.timeline-dot.current {
  background: var(--brand-600);
  box-shadow: 0 0 0 1px var(--brand-500);
}

.version-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.version-title strong {
  font-size: 11px;
}

.version-title button {
  border: 0;
  color: var(--brand-600);
  background: transparent;
  font-size: 9px;
}

.version-timeline article > div {
  min-width: 0;
  flex: 1;
}

.version-timeline p {
  margin: 5px 0;
  color: var(--text-secondary);
  font-size: 9px;
  line-height: 1.5;
}

.version-timeline small {
  color: var(--text-tertiary);
  font-size: 8px;
}

.version-actions {
  display: grid;
  gap: 7px;
  padding: 0 14px 14px;
}

.version-actions .el-button {
  width: 100%;
  margin: 0;
}
</style>

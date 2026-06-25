<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElButton, ElDrawer, ElProgress, ElTag } from 'element-plus'

import type { CaseResult, TestRun } from '@/types/api'

const props = defineProps<{
  run: TestRun | null
  results: CaseResult[]
  logs: string[]
  realtimeState: 'idle' | 'connecting' | 'live' | 'polling'
}>()

const emit = defineEmits<{
  cancel: []
}>()

const logsVisible = ref(false)
const percentage = computed(() => {
  if (!props.run?.total) {
    return 0
  }
  return Math.round((props.run.completed / props.run.total) * 100)
})
const isActive = computed(() => props.run?.status === 'QUEUED' || props.run?.status === 'RUNNING')
const statusType = computed<'success' | 'warning' | 'danger' | 'info'>(() => {
  if (props.run?.status === 'PASSED') {
    return 'success'
  }
  if (props.run?.status === 'FAILED' || props.run?.status === 'ERROR') {
    return 'danger'
  }
  if (isActive.value) {
    return 'warning'
  }
  return 'info'
})
</script>

<template>
  <section class="panel run-panel">
    <div class="panel-heading">
      <h2>最近运行</h2>
      <span class="connection-state" :class="realtimeState">
        {{ realtimeState === 'live' ? '实时' : realtimeState === 'polling' ? '轮询' : '' }}
      </span>
    </div>

    <div v-if="run" class="run-summary">
      <ElProgress
        type="circle"
        :percentage="percentage"
        :width="74"
        :stroke-width="7"
        :status="run.status === 'FAILED' ? 'exception' : undefined"
      />
      <div>
        <strong>{{ run.passed }} / {{ run.total }} 通过</strong>
        <p>{{ run.completed }} 个步骤已完成</p>
        <ElTag :type="statusType" size="small" effect="light">{{ run.status }}</ElTag>
      </div>
    </div>
    <div v-else class="run-empty">执行发布版本后在此查看进度</div>

    <div v-if="run" class="run-counters">
      <span><strong>{{ run.passed }}</strong> 通过</span>
      <span><strong>{{ run.failed }}</strong> 失败</span>
      <span><strong>{{ run.skipped }}</strong> 跳过</span>
    </div>

    <div class="run-actions">
      <ElButton v-if="isActive" type="danger" plain size="small" @click="emit('cancel')">
        取消运行
      </ElButton>
      <ElButton size="small" :disabled="!run" @click="logsVisible = true">
        日志与结果
      </ElButton>
    </div>

    <ElDrawer v-model="logsVisible" title="运行日志与结果" size="520px">
      <div class="log-section">
        <h3>实时日志</h3>
        <pre>{{ logs.length ? logs.join('\n') : '暂无运行日志' }}</pre>
      </div>
      <div class="result-section">
        <h3>用例结果</h3>
        <article v-for="result in results" :key="result.id">
          <div>
            <strong>{{ result.sequence }}. {{ result.case_name }}</strong>
            <small>{{ result.duration_ms.toFixed(1) }} ms</small>
          </div>
          <ElTag :type="result.status === 'PASSED' ? 'success' : 'danger'" size="small">
            {{ result.status }}
          </ElTag>
        </article>
        <p v-if="results.length === 0" class="result-empty">运行结束后展示结构化结果</p>
      </div>
    </ElDrawer>
  </section>
</template>

<style scoped>
.run-panel {
  flex: 0 0 auto;
}

.connection-state {
  color: var(--text-tertiary);
  font-size: 9px;
}

.connection-state.live {
  color: var(--success);
}

.connection-state.polling {
  color: var(--warning);
}

.run-summary {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 15px 16px 11px;
}

.run-summary :deep(.el-progress__text) {
  font-size: 15px !important;
  font-weight: 700;
}

.run-summary strong {
  font-size: 11px;
}

.run-summary p {
  margin: 5px 0 7px;
  color: var(--text-tertiary);
  font-size: 9px;
}

.run-empty {
  padding: 22px 14px;
  color: var(--text-tertiary);
  font-size: 10px;
  text-align: center;
}

.run-counters {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin: 0 14px 11px;
  padding: 9px 0;
  border: 1px solid var(--border-default);
  border-radius: 7px;
  color: var(--text-tertiary);
  font-size: 8px;
  text-align: center;
}

.run-counters strong {
  display: block;
  margin-bottom: 2px;
  color: var(--text-primary);
  font-size: 11px;
}

.run-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px;
  padding: 0 14px 14px;
}

.run-actions .el-button {
  width: 100%;
  margin: 0;
}

.log-section h3,
.result-section h3 {
  margin: 0 0 10px;
  font-size: 13px;
}

.log-section pre {
  overflow: auto;
  min-height: 150px;
  max-height: 280px;
  padding: 12px;
  border-radius: 8px;
  color: #d7e5f8;
  background: #15243a;
  font: 10px/1.7 "SFMono-Regular", Consolas, monospace;
  white-space: pre-wrap;
}

.result-section {
  margin-top: 22px;
}

.result-section article {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 10px;
  border: 1px solid var(--border-default);
  border-radius: 7px;
}

.result-section strong,
.result-section small {
  display: block;
}

.result-section strong {
  font-size: 10px;
}

.result-section small {
  margin-top: 4px;
  color: var(--text-tertiary);
  font-size: 8px;
}

.result-empty {
  color: var(--text-tertiary);
  font-size: 10px;
}
</style>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElTag } from 'element-plus'

import type { SuiteStep } from '@/types/api'

const props = defineProps<{
  steps: SuiteStep[]
  activeStepId: number | null
}>()

const emit = defineEmits<{
  select: [stepId: number]
  insert: [anchor: { beforeStepId?: number; afterStepId?: number }]
  reorder: [stepIds: number[]]
}>()

const localSteps = ref([...props.steps])
const draggedStepId = ref<number | null>(null)

watch(
  () => props.steps,
  (steps) => {
    localSteps.value = [...steps]
  },
  { deep: true },
)

function startDrag(stepId: number): void {
  draggedStepId.value = stepId
}

function dropAfter(targetStepId: number): void {
  const sourceStepId = draggedStepId.value
  draggedStepId.value = null
  if (sourceStepId === null || sourceStepId === targetStepId) {
    return
  }
  const reordered = localSteps.value.filter((step) => step.id !== sourceStepId)
  const source = localSteps.value.find((step) => step.id === sourceStepId)
  const targetIndex = reordered.findIndex((step) => step.id === targetStepId)
  if (!source || targetIndex < 0) {
    return
  }
  reordered.splice(targetIndex + 1, 0, source)
  localSteps.value = reordered
  emit(
    'reorder',
    reordered.map((step) => step.id),
  )
}

function tagType(method: SuiteStep['case']['method']): 'success' | 'danger' | undefined {
  if (method === 'GET') {
    return 'success'
  }
  if (method === 'DELETE') {
    return 'danger'
  }
  return undefined
}
</script>

<template>
  <section class="panel steps-panel">
    <div class="panel-heading">
      <div>
        <h2>用例步骤</h2>
        <span class="subtle-count">按顺序执行</span>
      </div>
      <button class="more-button" type="button" aria-label="更多操作">•••</button>
    </div>
    <div class="steps-list">
      <template v-for="(step, index) in localSteps" :key="step.id">
        <button
          v-if="index === 0"
          class="insert-line"
          type="button"
          :data-testid="`insert-before-${step.id}`"
          :aria-label="`在 ${step.case.name} 前插入`"
          @click="emit('insert', { beforeStepId: step.id })"
        >
          <span>+</span>
        </button>
        <article
          class="step-card"
          :class="{ selected: step.id === activeStepId, dragging: step.id === draggedStepId }"
          :data-testid="`step-${step.id}`"
          draggable="true"
          @click="emit('select', step.id)"
          @dragstart="startDrag(step.id)"
          @dragover.prevent
          @drop.prevent="dropAfter(step.id)"
        >
          <span class="drag-handle" aria-hidden="true">⠿</span>
          <span class="step-index">{{ index + 1 }}</span>
          <div class="step-content">
            <div>
              <ElTag size="small" effect="plain" :type="tagType(step.case.method)">
                {{ step.case.method }}
              </ElTag>
              <strong>{{ step.case.name }}</strong>
            </div>
            <small>{{ step.case.path }}</small>
          </div>
          <span class="step-menu" aria-hidden="true">⋮</span>
        </article>
        <button
          class="insert-line"
          type="button"
          :data-testid="`insert-after-${step.id}`"
          :aria-label="`在 ${step.case.name} 后插入`"
          @click="emit('insert', { afterStepId: step.id })"
        >
          <span>+</span>
        </button>
      </template>
      <button class="append-step" type="button" @click="emit('insert', {})">
        <span>+</span>
        添加到末尾
      </button>
    </div>
  </section>
</template>

<style scoped>
.steps-panel {
  min-height: 620px;
}

.panel-heading > div h2 {
  margin-bottom: 3px;
}

.more-button {
  border: 0;
  color: var(--text-secondary);
  background: transparent;
  letter-spacing: 2px;
}

.steps-list {
  overflow-y: auto;
  height: calc(100% - 52px);
  padding: 10px;
}

.insert-line {
  position: relative;
  display: block;
  width: 100%;
  height: 9px;
  border: 0;
  background: transparent;
}

.insert-line::before {
  position: absolute;
  top: 4px;
  right: 8px;
  left: 8px;
  height: 1px;
  background: transparent;
  content: "";
}

.insert-line span {
  position: absolute;
  z-index: 1;
  top: -4px;
  left: calc(50% - 9px);
  display: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  color: #fff;
  background: var(--brand-600);
  font-size: 14px;
  line-height: 18px;
}

.insert-line:hover::before,
.insert-line:focus-visible::before {
  background: var(--brand-500);
}

.insert-line:hover span,
.insert-line:focus-visible span {
  display: block;
}

.step-card {
  display: flex;
  min-height: 64px;
  align-items: center;
  gap: 8px;
  padding: 9px 8px;
  border: 1px solid var(--border-default);
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition:
    border-color 140ms ease,
    box-shadow 140ms ease,
    opacity 140ms ease;
}

.step-card.selected {
  border-color: #8cb4ff;
  background: #f5f8ff;
  box-shadow: inset 3px 0 var(--brand-600);
}

.step-card.dragging {
  opacity: 0.5;
}

.drag-handle,
.step-menu {
  color: #b0b9c7;
}

.drag-handle {
  cursor: grab;
}

.step-index {
  display: grid;
  width: 21px;
  height: 21px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 6px;
  color: var(--text-secondary);
  background: #edf1f7;
  font-size: 9px;
  font-weight: 700;
}

.step-content {
  min-width: 0;
  flex: 1;
}

.step-content > div {
  display: flex;
  align-items: center;
  gap: 6px;
}

.step-content strong {
  overflow: hidden;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.step-content small {
  display: block;
  overflow: hidden;
  margin-top: 6px;
  color: var(--text-tertiary);
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.append-step {
  width: 100%;
  height: 38px;
  border: 1px dashed #cbd4e2;
  border-radius: 8px;
  color: var(--text-secondary);
  background: var(--surface-muted);
  font-size: 11px;
}

.append-step span {
  margin-right: 5px;
  color: var(--brand-600);
  font-size: 15px;
}
</style>

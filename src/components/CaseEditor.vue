<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import {
  ElButton,
  ElInput,
  ElOption,
  ElSelect,
  ElSwitch,
  ElTabPane,
  ElTabs,
  ElTag,
} from 'element-plus'

import type {
  ApiCase,
  CaseAssertion,
  CaseExtractor,
  HttpMethod,
  JsonValue,
} from '@/types/api'

const props = defineProps<{
  apiCase: ApiCase | null
  saving: boolean
  revision: number
}>()

const emit = defineEmits<{
  update: [patch: Partial<ApiCase>]
  save: []
}>()

const activeTab = ref('body')
const jsonErrors = reactive<Record<string, string>>({})
const drafts = reactive({
  headers: '{}',
  query: '{}',
  body: 'null',
})

watch(
  () => props.apiCase,
  (apiCase) => {
    drafts.headers = JSON.stringify(apiCase?.headers ?? {}, null, 2)
    drafts.query = JSON.stringify(apiCase?.query ?? {}, null, 2)
    drafts.body = JSON.stringify(apiCase?.body ?? null, null, 2)
    Object.keys(jsonErrors).forEach((key) => delete jsonErrors[key])
  },
  { immediate: true },
)

const hasCase = computed(() => props.apiCase !== null)

function updateScalar<K extends keyof ApiCase>(field: K, value: ApiCase[K]): void {
  emit('update', { [field]: value } as Partial<ApiCase>)
}

function commitJson(field: 'headers' | 'query' | 'body'): void {
  try {
    const parsed = JSON.parse(drafts[field]) as JsonValue
    if ((field === 'headers' || field === 'query') && (Array.isArray(parsed) || parsed === null)) {
      throw new Error('必须是 JSON 对象')
    }
    jsonErrors[field] = ''
    emit('update', { [field]: parsed } as Partial<ApiCase>)
  } catch (error) {
    jsonErrors[field] = error instanceof Error ? error.message : 'JSON 格式无效'
  }
}

function replaceAssertions(assertions: CaseAssertion[]): void {
  emit('update', { assertions })
}

function addAssertion(): void {
  replaceAssertions([
    ...(props.apiCase?.assertions ?? []),
    { type: 'status_code', operator: 'equals', expected: 200 },
  ])
}

function removeAssertion(index: number): void {
  replaceAssertions((props.apiCase?.assertions ?? []).filter((_, itemIndex) => itemIndex !== index))
}

function updateAssertion(index: number, assertion: CaseAssertion): void {
  replaceAssertions(
    (props.apiCase?.assertions ?? []).map((item, itemIndex) =>
      itemIndex === index ? assertion : item,
    ),
  )
}

function replaceExtractors(extractors: CaseExtractor[]): void {
  emit('update', { extractors })
}

function addExtractor(): void {
  replaceExtractors([...(props.apiCase?.extractors ?? []), { name: '', path: '$.' }])
}

function updateExtractor(index: number, patch: Partial<CaseExtractor>): void {
  replaceExtractors(
    (props.apiCase?.extractors ?? []).map((extractor, itemIndex) =>
      itemIndex === index ? { ...extractor, ...patch } : extractor,
    ),
  )
}

function removeExtractor(index: number): void {
  replaceExtractors((props.apiCase?.extractors ?? []).filter((_, itemIndex) => itemIndex !== index))
}

function changeAssertionType(index: number, type: CaseAssertion['type']): void {
  if (type === 'status_code') {
    updateAssertion(index, { type, operator: 'equals', expected: 200 })
  } else if (type === 'json_value') {
    updateAssertion(index, { type, path: '$.', operator: 'equals', expected: '' })
  } else {
    updateAssertion(index, { type, path: '$.', operator: 'is', expected: 'string' })
  }
}
</script>

<template>
  <section class="panel editor-panel">
    <div v-if="!hasCase" class="empty-editor">
      <span class="empty-icon">API</span>
      <h2>选择一个用例步骤</h2>
      <p>从左侧步骤列表中选择用例后开始编辑。</p>
    </div>

    <template v-else-if="apiCase">
      <div class="editor-heading">
        <div>
          <span class="method-badge" :class="apiCase.method.toLowerCase()">
            {{ apiCase.method }}
          </span>
          <div>
            <ElInput
              class="case-name-input"
              :model-value="apiCase.name"
              aria-label="用例名称"
              @update:model-value="updateScalar('name', String($event))"
            />
            <p>用例 ID {{ apiCase.id }} · 自动保存已启用</p>
          </div>
        </div>
        <ElSwitch
          :model-value="apiCase.enabled"
          inline-prompt
          active-text="启用"
          inactive-text="停用"
          @update:model-value="updateScalar('enabled', Boolean($event))"
        />
      </div>

      <div class="request-line">
        <ElSelect
          :model-value="apiCase.method"
          class="method-select"
          aria-label="HTTP 方法"
          @update:model-value="updateScalar('method', $event as HttpMethod)"
        >
          <ElOption
            v-for="method in ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']"
            :key="method"
            :label="method"
            :value="method"
          />
        </ElSelect>
        <ElInput
          :model-value="apiCase.path"
          aria-label="请求路径"
          @update:model-value="updateScalar('path', String($event))"
        >
          <template #prepend>{{ '${base_url}' }}</template>
        </ElInput>
        <ElButton>试运行</ElButton>
      </div>

      <ElTabs v-model="activeTab" class="editor-tabs">
        <ElTabPane label="JSON Body" name="body">
          <div class="json-section">
            <div class="section-heading">
              <div>
                <h3>JSON 请求体</h3>
                <p>离开输入框后校验 JSON，格式有效时进入自动保存。</p>
              </div>
              <ElTag size="small" effect="plain">application/json</ElTag>
            </div>
            <ElInput
              v-model="drafts.body"
              type="textarea"
              :rows="9"
              resize="none"
              class="json-editor"
              @blur="commitJson('body')"
            />
            <p v-if="jsonErrors.body" class="field-error">{{ jsonErrors.body }}</p>
          </div>
        </ElTabPane>

        <ElTabPane label="Headers" name="headers">
          <div class="json-section">
            <div class="section-heading">
              <div>
                <h3>请求 Headers</h3>
                <p>用例值覆盖环境中的同名 Header。</p>
              </div>
            </div>
            <ElInput
              v-model="drafts.headers"
              type="textarea"
              :rows="9"
              resize="none"
              class="json-editor"
              @blur="commitJson('headers')"
            />
            <p v-if="jsonErrors.headers" class="field-error">{{ jsonErrors.headers }}</p>
          </div>
        </ElTabPane>

        <ElTabPane label="Query" name="query">
          <div class="json-section">
            <div class="section-heading">
              <div>
                <h3>Query 参数</h3>
                <p>支持使用 `${variable}` 引用运行变量。</p>
              </div>
            </div>
            <ElInput
              v-model="drafts.query"
              type="textarea"
              :rows="9"
              resize="none"
              class="json-editor"
              @blur="commitJson('query')"
            />
            <p v-if="jsonErrors.query" class="field-error">{{ jsonErrors.query }}</p>
          </div>
        </ElTabPane>

        <ElTabPane label="断言" name="assertions">
          <div class="section-heading">
            <div>
              <h3>断言规则</h3>
              <p>支持状态码、JSON 值和 JSON 类型断言。</p>
            </div>
            <ElButton size="small" @click="addAssertion">添加断言</ElButton>
          </div>
          <div
            v-for="(assertion, index) in apiCase.assertions"
            :key="`${assertion.type}-${index}`"
            class="rule-row assertion-row"
          >
            <ElSelect
              :model-value="assertion.type"
              @update:model-value="changeAssertionType(index, $event as CaseAssertion['type'])"
            >
              <ElOption label="状态码" value="status_code" />
              <ElOption label="JSON 值" value="json_value" />
              <ElOption label="JSON 类型" value="json_type" />
            </ElSelect>
            <ElInput
              v-if="assertion.type !== 'status_code'"
              :model-value="assertion.path"
              placeholder="$.data.id"
              @update:model-value="updateAssertion(index, { ...assertion, path: String($event) })"
            />
            <span v-else class="fixed-field">response.status</span>
            <span class="fixed-field">
              {{ assertion.type === 'json_type' ? '类型为' : '等于' }}
            </span>
            <ElInput
              v-if="assertion.type === 'status_code'"
              :model-value="String(assertion.expected)"
              @update:model-value="
                updateAssertion(index, { ...assertion, expected: Number($event) || 0 })
              "
            />
            <ElSelect
              v-else-if="assertion.type === 'json_type'"
              :model-value="assertion.expected"
              @update:model-value="
                updateAssertion(index, {
                  ...assertion,
                  expected: $event as typeof assertion.expected,
                })
              "
            >
              <ElOption
                v-for="valueType in ['object', 'array', 'string', 'number', 'boolean', 'null']"
                :key="valueType"
                :label="valueType"
                :value="valueType"
              />
            </ElSelect>
            <ElInput
              v-else
              :model-value="String(assertion.expected ?? '')"
              @update:model-value="
                updateAssertion(index, { ...assertion, expected: String($event) })
              "
            />
            <button class="remove-button" type="button" @click="removeAssertion(index)">×</button>
          </div>
          <p v-if="apiCase.assertions.length === 0" class="inline-empty">尚未配置断言</p>
        </ElTabPane>

        <ElTabPane label="变量提取" name="extractors">
          <div class="section-heading">
            <div>
              <h3>变量提取</h3>
              <p>提取成功后可供后续套件步骤引用。</p>
            </div>
            <ElButton size="small" @click="addExtractor">添加变量</ElButton>
          </div>
          <div
            v-for="(extractor, index) in apiCase.extractors"
            :key="`${extractor.name}-${index}`"
            class="rule-row extractor-row"
          >
            <ElInput
              :model-value="extractor.name"
              placeholder="变量名"
              @update:model-value="updateExtractor(index, { name: String($event) })"
            />
            <span>←</span>
            <ElInput
              :model-value="extractor.path"
              placeholder="$.data.token"
              @update:model-value="updateExtractor(index, { path: String($event) })"
            />
            <button class="remove-button" type="button" @click="removeExtractor(index)">×</button>
          </div>
          <p v-if="apiCase.extractors.length === 0" class="inline-empty">尚未配置变量提取</p>
        </ElTabPane>
      </ElTabs>

      <footer class="editor-footer">
        <span>草稿 revision {{ revision }}</span>
        <div class="save-state">
          <span v-if="saving">正在保存...</span>
          <span v-else>更改后 600ms 自动保存</span>
          <ElButton type="primary" :loading="saving" @click="emit('save')">立即保存</ElButton>
        </div>
      </footer>
    </template>
  </section>
</template>

<style scoped>
.editor-panel {
  display: flex;
  min-height: 620px;
  flex-direction: column;
}

.empty-editor {
  display: grid;
  min-height: 620px;
  place-content: center;
  color: var(--text-tertiary);
  text-align: center;
}

.empty-icon {
  display: grid;
  width: 52px;
  height: 52px;
  place-items: center;
  margin: 0 auto 14px;
  border-radius: 14px;
  color: var(--brand-600);
  background: var(--surface-selected);
  font-size: 12px;
  font-weight: 750;
}

.empty-editor h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: 15px;
}

.empty-editor p {
  margin: 8px 0 0;
  font-size: 11px;
}

.editor-heading {
  display: flex;
  min-height: 72px;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  border-bottom: 1px solid var(--border-default);
}

.editor-heading > div:first-child {
  display: flex;
  align-items: center;
  gap: 11px;
}

.method-badge {
  display: grid;
  height: 31px;
  min-width: 50px;
  place-items: center;
  padding: 0 8px;
  border-radius: 7px;
  color: #fff;
  background: #7858d7;
  font-size: 10px;
  font-weight: 750;
}

.method-badge.get {
  background: var(--success);
}

.method-badge.delete {
  background: var(--danger);
}

.case-name-input {
  width: 210px;
}

.case-name-input :deep(.el-input__wrapper) {
  padding: 0;
  box-shadow: none;
}

.case-name-input :deep(.el-input__inner) {
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 650;
}

.editor-heading p {
  margin: 4px 0 0;
  color: var(--text-tertiary);
  font-size: 9px;
}

.request-line {
  display: grid;
  grid-template-columns: 92px minmax(220px, 1fr) auto;
  gap: 8px;
  padding: 14px 18px 8px;
}

.editor-tabs {
  min-height: 0;
  flex: 1;
  padding: 0 18px;
}

.editor-tabs :deep(.el-tabs__header) {
  margin-bottom: 12px;
}

.editor-tabs :deep(.el-tabs__item) {
  height: 38px;
  padding: 0 13px;
  font-size: 11px;
}

.json-section {
  padding: 13px;
  border: 1px solid var(--border-default);
  border-radius: 8px;
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 11px;
}

.section-heading h3 {
  margin: 0;
  font-size: 11px;
}

.section-heading p {
  margin: 4px 0 0;
  color: var(--text-tertiary);
  font-size: 9px;
}

.json-editor :deep(textarea) {
  color: #d8e4f5;
  background: #18263a;
  font: 11px/1.7 "SFMono-Regular", Consolas, monospace;
}

.field-error {
  margin: 7px 0 0;
  color: var(--danger);
  font-size: 10px;
}

.rule-row {
  display: grid;
  align-items: center;
  gap: 7px;
  min-height: 44px;
  margin-bottom: 8px;
  padding: 6px 8px;
  border: 1px solid var(--border-default);
  border-radius: 7px;
}

.assertion-row {
  grid-template-columns: minmax(105px, 0.8fr) minmax(105px, 1.2fr) 64px minmax(80px, 0.8fr) 24px;
}

.extractor-row {
  grid-template-columns: minmax(90px, 0.8fr) 20px minmax(130px, 1.4fr) 24px;
}

.fixed-field {
  overflow: hidden;
  padding: 8px;
  border-radius: 5px;
  color: var(--text-secondary);
  background: var(--surface-muted);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-button {
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 5px;
  color: var(--text-tertiary);
  background: transparent;
  font-size: 16px;
}

.remove-button:hover {
  color: var(--danger);
  background: #fff1f1;
}

.inline-empty {
  padding: 24px;
  color: var(--text-tertiary);
  background: var(--surface-muted);
  font-size: 10px;
  text-align: center;
}

.editor-footer {
  display: flex;
  min-height: 58px;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding: 0 18px;
  border-top: 1px solid var(--border-default);
  color: var(--text-tertiary);
  background: #fbfcfe;
  font-size: 9px;
}

.save-state {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>

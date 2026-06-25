import { computed, onScopeDispose, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'

import { ApiClientError, api, runSocketUrl } from '@/api/client'
import type {
  ApiCase,
  ApiCasePayload,
  CaseResult,
  Environment,
  Project,
  RunEvent,
  SuiteStep,
  SuiteVersion,
  TestRun,
  TestSuite,
  VersionDiff,
} from '@/types/api'

const TERMINAL_RUN_STATUSES = new Set(['PASSED', 'FAILED', 'CANCELLED', 'ERROR', 'INTERRUPTED'])

export const useWorkbenchStore = defineStore('workbench', () => {
  const project = shallowRef<Project | null>(null)
  const suites = shallowRef<TestSuite[]>([])
  const activeSuite = shallowRef<TestSuite | null>(null)
  const steps = shallowRef<SuiteStep[]>([])
  const cases = shallowRef<ApiCase[]>([])
  const versions = shallowRef<SuiteVersion[]>([])
  const environments = shallowRef<Environment[]>([])
  const activeStepId = ref<number | null>(null)
  const activeEnvironmentId = ref<number | null>(null)
  const latestRun = shallowRef<TestRun | null>(null)
  const runResults = shallowRef<CaseResult[]>([])
  const runLogs = ref<string[]>([])
  const versionDiff = shallowRef<VersionDiff | null>(null)
  const conflictMessage = ref('')
  const errorMessage = ref('')
  const loading = ref(false)
  const saving = ref(false)
  const realtimeState = ref<'idle' | 'connecting' | 'live' | 'polling'>('idle')

  let autosaveTimer: ReturnType<typeof setTimeout> | null = null
  let pollingTimer: ReturnType<typeof setInterval> | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let socket: WebSocket | null = null
  let reconnectAttempts = 0

  const activeStep = computed<SuiteStep | null>(
    () => steps.value.find((step) => step.id === activeStepId.value) ?? null,
  )
  const activeCase = computed<ApiCase | null>(() => activeStep.value?.case ?? null)
  const activeEnvironment = computed<Environment | null>(
    () =>
      environments.value.find((environment) => environment.id === activeEnvironmentId.value) ??
      null,
  )
  const latestVersion = computed<SuiteVersion | null>(() => versions.value[0] ?? null)
  const canRun = computed(
    () => Boolean(activeSuite.value && activeEnvironment.value && latestVersion.value),
  )

  function applyConflict(error: unknown): boolean {
    if (
      error instanceof ApiClientError &&
      error.status === 409 &&
      error.code === 'SUITE_REVISION_CONFLICT'
    ) {
      conflictMessage.value = '套件草稿已被其他操作更新，已刷新到最新版本。'
      return true
    }
    return false
  }

  async function reloadSuite(): Promise<void> {
    if (!activeSuite.value) {
      return
    }
    const suiteId = activeSuite.value.id
    const [suite, loadedSteps, loadedVersions] = await Promise.all([
      api.getSuite(suiteId),
      api.listSuiteSteps(suiteId),
      api.listVersions(suiteId),
    ])
    activeSuite.value = suite
    steps.value = loadedSteps
    versions.value = loadedVersions
    if (!steps.value.some((step) => step.id === activeStepId.value)) {
      activeStepId.value = steps.value[0]?.id ?? null
    }
  }

  async function load(projectId: number, suiteId: number): Promise<void> {
    loading.value = true
    errorMessage.value = ''
    conflictMessage.value = ''
    try {
      const [
        loadedProject,
        loadedSuites,
        loadedSuite,
        loadedSteps,
        loadedVersions,
        loadedEnvironments,
        loadedCases,
        loadedRuns,
      ] = await Promise.all([
        api.getProject(projectId),
        api.listSuites(projectId),
        api.getSuite(suiteId),
        api.listSuiteSteps(suiteId),
        api.listVersions(suiteId),
        api.listEnvironments(),
        api.listCases(projectId),
        api.listRuns(),
      ])
      project.value = loadedProject
      suites.value = loadedSuites
      activeSuite.value = loadedSuite
      steps.value = loadedSteps
      versions.value = loadedVersions
      environments.value = loadedEnvironments
      cases.value = loadedCases
      activeStepId.value = loadedSteps[0]?.id ?? null
      activeEnvironmentId.value =
        loadedEnvironments.find((environment) => environment.is_default)?.id ??
        loadedEnvironments[0]?.id ??
        null
      latestRun.value =
        loadedRuns.find((run) => run.suite_id === suiteId) ?? null
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '工作台加载失败'
      throw error
    } finally {
      loading.value = false
    }
  }

  function selectStep(stepId: number): void {
    activeStepId.value = stepId
  }

  function isCaseValid(value: ApiCase): boolean {
    return Boolean(value.name.trim() && value.path.startsWith('/'))
  }

  function toCasePayload(value: ApiCase): ApiCasePayload {
    return {
      project_id: value.project_id,
      name: value.name,
      method: value.method,
      path: value.path,
      headers: value.headers,
      query: value.query,
      body: value.body,
      assertions: value.assertions,
      extractors: value.extractors,
      enabled: value.enabled,
    }
  }

  async function saveActiveCase(): Promise<void> {
    if (!activeCase.value || saving.value || !isCaseValid(activeCase.value)) {
      return
    }
    saving.value = true
    errorMessage.value = ''
    conflictMessage.value = ''
    try {
      const updated = await api.updateCase(activeCase.value.id, toCasePayload(activeCase.value))
      steps.value = steps.value.map((step) =>
        step.id === activeStepId.value ? { ...step, case: updated } : step,
      )
      const caseIndex = cases.value.findIndex((item) => item.id === updated.id)
      if (caseIndex >= 0) {
        cases.value[caseIndex] = updated
      }
    } catch (error) {
      if (applyConflict(error)) {
        await reloadSuite()
        return
      }
      errorMessage.value = error instanceof Error ? error.message : '保存用例失败'
    } finally {
      saving.value = false
    }
  }

  function scheduleAutosave(): void {
    if (autosaveTimer) {
      clearTimeout(autosaveTimer)
    }
    if (!activeCase.value || !isCaseValid(activeCase.value)) {
      return
    }
    autosaveTimer = setTimeout(() => {
      void saveActiveCase()
    }, 600)
  }

  function updateActiveCase(patch: Partial<ApiCase>): void {
    if (!activeCase.value) {
      return
    }
    const updatedCase = { ...activeCase.value, ...patch }
    steps.value = steps.value.map((step) =>
      step.id === activeStepId.value ? { ...step, case: updatedCase } : step,
    )
    scheduleAutosave()
  }

  async function insertExistingCase(
    caseId: number,
    anchor: { beforeStepId?: number; afterStepId?: number } = {},
  ): Promise<void> {
    if (!activeSuite.value) {
      return
    }
    try {
      const inserted = await api.insertSuiteStep(activeSuite.value.id, {
        case_id: caseId,
        draft_revision: activeSuite.value.draft_revision,
        before_step_id: anchor.beforeStepId,
        after_step_id: anchor.afterStepId,
      })
      await reloadSuite()
      activeStepId.value = inserted.id
    } catch (error) {
      if (applyConflict(error)) {
        await reloadSuite()
        return
      }
      errorMessage.value = error instanceof Error ? error.message : '插入用例失败'
    }
  }

  async function reorderSteps(stepIds: number[]): Promise<void> {
    if (!activeSuite.value) {
      return
    }
    try {
      const response = await api.reorderSuiteSteps(
        activeSuite.value.id,
        stepIds,
        activeSuite.value.draft_revision,
      )
      activeSuite.value = response.suite
      steps.value = response.steps
    } catch (error) {
      if (applyConflict(error)) {
        await reloadSuite()
        return
      }
      errorMessage.value = error instanceof Error ? error.message : '调整步骤顺序失败'
    }
  }

  async function publishVersion(changeSummary: string): Promise<void> {
    if (!activeSuite.value) {
      return
    }
    try {
      const version = await api.publishVersion(
        activeSuite.value.id,
        activeSuite.value.draft_revision,
        changeSummary,
      )
      versions.value = [version, ...versions.value]
    } catch (error) {
      if (applyConflict(error)) {
        await reloadSuite()
        return
      }
      errorMessage.value = error instanceof Error ? error.message : '发布版本失败'
    }
  }

  async function restoreVersion(versionId: number): Promise<void> {
    if (!activeSuite.value) {
      return
    }
    try {
      const response = await api.restoreVersion(
        activeSuite.value.id,
        versionId,
        activeSuite.value.draft_revision,
      )
      activeSuite.value = response.suite
      steps.value = response.steps
      activeStepId.value = response.steps[0]?.id ?? null
      versions.value = await api.listVersions(activeSuite.value.id)
    } catch (error) {
      if (applyConflict(error)) {
        await reloadSuite()
        return
      }
      errorMessage.value = error instanceof Error ? error.message : '恢复版本失败'
    }
  }

  async function compareVersions(fromVersionId: number, toVersionId: number): Promise<void> {
    if (!activeSuite.value) {
      return
    }
    versionDiff.value = await api.compareVersions(
      activeSuite.value.id,
      fromVersionId,
      toVersionId,
    )
  }

  function stopRealtime(): void {
    socket?.close()
    socket = null
    if (pollingTimer) {
      clearInterval(pollingTimer)
      pollingTimer = null
    }
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    realtimeState.value = 'idle'
  }

  async function refreshRun(runId: number): Promise<void> {
    latestRun.value = await api.getRun(runId)
    if (TERMINAL_RUN_STATUSES.has(latestRun.value.status)) {
      runResults.value = await api.listRunResults(runId)
      stopRealtime()
    }
  }

  function startPolling(runId: number): void {
    if (pollingTimer) {
      return
    }
    realtimeState.value = 'polling'
    void refreshRun(runId)
    pollingTimer = setInterval(() => {
      void refreshRun(runId)
    }, 2000)
  }

  function handleRunEvent(event: RunEvent): void {
    if (event.type === 'run_snapshot') {
      latestRun.value = event.run
      return
    }
    if (!latestRun.value) {
      return
    }
    if (event.type === 'collection_started') {
      latestRun.value = { ...latestRun.value, total: event.total }
    } else if (event.type === 'case_started') {
      latestRun.value = { ...latestRun.value, status: 'RUNNING' }
    } else if (event.type === 'case_finished') {
      const nextRun = {
        ...latestRun.value,
        completed: latestRun.value.completed + 1,
      }
      if (event.status === 'PASSED') {
        nextRun.passed += 1
      } else if (event.status === 'SKIPPED') {
        nextRun.skipped += 1
      } else {
        nextRun.failed += 1
      }
      latestRun.value = nextRun
    } else if (event.type === 'case_log') {
      runLogs.value.push(event.message)
    } else if (event.type === 'run_finished') {
      latestRun.value = { ...latestRun.value, status: event.status }
      void refreshRun(latestRun.value.id)
    }
  }

  function connectRunEvents(runId: number): void {
    stopRealtime()
    realtimeState.value = 'connecting'
    socket = new WebSocket(runSocketUrl(runId))
    socket.addEventListener('open', () => {
      reconnectAttempts = 0
      realtimeState.value = 'live'
    })
    socket.addEventListener('message', (message) => {
      handleRunEvent(JSON.parse(String(message.data)) as RunEvent)
    })
    socket.addEventListener('close', () => {
      socket = null
      if (latestRun.value && TERMINAL_RUN_STATUSES.has(latestRun.value.status)) {
        stopRealtime()
        return
      }
      reconnectAttempts += 1
      if (reconnectAttempts <= 3) {
        reconnectTimer = setTimeout(() => connectRunEvents(runId), reconnectAttempts * 1000)
      } else {
        startPolling(runId)
      }
    })
    socket.addEventListener('error', () => {
      socket?.close()
    })
  }

  async function createRun(versionId = latestVersion.value?.id): Promise<void> {
    if (!activeSuite.value || !activeEnvironment.value || !versionId) {
      return
    }
    runLogs.value = []
    runResults.value = []
    latestRun.value = await api.createRun({
      suite_id: activeSuite.value.id,
      suite_version_id: versionId,
      environment_id: activeEnvironment.value.id,
      source_type: 'FORM_SUITE',
    })
    connectRunEvents(latestRun.value.id)
  }

  async function cancelRun(): Promise<void> {
    if (!latestRun.value) {
      return
    }
    latestRun.value = await api.cancelRun(latestRun.value.id)
  }

  onScopeDispose(stopRealtime)

  return {
    project,
    suites,
    activeSuite,
    steps,
    cases,
    versions,
    environments,
    activeStepId,
    activeEnvironmentId,
    latestRun,
    runResults,
    runLogs,
    versionDiff,
    conflictMessage,
    errorMessage,
    loading,
    saving,
    realtimeState,
    activeStep,
    activeCase,
    activeEnvironment,
    latestVersion,
    canRun,
    load,
    reloadSuite,
    selectStep,
    saveActiveCase,
    scheduleAutosave,
    updateActiveCase,
    insertExistingCase,
    reorderSteps,
    publishVersion,
    restoreVersion,
    compareVersions,
    createRun,
    cancelRun,
    stopRealtime,
  }
})

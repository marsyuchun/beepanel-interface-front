import axios, { AxiosError } from 'axios'

import type {
  ApiCase,
  ApiCasePayload,
  ApiErrorResponse,
  CaseResult,
  Environment,
  Project,
  SuiteStep,
  SuiteStepsResponse,
  SuiteVersion,
  TestRun,
  TestSuite,
  VersionDiff,
} from '@/types/api'

const http = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
})

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

function normalizeError(error: unknown): never {
  if (error instanceof ApiClientError) {
    throw error
  }
  if (error instanceof AxiosError) {
    const payload = error.response?.data as Partial<ApiErrorResponse> | undefined
    throw new ApiClientError(
      error.response?.status ?? 0,
      payload?.code ?? 'NETWORK_ERROR',
      payload?.message ?? error.message,
      payload?.details ?? {},
    )
  }
  throw error
}

async function request<T>(operation: () => Promise<{ data: T }>): Promise<T> {
  try {
    const response = await operation()
    return response.data
  } catch (error) {
    return normalizeError(error)
  }
}

export const api = {
  listProjects: () =>
    request<Project[]>(() => http.get('/api/v1/projects')),

  createProject: (payload: { name: string; description: string }) =>
    request<Project>(() => http.post('/api/v1/projects', payload)),

  getProject: (projectId: number) =>
    request<Project>(() => http.get(`/api/v1/projects/${projectId}`)),

  listSuites: (projectId: number) =>
    request<TestSuite[]>(() => http.get(`/api/v1/projects/${projectId}/suites`)),

  getSuite: (suiteId: number) =>
    request<TestSuite>(() => http.get(`/api/v1/suites/${suiteId}`)),

  listSuiteSteps: (suiteId: number) =>
    request<SuiteStep[]>(() => http.get(`/api/v1/suites/${suiteId}/steps`)),

  listCases: (projectId: number) =>
    request<ApiCase[]>(() => http.get('/api/v1/cases', { params: { project_id: projectId } })),

  updateCase: (caseId: number, payload: ApiCasePayload) =>
    request<ApiCase>(() => http.put(`/api/v1/cases/${caseId}`, payload)),

  insertSuiteStep: (
    suiteId: number,
    payload: {
      case_id: number
      draft_revision: number
      before_step_id?: number
      after_step_id?: number
    },
  ) => request<SuiteStep>(() => http.post(`/api/v1/suites/${suiteId}/steps`, payload)),

  reorderSuiteSteps: (suiteId: number, stepIds: number[], draftRevision: number) =>
    request<SuiteStepsResponse>(() =>
      http.put(`/api/v1/suites/${suiteId}/steps/order`, {
        step_ids: stepIds,
        draft_revision: draftRevision,
      }),
    ),

  listVersions: (suiteId: number) =>
    request<SuiteVersion[]>(() => http.get(`/api/v1/suites/${suiteId}/versions`)),

  publishVersion: (suiteId: number, draftRevision: number, changeSummary: string) =>
    request<SuiteVersion>(() =>
      http.post(`/api/v1/suites/${suiteId}/versions`, {
        draft_revision: draftRevision,
        change_summary: changeSummary,
      }),
    ),

  restoreVersion: (suiteId: number, versionId: number, draftRevision: number) =>
    request<SuiteStepsResponse>(() =>
      http.post(`/api/v1/suites/${suiteId}/versions/${versionId}/restore`, {
        draft_revision: draftRevision,
      }),
    ),

  compareVersions: (suiteId: number, fromVersionId: number, toVersionId: number) =>
    request<VersionDiff>(() =>
      http.get(`/api/v1/suites/${suiteId}/versions/compare`, {
        params: {
          from_version_id: fromVersionId,
          to_version_id: toVersionId,
        },
      }),
    ),

  listEnvironments: () =>
    request<Environment[]>(() => http.get('/api/v1/environments')),

  listRuns: () => request<TestRun[]>(() => http.get('/api/v1/runs')),

  getRun: (runId: number) =>
    request<TestRun>(() => http.get(`/api/v1/runs/${runId}`)),

  listRunResults: (runId: number) =>
    request<CaseResult[]>(() => http.get(`/api/v1/runs/${runId}/results`)),

  createRun: (payload: {
    suite_id: number
    suite_version_id: number
    environment_id: number
    source_type: 'FORM_SUITE'
  }) => request<TestRun>(() => http.post('/api/v1/runs', payload)),

  cancelRun: (runId: number) =>
    request<TestRun>(() => http.post(`/api/v1/runs/${runId}/cancel`)),
}

export function runSocketUrl(runId: number): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws/runs/${runId}`
}

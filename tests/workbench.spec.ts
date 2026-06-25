import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiClientError, api } from '@/api/client'
import { useWorkbenchStore } from '@/stores/workbench'

vi.mock('@/api/client', () => {
  class MockApiClientError extends Error {
    constructor(
      public status: number,
      public code: string,
      message: string,
      public details: Record<string, unknown> = {},
    ) {
      super(message)
    }
  }

  return {
    ApiClientError: MockApiClientError,
    api: {
      getProject: vi.fn(),
      listSuites: vi.fn(),
      getSuite: vi.fn(),
      listSuiteSteps: vi.fn(),
      listVersions: vi.fn(),
      listEnvironments: vi.fn(),
      listCases: vi.fn(),
      listRuns: vi.fn(),
      updateCase: vi.fn(),
    },
  }
})

const timestamp = '2026-06-13T08:00:00Z'
const project = {
  id: 1,
  name: '用户中心 API',
  description: '',
  created_at: timestamp,
  updated_at: timestamp,
}
const suite = {
  id: 1,
  project_id: 1,
  name: '用户中心回归套件',
  description: '',
  draft_revision: 8,
  created_at: timestamp,
  updated_at: timestamp,
}
const apiCase = {
  id: 11,
  project_id: 1,
  name: '用户登录',
  method: 'POST' as const,
  path: '/auth/login',
  headers: {},
  query: {},
  body: { username: 'admin', password: 'password123' },
  assertions: [{ type: 'status_code' as const, operator: 'equals' as const, expected: 200 }],
  extractors: [{ name: 'auth_token', path: '$.data.token' }],
  enabled: true,
  created_at: timestamp,
  updated_at: timestamp,
}
const steps = Array.from({ length: 6 }, (_, index) => ({
  id: 101 + index,
  suite_id: 1,
  case_id: 11,
  position: (index + 1) * 10,
  enabled: true,
  created_at: timestamp,
  case: { ...apiCase, id: 11 + index, name: index === 0 ? '用户登录' : `步骤 ${index + 1}` },
}))
const environment = {
  id: 1,
  name: 'Test',
  base_url: 'http://127.0.0.1:5000',
  headers: {},
  variables: {},
  is_default: true,
  created_at: timestamp,
  updated_at: timestamp,
}
const version = {
  id: 1,
  suite_id: 1,
  version_number: 1,
  source_revision: 8,
  snapshot: {},
  change_summary: '初始化',
  created_at: timestamp,
}

describe('workbench store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(api.getProject).mockResolvedValue(project)
    vi.mocked(api.listSuites).mockResolvedValue([suite])
    vi.mocked(api.getSuite).mockResolvedValue(suite)
    vi.mocked(api.listSuiteSteps).mockResolvedValue(steps)
    vi.mocked(api.listVersions).mockResolvedValue([version])
    vi.mocked(api.listEnvironments).mockResolvedValue([environment])
    vi.mocked(api.listCases).mockResolvedValue(steps.map((step) => step.case))
    vi.mocked(api.listRuns).mockResolvedValue([])
    vi.mocked(api.updateCase).mockResolvedValue(apiCase)
  })

  it('loads project, suite, steps, versions, and default environment', async () => {
    const store = useWorkbenchStore()

    await store.load(1, 1)

    expect(store.activeSuite?.name).toBe('用户中心回归套件')
    expect(store.steps).toHaveLength(6)
    expect(store.activeEnvironment?.name).toBe('Test')
    expect(store.activeCase?.name).toBe('用户登录')
  })

  it('reloads the suite when saving returns revision conflict', async () => {
    const store = useWorkbenchStore()
    await store.load(1, 1)
    vi.mocked(api.updateCase).mockRejectedValue(
      new ApiClientError(409, 'SUITE_REVISION_CONFLICT', 'Suite draft changed.'),
    )

    await store.saveActiveCase()

    expect(api.getSuite).toHaveBeenCalledTimes(2)
    expect(store.conflictMessage).toContain('刷新')
  })
})

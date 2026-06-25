import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { vi } from 'vitest'

import CaseWorkbenchView from '@/views/CaseWorkbenchView.vue'

vi.mock('@/api/client', () => {
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
    draft_revision: 1,
    created_at: timestamp,
    updated_at: timestamp,
  }
  return {
    ApiClientError: class extends Error {},
    runSocketUrl: vi.fn(),
    api: {
      getProject: vi.fn().mockResolvedValue(project),
      listSuites: vi.fn().mockResolvedValue([suite]),
      getSuite: vi.fn().mockResolvedValue(suite),
      listSuiteSteps: vi.fn().mockResolvedValue([]),
      listVersions: vi.fn().mockResolvedValue([]),
      listEnvironments: vi.fn().mockResolvedValue([]),
      listCases: vi.fn().mockResolvedValue([]),
      listRuns: vi.fn().mockResolvedValue([]),
    },
  }
})

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: CaseWorkbenchView },
    { path: '/workbench', component: { template: '<div>工作台</div>' } },
    { path: '/projects', component: { template: '<div>项目管理</div>' } },
    { path: '/cases', component: CaseWorkbenchView },
  ],
})

describe('CaseWorkbenchView', () => {
  it('renders the approved API Pilot navigation and primary actions', async () => {
    await router.push('/')
    await router.isReady()

    const wrapper = mount(CaseWorkbenchView, {
      global: {
        plugins: [router, createPinia()],
      },
    })

    expect(wrapper.text()).toContain('API Pilot')
    expect(wrapper.text()).toContain('用例编排')
    expect(wrapper.get('[data-testid="insert-case"]').text()).toContain('插入用例')
    expect(wrapper.get('[data-testid="run-suite"]').text()).toContain('执行测试')
  })

  it('keeps the workbench available at narrow viewport widths', async () => {
    await router.push('/')
    await router.isReady()

    const wrapper = mount(CaseWorkbenchView, {
      global: {
        plugins: [router, createPinia()],
      },
    })

    expect(wrapper.find('.unsupported-editor').exists()).toBe(false)
    expect(wrapper.find('.application').exists()).toBe(true)
    expect(wrapper.find('.workspace').exists()).toBe(true)
  })
})

import ElementPlus from 'element-plus'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { vi } from 'vitest'

import App from '@/App.vue'
import { api } from '@/api/client'
import router from '@/router'

vi.mock('@/api/client', () => ({
  ApiClientError: class extends Error {},
  runSocketUrl: vi.fn(),
  api: {
    listProjects: vi.fn(),
    listRuns: vi.fn(),
  },
}))

describe('WorkbenchOverviewView', () => {
  it('renders a distinct workbench overview page', async () => {
    vi.mocked(api.listProjects).mockResolvedValue([])
    vi.mocked(api.listRuns).mockResolvedValue([])
    await router.push('/workbench')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [router, createPinia(), ElementPlus],
      },
    })
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('工作台')
    expect(wrapper.text()).toContain('项目总数')
    expect(wrapper.text()).toContain('最近运行')
  })
})

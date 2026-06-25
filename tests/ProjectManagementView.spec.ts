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
    createProject: vi.fn(),
  },
}))

const timestamp = '2026-06-13T08:00:00Z'
const demoProject = {
  id: 1,
  name: '用户中心 API',
  description: '演示项目',
  created_at: timestamp,
  updated_at: timestamp,
}
const createdProject = {
  id: 2,
  name: '订单中心 API',
  description: '订单接口回归',
  created_at: timestamp,
  updated_at: timestamp,
}

describe('ProjectManagementView', () => {
  it('creates a project and adds it to the project list', async () => {
    vi.mocked(api.listProjects).mockResolvedValue([demoProject])
    vi.mocked(api.createProject).mockResolvedValue(createdProject)
    await router.push('/projects')
    await router.isReady()

    const wrapper = mount(App, {
      attachTo: document.body,
      global: {
        plugins: [router, createPinia(), ElementPlus],
      },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('项目管理')
    expect(wrapper.text()).toContain('用户中心 API')

    await wrapper.get('[data-testid="create-project"]').trigger('click')
    await flushPromises()

    const nameInput = document.querySelector<HTMLInputElement>(
      '[aria-label="项目名称"]',
    )
    const descriptionInput = document.querySelector<HTMLTextAreaElement>(
      '[aria-label="项目描述"]',
    )
    expect(nameInput).not.toBeNull()
    expect(descriptionInput).not.toBeNull()

    nameInput!.value = '订单中心 API'
    nameInput!.dispatchEvent(new Event('input', { bubbles: true }))
    descriptionInput!.value = '订单接口回归'
    descriptionInput!.dispatchEvent(new Event('input', { bubbles: true }))

    const submit = document.querySelector<HTMLButtonElement>(
      '[data-testid="confirm-create-project"]',
    )
    expect(submit).not.toBeNull()
    submit!.click()
    await flushPromises()

    expect(api.createProject).toHaveBeenCalledWith({
      name: '订单中心 API',
      description: '订单接口回归',
    })
    expect(wrapper.text()).toContain('订单中心 API')

    wrapper.unmount()
  })
})

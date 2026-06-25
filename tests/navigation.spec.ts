import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

import AppSidebar from '@/components/AppSidebar.vue'

describe('AppSidebar', () => {
  it('navigates between the workbench and project management', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/workbench', component: { template: '<div>工作台页面</div>' } },
        { path: '/projects', component: { template: '<div>项目管理页面</div>' } },
        { path: '/cases', component: { template: '<div>用例编排页面</div>' } },
      ],
    })
    await router.push('/cases')
    await router.isReady()

    const wrapper = mount(AppSidebar, {
      global: {
        plugins: [router],
      },
    })

    await wrapper.get('[data-testid="nav-projects"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/projects')

    await wrapper.get('[data-testid="nav-workbench"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/workbench')
  })
})

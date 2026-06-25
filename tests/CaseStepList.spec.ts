import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import CaseStepList from '@/components/CaseStepList.vue'

const timestamp = '2026-06-13T08:00:00Z'
const makeStep = (id: number, name: string) => ({
  id,
  suite_id: 1,
  case_id: id + 100,
  position: id * 10,
  enabled: true,
  created_at: timestamp,
  case: {
    id: id + 100,
    project_id: 1,
    name,
    method: 'GET' as const,
    path: `/users/${id}`,
    headers: {},
    query: {},
    body: null,
    assertions: [],
    extractors: [],
    enabled: true,
    created_at: timestamp,
    updated_at: timestamp,
  },
})

const steps = [makeStep(11, '第一步'), makeStep(12, '第二步'), makeStep(13, '第三步')]

describe('CaseStepList', () => {
  it('emits the insertion anchor after the selected step', async () => {
    const wrapper = mount(CaseStepList, {
      props: { steps, activeStepId: 11 },
    })

    await wrapper.get('[data-testid="insert-after-11"]').trigger('click')

    expect(wrapper.emitted('insert')).toEqual([[{ afterStepId: 11 }]])
  })

  it('emits the complete order after a drag finishes', async () => {
    const wrapper = mount(CaseStepList, {
      props: { steps, activeStepId: 11 },
    })

    await wrapper.get('[data-testid="step-11"]').trigger('dragstart')
    await wrapper.get('[data-testid="step-13"]').trigger('dragover')
    await wrapper.get('[data-testid="step-13"]').trigger('drop')

    expect(wrapper.emitted('reorder')).toEqual([[[12, 13, 11]]])
  })
})

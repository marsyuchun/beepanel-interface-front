import { createRouter, createWebHistory } from 'vue-router'

import CaseWorkbenchView from '@/views/CaseWorkbenchView.vue'
import ProjectManagementView from '@/views/ProjectManagementView.vue'
import WorkbenchOverviewView from '@/views/WorkbenchOverviewView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/cases',
    },
    {
      path: '/workbench',
      name: 'workbench-overview',
      component: WorkbenchOverviewView,
    },
    {
      path: '/cases',
      name: 'case-workbench',
      component: CaseWorkbenchView,
    },
    {
      path: '/projects',
      name: 'project-management',
      component: ProjectManagementView,
    },
  ],
})

export default router

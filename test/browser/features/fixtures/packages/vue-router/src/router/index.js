import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory('vue-router'),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/contacts/:contactId',
      name: 'contact',
      component: () => import('../views/ContactView.vue')
    }
  ]
})

export default router

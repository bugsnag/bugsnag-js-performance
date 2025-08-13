import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import App from './App.vue'
import BugsnagPerformance from '@bugsnag/browser-performance'
import { VueRouterRoutingProvider } from '@bugsnag/vue-router-performance'

const parameters = new URLSearchParams(window.location.search)
const apiKey = parameters.get('api_key')
const endpoint = parameters.get('endpoint')

const base = '/docs/vue-router'

/** @typedef {import('vue-router').Router} Router */
const router = createRouter({
  history: createWebHistory(base),
  routes: [
    {
      path: '/',
      name: 'home',
      meta: { title: 'Home' },
      component: HomeView
    },
    {
      path: '/contacts/:contactId()',
      name: 'contact',
      meta: { title: (route) => `Contact ${route.params.contactId}` },
      component: () => import('./views/ContactView.vue'),
      children: [
        {
          path: 'profile',
          name: 'profile', 
          meta: { title: 'Contact Profile' },
          component: () => import('./views/ContactProfile.vue')
        }
      ]
    }
  ]
})

router.beforeEach((to, from, next) => {
  const title = typeof to.meta.title === 'function' 
    ? to.meta.title(to) 
    : to.meta.title
  document.title = title || 'Default Title'
  next()
})

BugsnagPerformance.start({
    apiKey,
    endpoint,
    maximumBatchSize: 2,
    batchInactivityTimeoutMs: 5000,
    autoInstrumentFullPageLoads: false,
    autoInstrumentNetworkRequests: false,
    routingProvider: new VueRouterRoutingProvider(router, base)
})

const app = createApp(App)

app.use(router)

app.mount('#app')

# `@bugsnag/vue-router-performance`

> A vue router integration for BugSnag performance

## Usage

```
import BugsnagPerformance from '@bugsnag/browser-performance'
import { VueRouterRoutingProvider } from '@bugsnag/vue-router-performance'
import { createRouter, createWebHistory } from 'vue-router'

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

const basename = '/vue-router'

BugsnagPerformance.start({
  apiKey,
  routingProvider: new VueRouterRoutingProvider(router, basename)
})

const app = createApp(App)

app.use(router)

app.mount('#app')
```

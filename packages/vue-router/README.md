# `@bugsnag/vue-router-performance`

> A vue router integration for BugSnag performance

## Usage

```
import BugsnagPerformance from '@bugsnag/browser-performance'
import { VueRouterRoutingProvider } from '@bugsnag/vue-router-performance'
import { createRouter, createWebHistory } from 'vue-router'

const base = 'my-app

const router = createRouter({
  history: createWebHistory(base),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/contacts/:contactId',
      name: 'contact',
      component: () => import('./views/ContactView.vue')
    }
  ]
})


BugsnagPerformance.start({
  apiKey,
  routingProvider: new VueRouterRoutingProvider(router, base)
})

const app = createApp(App)

app.use(router)

app.mount('#app')
```

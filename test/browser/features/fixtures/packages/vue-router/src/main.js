import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import BugsnagPerformance from '@bugsnag/browser-performance'
import { VueRouterRoutingProvider } from '@bugsnag/vue-router-performance'

const parameters = new URLSearchParams(window.location.search)
const apiKey = parameters.get('api_key')
const endpoint = parameters.get('endpoint')

const basename = '/vue-router'

BugsnagPerformance.start({
    apiKey,
    endpoint,
    maximumBatchSize: 13,
    batchInactivityTimeoutMs: 5000,
    autoInstrumentNetworkRequests: false,
    routingProvider: new VueRouterRoutingProvider(router, basename)
})

const app = createApp(App)

app.use(router)

app.mount('#app')

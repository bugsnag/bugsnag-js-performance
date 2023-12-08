import { createClient } from '@bugsnag/core-performance'
import createFetchDeliveryFactory from '@bugsnag/delivery-fetch-performance'
import { createXmlHttpRequestTracker } from '@bugsnag/request-tracker-performance'
import { AppRegistry, AppState } from 'react-native'
import { FileSystem } from 'react-native-file-access'
import { AppStartPlugin, NetworkRequestPlugin } from './auto-instrumentation'
import createClock from './clock'
import createSchema from './config'
import createIdGenerator from './id-generator'
import NativeBugsnagPerformance from './native'
import persistenceFactory from './persistence'
import { platformExtensions } from './platform-extensions'
import resourceAttributesSourceFactory from './resource-attributes-source'
import createRetryQueueFactory from './retry-queue'
import { createSpanAttributesSource } from './span-attributes-source'
import createBrowserBackgroundingListener from './backgrounding-listener'

const clock = createClock(performance)
const appStartTime = clock.now()
const deliveryFactory = createFetchDeliveryFactory(fetch, clock)
const spanAttributesSource = createSpanAttributesSource(AppState)
const deviceInfo = NativeBugsnagPerformance ? NativeBugsnagPerformance.getDeviceInfo() : undefined
const persistence = persistenceFactory(FileSystem, deviceInfo)
const resourceAttributesSource = resourceAttributesSourceFactory(persistence, deviceInfo)
const backgroundingListener = createBrowserBackgroundingListener(AppState)

// React Native's fetch polyfill uses xhr under the hood, so we only track xhr requests
const xhrRequestTracker = createXmlHttpRequestTracker(XMLHttpRequest, clock)

const idGenerator = createIdGenerator(NativeBugsnagPerformance)

const BugsnagPerformance = createClient({
  backgroundingListener,
  clock,
  deliveryFactory,
  idGenerator,
  persistence,
  plugins: (spanFactory, spanContextStorage) => [
    new AppStartPlugin(appStartTime, spanFactory, clock, AppRegistry),
    new NetworkRequestPlugin(spanFactory, xhrRequestTracker)
  ],
  resourceAttributesSource,
  schema: createSchema(),
  spanAttributesSource,
  retryQueueFactory: createRetryQueueFactory(FileSystem),
  platformExtensions
})

export default BugsnagPerformance

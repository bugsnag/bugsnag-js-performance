import { InMemoryQueue, createClient } from '@bugsnag/core-performance'
import createFetchDeliveryFactory from '@bugsnag/delivery-fetch-performance'
import { NetworkRequestPlugin, createXmlHttpRequestTracker } from '@bugsnag/request-tracker-performance'
import { AppRegistry, AppState } from 'react-native'
import { AppStartPlugin } from './auto-instrumentation/app-start-plugin'
import createClock from './clock'
import createSchema from './config'
import idGenerator from './id-generator'
import persistenceFactory from './persistence'
import { platformExtensions } from './platform-extensions'
import resourceAttributesSourceFactory from './resource-attributes-source'
import { createSpanAttributesSource } from './span-attributes-source'

import { FileSystem } from 'react-native-file-access'

const clock = createClock(performance)
const appStartTime = clock.now()
const deliveryFactory = createFetchDeliveryFactory(fetch, clock)
const spanAttributesSource = createSpanAttributesSource(AppState)
const persistence = persistenceFactory(FileSystem)
const resourceAttributesSource = resourceAttributesSourceFactory(persistence)

// React Native's fetch polyfill uses xhr under the hood, so we only track xhr requests
const xhrRequestTracker = createXmlHttpRequestTracker({ XMLHttpRequest }, clock)

const BugsnagPerformance = createClient({
  backgroundingListener: { onStateChange: () => {} },
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
  retryQueueFactory: (delivery, retryQueueMaxSize) => new InMemoryQueue(delivery, retryQueueMaxSize),
  platformExtensions
})

export default BugsnagPerformance

import { createClient } from '@bugsnag/core-performance'
import createFetchDeliveryFactory from '@bugsnag/delivery-fetch-performance'
import { createXmlHttpRequestTracker } from '@bugsnag/request-tracker-performance'
import { AppRegistry, AppState } from 'react-native'
import { FileSystem } from './persistence/file-native'
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
import { ReactNativeSpanFactory } from './span-factory'

// this is how some internal react native code detects whether the app is running
// in the remote debugger:
// https://github.com/facebook/react-native/blob/e320ab47cf855f2e5de74ea448ec292cf0bbb29a/packages/react-native/Libraries/Utilities/DebugEnvironment.js#L15
// there's no public api for this so we use the same approach

// @ts-expect-error Element implicitly has an 'any' type because type 'typeof globalThis' has no index signature.
const isDebuggingRemotely = !global.nativeCallSyncHook && !global.RN$Bridgeless

const clock = createClock(performance)
const appStartTime = clock.now()
const deliveryFactory = createFetchDeliveryFactory(fetch, clock)
const spanAttributesSource = createSpanAttributesSource()
const deviceInfo = !isDebuggingRemotely ? NativeBugsnagPerformance.getDeviceInfo() : undefined
const persistence = persistenceFactory(FileSystem, deviceInfo)
const resourceAttributesSource = resourceAttributesSourceFactory(persistence, deviceInfo)
const backgroundingListener = createBrowserBackgroundingListener(AppState)

// React Native's fetch polyfill uses xhr under the hood, so we only track xhr requests
const xhrRequestTracker = createXmlHttpRequestTracker(XMLHttpRequest, clock)

const idGenerator = createIdGenerator(isDebuggingRemotely)
const BugsnagPerformance = createClient({
  backgroundingListener,
  clock,
  deliveryFactory,
  idGenerator,
  persistence,
  plugins: (spanFactory, spanContextStorage, setAppState, appState) => [
    new AppStartPlugin(appStartTime, spanFactory as ReactNativeSpanFactory, clock, AppRegistry, setAppState, appState),
    new NetworkRequestPlugin(spanFactory, spanContextStorage, xhrRequestTracker)
  ],
  resourceAttributesSource,
  schema: createSchema(),
  spanAttributesSource,
  retryQueueFactory: createRetryQueueFactory(FileSystem),
  spanFactory: ReactNativeSpanFactory,
  platformExtensions: (spanFactory, spanContextStorage) => platformExtensions(appStartTime, clock, spanFactory as ReactNativeSpanFactory, spanContextStorage)
})

export default BugsnagPerformance

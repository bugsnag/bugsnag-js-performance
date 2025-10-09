import { createClient } from '@bugsnag/core-performance'
import type { ClientOptions, Clock, SpanContextStorage, Plugin } from '@bugsnag/core-performance'
import createFetchDeliveryFactory from '@bugsnag/delivery-fetch-performance'
import { createXmlHttpRequestTracker } from '@bugsnag/request-tracker-performance'
import { AppRegistry, AppState } from 'react-native'
import { FileSystem } from './persistence/file-native'
import { AppStartPlugin, NetworkRequestPlugin } from './auto-instrumentation'
import createClock from './clock'
import { createSchema } from './config'
import type { ReactNativeConfiguration, ReactNativeSchema } from './config'
import createIdGenerator from './id-generator'
import NativeBugsnagPerformance from './native'
import persistenceFactory from './persistence'
import { createDefaultPlatformExtensions } from './platform-extensions'
import type { PlatformExtensions } from './platform-extensions'
import resourceAttributesSourceFactory from './resource-attributes-source'
import createRetryQueueFactory from './retry-queue'
import { createSpanAttributesSource } from './span-attributes-source'
import createBrowserBackgroundingListener from './backgrounding-listener'
import { ReactNativeSpanFactory } from './span-factory'

// Options type for createReactNativeClient allowing additional plugins and customized platform extensions
export interface ReactNativeClientOptions<S extends ReactNativeSchema, C extends ReactNativeConfiguration, T> extends Partial<Omit<ClientOptions<S, C, T>, 'platformExtensions'>> {
  createPlatformExtensions?: (appStartTime: number, clock: Clock, spanFactory: ReactNativeSpanFactory<C>, spanContextStorage: SpanContextStorage) => T
}

export function createReactNativeClient<S extends ReactNativeSchema = ReactNativeSchema, C extends ReactNativeConfiguration = ReactNativeConfiguration, T = PlatformExtensions> (
  options?: ReactNativeClientOptions<S, C, T>
) {
  // this is how some internal react native code detects whether the app is running
  // in the remote debugger:
  // https://github.com/facebook/react-native/blob/e320ab47cf855f2e5de74ea448ec292cf0bbb29a/packages/react-native/Libraries/Utilities/DebugEnvironment.js#L15
  // there's no public api for this so we use the same approach
  // @ts-expect-error Element implicitly has an 'any' type because type 'typeof globalThis' has no index signature.
  const isDebuggingRemotely = !global.nativeCallSyncHook && !global.RN$Bridgeless

  const clock = options?.clock || createClock(performance)
  const appStartTime = clock.now()
  const isDevelopment = options?.isDevelopment || __DEV__
  const schema = options?.schema || createSchema(isDevelopment) as S

  const deliveryFactory = options?.deliveryFactory || createFetchDeliveryFactory(fetch, clock)
  const spanAttributesSource = options?.spanAttributesSource || createSpanAttributesSource()
  const deviceInfo = !isDebuggingRemotely ? NativeBugsnagPerformance.getDeviceInfo() : undefined
  const persistence = options?.persistence || persistenceFactory(FileSystem, deviceInfo)
  const resourceAttributesSource = options?.resourceAttributesSource || resourceAttributesSourceFactory(persistence, deviceInfo)
  const backgroundingListener = options?.backgroundingListener || createBrowserBackgroundingListener(AppState)
  const createPlatformExtensions = options?.createPlatformExtensions || createDefaultPlatformExtensions
  const idGenerator = options?.idGenerator || createIdGenerator(isDebuggingRemotely)
  const spanFactory = options?.spanFactory || ReactNativeSpanFactory

  const createPlugins = (appStartTime: number, clock: Clock, spanFactory: ReactNativeSpanFactory<C>, spanContextStorage: SpanContextStorage) => {
    // React Native's fetch polyfill uses xhr under the hood, so we only track xhr requests
    const xhrRequestTracker = createXmlHttpRequestTracker(XMLHttpRequest, clock)

    // default plugins for React Native clients
    const plugins: Array<Plugin<C>> = [
      new AppStartPlugin(appStartTime, spanFactory, clock, AppRegistry),
      new NetworkRequestPlugin(spanFactory, spanContextStorage, xhrRequestTracker)
    ]

    // optional additional plugins
    if (options?.plugins) {
      plugins.push(...options.plugins(spanFactory, spanContextStorage))
    }

    return plugins
  }

  return createClient<S, C, T>({
    isDevelopment,
    backgroundingListener,
    clock,
    deliveryFactory,
    idGenerator,
    persistence,
    plugins: (spanFactory, spanContextStorage) => createPlugins(appStartTime, clock, spanFactory as ReactNativeSpanFactory<C>, spanContextStorage),
    resourceAttributesSource,
    schema,
    spanAttributesSource,
    retryQueueFactory: createRetryQueueFactory(FileSystem),
    spanFactory,
    platformExtensions: (spanFactory, spanContextStorage) => createPlatformExtensions(
      appStartTime,
      clock,
      spanFactory as ReactNativeSpanFactory<C>,
      spanContextStorage
    ) as T
  })
}

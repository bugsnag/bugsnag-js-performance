import { InMemoryPersistence, createClient, type SpanOptions, validateSpanOptions, coreSpanOptionSchema, type SpanFactory, type SpanContextStorage, type Logger } from '@bugsnag/core-performance'
import createFetchDeliveryFactory from '@bugsnag/delivery-fetch-performance'
import createClock from './clock'
import createSchema, { type ReactNativeConfiguration } from './config'
import idGenerator from './id-generator'
import resourceAttributesSource from './resource-attributes-source'
import spanAttributesSource from './span-attributes-source'
import { AppStartPlugin } from './auto-instrumentation/app-start-plugin'
import { AppRegistry } from 'react-native'

const clock = createClock(performance)
const appStartTime = clock.now()
const deliveryFactory = createFetchDeliveryFactory(fetch, clock)

export const platformExtensions = (spanFactory: SpanFactory<ReactNativeConfiguration>, spanContextStorage: SpanContextStorage, getLogger: () => Logger) => ({
  startViewLoadSpan: (name: string, spanOptions?: SpanOptions) => {
    const cleanOptions = validateSpanOptions(name, spanOptions, coreSpanOptionSchema, getLogger())
    const span = spanFactory.startSpan(cleanOptions.name, cleanOptions.options)
    span.setAttribute('bugsnag.span.category', 'view_load')
    span.setAttribute('bugsnag.span.type', 'navigation')
    return spanFactory.toPublicApi(span)
  }
})

const BugsnagPerformance = createClient({
  backgroundingListener: { onStateChange: () => {} },
  clock,
  deliveryFactory,
  idGenerator,
  persistence: new InMemoryPersistence(),
  plugins: (spanFactory, spanContextStorage) => [new AppStartPlugin(appStartTime, spanFactory, clock, AppRegistry)],
  resourceAttributesSource,
  schema: createSchema(),
  spanAttributesSource,
  platformExtensions
})

export default BugsnagPerformance

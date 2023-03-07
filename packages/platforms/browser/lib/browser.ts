import { createClient } from '@bugsnag/js-performance-core'
import { BrowserProcessorFactory } from './BrowserProcessor'
import createClock from './clock'
import idGenerator from './id-generator'
import createResourceAttributesSource from './resource-attributes-source'
import spanAttributesSource from './span-attributes-source'

const clock = createClock(performance)

const BugsnagPerformance = createClient({
  clock,
  resourceAttributesSource: createResourceAttributesSource(navigator),
  spanAttributesSource,
  idGenerator,
  processorFactory: new BrowserProcessorFactory(window.fetch, navigator, clock)
})

export default BugsnagPerformance

import { createClient } from '@bugsnag/js-performance-core'
import { BrowserProcessorFactory } from './BrowserProcessor'
import createClock from './clock'
import idGenerator from './id-generator'
import createResourceAttributesSource from './resource-attributes-source'
import spanAttributesSource from './span-attributes-source'

const clock = createClock(performance)
const resourceAttributesSource = createResourceAttributesSource(navigator)

const BugsnagPerformance = createClient({
  clock,
  resourceAttributesSource,
  spanAttributesSource,
  idGenerator,
  processorFactory: new BrowserProcessorFactory(window.fetch, resourceAttributesSource, clock)
})

export default BugsnagPerformance

import { createClient } from '@bugsnag/js-performance-core'
import { BrowserProcessorFactory } from './BrowserProcessor'
import clock from './clock'
import idGenerator from './id-generator'
import createResourceAttributesSource from './resource-attributes-source'
import spanAttributesSource from './span-attributes-source'

const BugsnagPerformance = createClient({
  clock,
  resourceAttributesSource: createResourceAttributesSource(navigator),
  spanAttributesSource,
  idGenerator,
  processorFactory: new BrowserProcessorFactory(window.fetch, navigator)
})

export default BugsnagPerformance

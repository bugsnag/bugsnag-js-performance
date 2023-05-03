import { Sampler, SpanFactory } from '@bugsnag/js-performance-core'
import InMemoryProcessor from './in-memory-processor'
import spanAttributesSource from './span-attributes-source'
import StableIdGenerator from './stable-id-generator'

const sampler = new Sampler(0.5)

export const spanFactory = new SpanFactory(new InMemoryProcessor(), sampler, new StableIdGenerator(), spanAttributesSource)

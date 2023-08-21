import { type SpanAttributesSource } from '@bugsnag/core-performance'
import { type ReactNativeConfiguration } from './config'

export const spanAttributesSource: SpanAttributesSource<ReactNativeConfiguration> = {
  configure (configuration) {},
  requestAttributes (span) {}
}

export default spanAttributesSource

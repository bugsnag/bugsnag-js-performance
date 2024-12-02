/* eslint-disable @typescript-eslint/no-var-requires */

import { MockSpanFactory } from '@bugsnag/js-performance-test-utilities'
import type { ReactNativeConfiguration } from '../lib/config'
import type { SpanFactory, SpanInternal } from '@bugsnag/core-performance'

let createAppStartSpan: (spanFactory: SpanFactory<ReactNativeConfiguration>, appStartTime: number) => SpanInternal
let spanFactory: SpanFactory<ReactNativeConfiguration>

describe('createAppStartSpan', () => {
  beforeEach(() => {
    jest.isolateModules(() => {
      spanFactory = new MockSpanFactory()
      createAppStartSpan = require('../lib/create-app-start-span').createAppStartSpan
    })
  })

  it('creates an app start span with the supplied start time', () => {
    const appStartSpan = createAppStartSpan(spanFactory, 12345)
    const appStartSpanEnded = appStartSpan.end(12345, spanFactory.sampler.spanProbability)

    expect(appStartSpanEnded.name).toBe('[AppStart/ReactNativeInit]')
    expect(appStartSpanEnded.startTime).toBe(12345)
  })

  it('sets the parent context to null', () => {
    spanFactory.startSpan('should not become parent', { startTime: 12345 })

    const appStartSpan = createAppStartSpan(spanFactory, 12345)
    const appStartSpanEnded = appStartSpan.end(54321, spanFactory.sampler.spanProbability)

    expect(appStartSpanEnded.parentSpanId).toBeUndefined()
  })

  it('sets the required attributes', () => {
    const appStartSpan = createAppStartSpan(spanFactory, 12345)
    const appStartSpanEnded = appStartSpan.end(12345, spanFactory.sampler.spanProbability)

    expect(appStartSpanEnded.attributes.toJson()).toStrictEqual([
      { key: 'bugsnag.span.category', value: { stringValue: 'app_start' } },
      { key: 'bugsnag.app_start.type', value: { stringValue: 'ReactNativeInit' } },
      { key: 'bugsnag.sampling.p', value: { doubleValue: 1 } }
    ])
  })

  it('prevents multiple app start spans from being created', () => {
    const appStartSpan1 = createAppStartSpan(spanFactory, 12345)

    expect(spanFactory.startSpan).toHaveBeenCalledTimes(1)

    const appStartSpan2 = createAppStartSpan(spanFactory, 12345)

    expect(spanFactory.startSpan).toHaveBeenCalledTimes(1)
    expect(appStartSpan1).toBe(appStartSpan2)
  })
})

import { MockSpanFactory } from '@bugsnag/js-performance-test-utilities'
import { createNavigationSpan } from '../lib/create-navigation-span'
import type { ReactNativeSpanFactory } from '../lib/span-factory'

describe('createNavigationSpan', () => {
  it('sets the span name to the route prefixed with [Navigation]', () => {
    const spanFactory = new MockSpanFactory()
    const span = createNavigationSpan(spanFactory as unknown as ReactNativeSpanFactory, 'testRoute', { isFirstClass: false })
    const endedSpan = span.end(12345, spanFactory.sampler.spanProbability)

    expect(endedSpan.name).toBe('[Navigation]testRoute')
  })

  it('always sets the span as first class', () => {
    const spanFactory = new MockSpanFactory()
    const span = createNavigationSpan(spanFactory as unknown as ReactNativeSpanFactory, 'testRoute', { isFirstClass: false })
    const endedSpan = span.end(12345, spanFactory.sampler.spanProbability)

    expect(endedSpan.attributes.toJson()).toContainEqual({ key: 'bugsnag.span.first_class', value: { boolValue: true } })
  })

  it('includes navigation category attribute', () => {
    const spanFactory = new MockSpanFactory()
    const span = createNavigationSpan(spanFactory as unknown as ReactNativeSpanFactory, 'testRoute', { isFirstClass: true })
    const endedSpan = span.end(12345, spanFactory.sampler.spanProbability)

    expect(endedSpan.attributes.toJson()).toContainEqual({ key: 'bugsnag.span.category', value: { stringValue: 'navigation' } })
  })

  it('includes the route attribute', () => {
    const spanFactory = new MockSpanFactory()
    const span = createNavigationSpan(spanFactory as unknown as ReactNativeSpanFactory, 'testRoute', { isFirstClass: true })
    const endedSpan = span.end(12345, spanFactory.sampler.spanProbability)

    expect(endedSpan.attributes.toJson()).toContainEqual({ key: 'bugsnag.navigation.route', value: { stringValue: 'testRoute' } })
  })
})

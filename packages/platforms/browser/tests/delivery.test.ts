/**
 * @jest-environment jsdom
 */

import { SpanAttributes, type SpanInternal } from '@bugsnag/js-performance-core/lib/span'
import createDelivery from '../lib/delivery'
import createResourseAttributesSource from '../lib/resource-attributes-source'
import createSpanAttributesSource from '../lib/span-attributes-source'

// @ts-expect-error mock not assignable to global.fetch
global.fetch = jest.fn(() =>
  Promise.resolve()
)

beforeEach(() => {
  // @ts-expect-error property mockClear does not exist on fetch
  fetch.mockClear()
})

describe('delivery', () => {
  it('delivers a span', () => {
    const resourceAttributesSource = createResourseAttributesSource(navigator)
    const spanAttributesSource = createSpanAttributesSource()
    const spanAttributes = new SpanAttributes(spanAttributesSource)
    const spans: SpanInternal[] = [{
      id: 'unique-span-id',
      kind: 'internal',
      name: 'test span',
      startTime: 12345,
      traceId: 'trace-span-id',
      endTime: 56789,
      attributes: spanAttributes
    }]

    const delivery = createDelivery(global.fetch)
    delivery.send('/test', 'test-api-key', spans, resourceAttributesSource())

    expect(global.fetch).toHaveBeenCalledWith('/test', expect.objectContaining({ body: expect.stringContaining('test span') }))
  })
})

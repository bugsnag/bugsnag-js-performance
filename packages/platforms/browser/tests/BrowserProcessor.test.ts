/**
 * @jest-environment jsdom
 */

import { SpanAttributes, type SpanEnded } from '@bugsnag/js-performance-core/lib/span'
import { BrowserProcessor, BrowserProcessorFactory } from '../lib/BrowserProcessor'
import resourceAttributesSource from '../lib/resource-attributes-source'

describe('BrowserProcessorFactory', () => {
  it('returns an instance of BrowserProcessor', () => {
    const processor = new BrowserProcessorFactory().create({ apiKey: 'test-api-key' })
    expect(processor).toBeInstanceOf(BrowserProcessor)
  })
})

describe('BrowserProcessor', () => {
  it('correctly formats the delivery payload', () => {
    const span: SpanEnded = {
      id: 'test-span-id',
      kind: 'internal',
      name: 'test-span',
      startTime: 12345,
      endTime: 56789,
      traceId: 'trace-id',
      attributes: new SpanAttributes(new Map())
    }

    const mockDelivery = { send: jest.fn() }
    const mockClock = { now: jest.now, convert: jest.fn(), toAbsoluteTimeStamp: jest.fn() }
    const processor = new BrowserProcessor('test-api-key', '/traces', mockDelivery, mockClock, resourceAttributesSource(navigator))
    processor.add(span)

    expect(mockDelivery.send).toHaveBeenCalledWith(
      '/traces', // Endpoint
      'test-api-key', // API Key
      expect.objectContaining({
        resourceSpans: expect.arrayContaining([
          expect.objectContaining({
            resource: expect.objectContaining({
              attributes: expect.any(Array)
            }),
            scopeSpans: expect.arrayContaining([
              expect.objectContaining({
                spans: expect.any(Array)
              })
            ])
          })
        ])
      })
    )
  })
})

/**
 * @jest-environment jsdom
 */

import { SpanAttributes, type SpanInternal } from '@bugsnag/js-performance-core/lib/span'
import createProcessor from '../lib/processor'
import resourceAttributesSource from '../lib/resource-attributes-source'

const testLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}

describe('Browser Processor', () => {
  it('prevents delivery until configure has been called', () => {
    const span: SpanInternal = {
      id: 'test-span-id',
      kind: 'consumer',
      name: 'test-span',
      startTime: 12345,
      endTime: 56789,
      traceId: 'trace-id',
      attributes: new SpanAttributes(new Map())
    }

    const mockDelivery = { send: jest.fn() }
    const processor = createProcessor(mockDelivery)
    processor.add(span)

    expect(mockDelivery.send).not.toHaveBeenCalled()
  })

  it('accepts a valid configuration', () => {
    const mockDelivery = { send: jest.fn() }
    const processor = createProcessor(mockDelivery)

    // TODO: How to make this assertion more useful?
    expect(() => {
      processor.configure({
        apiKey: 'test-api-key',
        endpoint: '/traces',
        releaseStage: 'test',
        logger: testLogger
      }, resourceAttributesSource(navigator))
    }).not.toThrow()
  })

  it('correctly formats the delivery payload', () => {
    const span: SpanInternal = {
      id: 'test-span-id',
      kind: 'internal',
      name: 'test-span',
      startTime: 12345,
      endTime: 56789,
      traceId: 'trace-id',
      attributes: new SpanAttributes(new Map())
    }

    const mockDelivery = { send: jest.fn() }
    const processor = createProcessor(mockDelivery)
    processor.configure({
      apiKey: 'test-api-key',
      endpoint: '/traces',
      releaseStage: 'test',
      logger: testLogger
    }, resourceAttributesSource(navigator))
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

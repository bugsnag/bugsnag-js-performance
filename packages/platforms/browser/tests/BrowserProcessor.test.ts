/**
 * @jest-environment jsdom
 */

import { Kind, SpanAttributes, type SpanEnded } from '@bugsnag/js-performance-core'
import { BrowserProcessor, BrowserProcessorFactory } from '../lib/BrowserProcessor'
import resourceAttributesSource from '../lib/resource-attributes-source'

describe('BrowserProcessorFactory', () => {
  it('returns an instance of BrowserProcessor', () => {
    const fetch = jest.fn(() => Promise.resolve({} as unknown as Response))
    const logger = { warn: jest.fn(), debug: jest.fn(), error: jest.fn(), info: jest.fn() }
    const clock = { now: jest.now, convert: () => 20_000, toUnixTimestampNanoseconds: () => '50000' }

    const factory = new BrowserProcessorFactory(fetch, navigator, clock)

    const processor = factory.create({
      apiKey: 'test-api-key',
      endpoint: '/traces',
      releaseStage: 'test',
      logger
    })

    expect(processor).toBeInstanceOf(BrowserProcessor)
  })
})

describe('BrowserProcessor', () => {
  it('correctly formats the delivery payload', () => {
    const span: SpanEnded = {
      id: 'test-span-id',
      kind: Kind.Internal,
      name: 'test-span',
      startTime: 12345,
      endTime: 56789,
      traceId: 'trace-id',
      attributes: new SpanAttributes(new Map())
    }

    const mockDelivery = { send: jest.fn() }
    const mockClock = { now: jest.now, convert: () => 20_000, toUnixTimestampNanoseconds: () => '50000' }
    const processor = new BrowserProcessor('test-api-key', '/traces', mockDelivery, mockClock, resourceAttributesSource(navigator))
    processor.add(span)

    expect(mockDelivery.send).toHaveBeenCalledWith(
      '/traces', // Endpoint
      'test-api-key', // API Key
      {
        resourceSpans: [{
          resource: {
            attributes: [
              { key: 'releaseStage', value: { stringValue: 'production' } },
              { key: 'sdkName', value: { stringValue: 'bugsnag.performance.browser' } },
              { key: 'sdkVersion', value: { stringValue: '__VERSION__' } },
              { key: 'userAgent', value: { stringValue: expect.stringMatching(/\((?<info>.*?)\)(\s|$)|(?<name>.*?)\/(?<version>.*?)(\s|$)/gm) } }
            ]
          },
          scopeSpans: [{
            spans: [{
              attributes: [],
              endTimeUnixNano: '50000',
              kind: 1,
              name: 'test-span',
              spanId: 'test-span-id',
              startTimeUnixNano: '50000',
              traceId: 'trace-id'
            }]
          }]
        }]
      }
    )
  })
})

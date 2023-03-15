/**
 * @jest-environment jsdom
 */

import { Kind, SpanAttributes, type SpanEnded } from '@bugsnag/js-performance-core'
import { BrowserProcessor, BrowserProcessorFactory } from '../lib/BrowserProcessor'
import createResourceAttributesSource from '../lib/resource-attributes-source'
import { createConfiguration } from './utilities'

describe('BrowserProcessorFactory', () => {
  it('returns an instance of BrowserProcessor', () => {
    const fetch = jest.fn(() => Promise.resolve({} as unknown as Response))
    const resourceAttributesSource = createResourceAttributesSource(window.navigator)
    const clock = { now: jest.now, convert: () => 20_000, toUnixTimestampNanoseconds: () => '50000' }

    const factory = new BrowserProcessorFactory(fetch, resourceAttributesSource, clock)
    const processor = factory.create(createConfiguration())

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
    const processor = new BrowserProcessor(
      createConfiguration({ apiKey: 'test-api-key' }),
      mockDelivery,
      { now: jest.now, convert: () => 20_000, toUnixTimestampNanoseconds: () => '50000' },
      createResourceAttributesSource(navigator)
    )

    processor.add(span)

    expect(mockDelivery.send).toHaveBeenCalledWith(
      '/traces', // Endpoint
      'test-api-key', // API Key
      {
        resourceSpans: [{
          resource: {
            attributes: [
              { key: 'deployment.environment', value: { stringValue: 'production' } },
              { key: 'telemetry.sdk.name', value: { stringValue: 'bugsnag.performance.browser' } },
              { key: 'telemetry.sdk.version', value: { stringValue: '__VERSION__' } },
              { key: 'browser.user_agent', value: { stringValue: expect.stringMatching(/\((?<info>.*?)\)(\s|$)|(?<name>.*?)\/(?<version>.*?)(\s|$)/gm) } }
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

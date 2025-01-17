import {
  ControllableBackgroundingListener,
  InMemoryDelivery,
  VALID_API_KEY,
  createTestClient
} from '@bugsnag/js-performance-test-utilities'
import type { BackgroundingListener } from '../lib/backgrounding-listener'
import { createNoopClient } from '../lib/core'
import { DefaultSpanContextStorage } from '../lib/span-context'
import { InMemoryPersistence } from '../lib/persistence'

jest.useFakeTimers()

describe('Core', () => {
  describe('createClient()', () => {
    it('returns a BugsnagPerformance client', () => {
      const client = createTestClient()

      expect(client).toStrictEqual({
        start: expect.any(Function),
        startSpan: expect.any(Function),
        startNetworkSpan: expect.any(Function),
        currentSpanContext: undefined,
        getPlugin: expect.any(Function)
      })
    })

    describe('BugsnagPerformance', () => {
      describe('start()', () => {
        beforeEach(() => {
          jest.restoreAllMocks()
          jest.spyOn(console, 'debug')
          jest.spyOn(console, 'info')
          jest.spyOn(console, 'warn')
          jest.spyOn(console, 'error')
        })

        it('accepts a string', () => {
          const client = createTestClient()

          client.start(VALID_API_KEY)

          expect(console.warn).not.toHaveBeenCalled()
        })

        it('accepts a minimal valid configuration object', () => {
          const client = createTestClient()

          client.start({ apiKey: VALID_API_KEY })

          expect(console.warn).not.toHaveBeenCalled()
        })

        it('accepts a complete configuration object', () => {
          const client = createTestClient()

          const logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
          }

          client.start({
            apiKey: VALID_API_KEY,
            endpoint: '/test',
            releaseStage: 'test',
            logger
          })

          expect(console.warn).not.toHaveBeenCalled()
          expect(logger.warn).not.toHaveBeenCalled()
        })

        const invalidParameters = [
          { type: 'bigint', value: BigInt(9007199254740991) },
          { type: 'boolean', value: true },
          { type: 'function', value: () => {} },
          { type: 'number', value: 12345 },
          { type: 'object', value: { property: 'test' } },
          { type: 'object', value: [] },
          { type: 'symbol', value: Symbol('test') }
        ]

        it.each(invalidParameters)('warns if config.endpoint is invalid ($type)', ({ value, type }) => {
          jest.spyOn(console, 'warn').mockImplementation()

          const client = createTestClient()

          // @ts-expect-error endpoint should be a string
          client.start({ apiKey: VALID_API_KEY, endpoint: value })
          expect(console.warn).toHaveBeenCalledWith(`Invalid configuration\n  - endpoint should be a string, got ${type}`)
        })

        it.each([...invalidParameters, { type: 'string', value: '' }])('warns if config.releaseStage is invalid ($type)', ({ value, type }) => {
          jest.spyOn(console, 'warn').mockImplementation()

          const client = createTestClient()

          // @ts-expect-error releaseStage should be a string
          client.start({ apiKey: VALID_API_KEY, releaseStage: value })
          expect(console.warn).toHaveBeenCalledWith(`Invalid configuration\n  - releaseStage should be a string, got ${type}`)
        })

        it.each(invalidParameters)('warns if config.logger is invalid ($type)', ({ value, type }) => {
          jest.spyOn(console, 'warn').mockImplementation()

          const client = createTestClient()

          // @ts-expect-error logger should be a logger object
          client.start({ apiKey: VALID_API_KEY, logger: value })
          expect(console.warn).toHaveBeenCalledWith(`Invalid configuration\n  - logger should be a Logger object, got ${type}`)
        })

        it.each(invalidParameters)('uses config.logger if it is valid', ({ value, type }) => {
          const client = createTestClient()

          const logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
          }

          // @ts-expect-error logger should be a logger object
          client.start({ apiKey: VALID_API_KEY, logger, endpoint: value, releaseStage: value })

          expect(console.warn).not.toHaveBeenCalled()
          expect(logger.warn).toHaveBeenCalledWith(`Invalid configuration\n  - endpoint should be a string, got ${type}\n  - releaseStage should be a string, got ${type}`)
        })

        it('throws if no configuration is provided', () => {
          const client = createTestClient()

          // @ts-expect-error no configuration provided
          expect(() => { client.start() }).toThrow('No Bugsnag API Key set')
        })

        it('warns if the api key is not valid', () => {
          jest.spyOn(console, 'warn').mockImplementation()
          const client = createTestClient()
          client.start('NOT_VALID')

          expect(console.warn).toHaveBeenCalledWith('Invalid configuration\n  - apiKey should be a 32 character hexadecimal string, got string')
        })

        it('warns if the api key is not valid (config object)', () => {
          const client = createTestClient()
          const logger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
          }
          client.start({ apiKey: 'NOT_VALID', logger })

          expect(console.warn).not.toHaveBeenCalled()
          expect(logger.warn).toHaveBeenCalledWith('Invalid configuration\n  - apiKey should be a 32 character hexadecimal string, got string')
        })

        it.each([
          { type: 'a bigint', config: BigInt(9007199254740991) },
          { type: 'a function', config: () => {} },
          { type: 'a number', config: 12345 },
          { type: 'a date', config: new Date() },
          { type: 'boolean (true)', config: true },
          { type: 'boolean (false)', config: false },
          { type: 'null', config: null },
          { type: 'an invalid configuration object', config: { property: 'test' } },
          { type: 'an array', config: [] },
          { type: 'a symbol', config: Symbol('test') }
        ])('throws if provided configuration is $type', ({ config }) => {
          const client = createTestClient()

          // @ts-expect-error invalid configuration provided
          expect(() => { client.start(config) }).toThrow('No Bugsnag API Key set')
        })

        it('registers with the backgrounding listener', async () => {
          const backgroundingListener: BackgroundingListener = {
            onStateChange: jest.fn()
          }

          const client = createTestClient({ backgroundingListener })

          expect(backgroundingListener.onStateChange).toHaveBeenCalledTimes(2)

          client.start(VALID_API_KEY)
          await jest.runOnlyPendingTimersAsync()

          expect(backgroundingListener.onStateChange).toHaveBeenCalledTimes(3)
          expect(console.warn).not.toHaveBeenCalled()
        })

        it('flushes the processor when the app is backgrounded', async () => {
          const delivery = new InMemoryDelivery()
          const backgroundingListener = new ControllableBackgroundingListener()

          const client = createTestClient({ backgroundingListener, deliveryFactory: () => delivery })
          client.start(VALID_API_KEY)

          await jest.runOnlyPendingTimersAsync()

          client.startSpan('Span 1').end()
          client.startSpan('Span 2').end()

          expect(delivery.requests).toHaveLength(0)

          // sending the app to the background should flush the queue and
          // deliver both spans we just ended
          backgroundingListener.sendToBackground()

          await jest.advanceTimersByTimeAsync(0)

          expect(delivery.requests).toHaveLength(1)

          const payload = delivery.requests[0]
          const spans = payload.resourceSpans[0].scopeSpans[0].spans

          expect(spans).toHaveLength(2)

          const names = spans.map(({ name }) => name)

          expect(names).toStrictEqual(['Span 1', 'Span 2'])
        })

        it('does not make an empty request when the app is backgrounded with no batched spans', () => {
          const delivery = new InMemoryDelivery()
          const backgroundingListener = new ControllableBackgroundingListener()

          const client = createTestClient({ backgroundingListener, deliveryFactory: () => delivery })
          client.start(VALID_API_KEY)

          expect(delivery.requests).toHaveLength(0)

          // sending the app to the background should flush the queue but there
          // are no spans to deliver so we shouldn't get any requests
          backgroundingListener.sendToBackground()

          expect(delivery.requests).toHaveLength(0)
        })

        it('makes a probability freshness check when the app is foregrounded', async () => {
          const delivery = new InMemoryDelivery()
          const backgroundingListener = new ControllableBackgroundingListener()
          const persistence = new InMemoryPersistence()
          await persistence.save('bugsnag-sampling-probability', {
            value: 0.25,
            time: Date.now() - 24 * 60 * 60 * 1000 + 1 // 23 hours 59 minutes & 59 seconds ago
          })

          const client = createTestClient({
            backgroundingListener,
            deliveryFactory: () => delivery,
            persistence
          })

          client.start(VALID_API_KEY)

          // a request shouldn't be made during 'start'
          await jest.runOnlyPendingTimersAsync()
          expect(delivery.samplingRequests).toHaveLength(0)

          await jest.advanceTimersByTimeAsync(1)

          // backgrounding should not kick off a freshness check
          backgroundingListener.sendToBackground()
          await jest.runOnlyPendingTimersAsync()
          expect(delivery.samplingRequests).toHaveLength(0)

          // returning to the foreground should kick off a freshness check
          backgroundingListener.sendToForeground()
          await jest.runOnlyPendingTimersAsync()
          expect(delivery.samplingRequests).toHaveLength(1)
        })

        it('immediately fetches probability if the persisted value is 24 hours old', async () => {
          const delivery = new InMemoryDelivery()
          const backgroundingListener = new ControllableBackgroundingListener()
          const persistence = new InMemoryPersistence()

          await persistence.save('bugsnag-sampling-probability', {
            value: 0.25,
            time: Date.now() - 24 * 60 * 60 * 1000 // 24 hours ago
          })

          const client = createTestClient({
            backgroundingListener,
            deliveryFactory: () => delivery,
            persistence
          })

          client.start({ apiKey: VALID_API_KEY, samplingProbability: undefined })

          // a request shouldn't be made during 'start'
          await jest.runOnlyPendingTimersAsync()
          expect(delivery.samplingRequests).toHaveLength(1)
        })

        describe('when the samplingProbability configuration option is defined', () => {
          it('does not fetch probability', async () => {
            const delivery = new InMemoryDelivery()
            const backgroundingListener = new ControllableBackgroundingListener()
            const persistence = new InMemoryPersistence()

            // this would cause an immediate fetch if ProbabilityManager was being used internally rather than FixedProbabilityManager
            await persistence.save('bugsnag-sampling-probability', {
              value: 0.25,
              time: Date.now() - 24 * 60 * 60 * 1000 // 24 hours ago
            })

            const client = createTestClient({
              backgroundingListener,
              deliveryFactory: () => delivery,
              persistence
            })

            client.start({ apiKey: VALID_API_KEY, samplingProbability: 0.9 })

            // a request shouldn't be made during 'start'
            await jest.runOnlyPendingTimersAsync()
            expect(delivery.samplingRequests).toHaveLength(0)

            client.startSpan('Span 1').end()

            await jest.runOnlyPendingTimersAsync()
            expect(delivery.requests).toHaveLength(1)

            const span = delivery.requests[0].resourceSpans[0].scopeSpans[0].spans[0]
            expect(span).toHaveAttribute('bugsnag.sampling.p', 0.9)
          })
        })

        describe('endpoint', () => {
          describe('when the endpoint is the default value', () => {
            it('modifies the endpoint to include the API key', async () => {
              const delivery = new InMemoryDelivery()
              const deliveryFactory = jest.fn(() => delivery)
              const client = createTestClient({ deliveryFactory })

              client.start(VALID_API_KEY)

              await jest.runOnlyPendingTimersAsync()

              expect(deliveryFactory).toHaveBeenCalledWith('https://a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6.otlp.bugsnag.com/v1/traces', false)
            })
          })

          describe('when the endpoint is not the default value', () => {
            it('does not modify the endpoint', async () => {
              const delivery = new InMemoryDelivery()
              const deliveryFactory = jest.fn(() => delivery)
              const client = createTestClient({ deliveryFactory })

              client.start({ apiKey: VALID_API_KEY, endpoint: 'https://my-custom-otel-repeater.com' })

              await jest.runOnlyPendingTimersAsync()

              expect(deliveryFactory).toHaveBeenCalledWith('https://my-custom-otel-repeater.com', false)
            })
          })
        })
      })

      describe('currentSpanContext', () => {
        it('returns the current span context', () => {
          const spanContextStorage = new DefaultSpanContextStorage(new ControllableBackgroundingListener())
          const client = createTestClient({ spanContextStorage })

          const spanContext = { id: '0123456789abcdef', traceId: '0123456789abcdeffedcba9876543210', isValid: () => true, samplingRate: 0.1 }
          spanContextStorage.push(spanContext)
          expect(client.currentSpanContext).toBe(spanContext)
        })
      })

      describe('getPlugin()', () => {
        it('returns an instance of a plugin', () => {
          const listener = jest.fn()

          class TestPlugin {
            configure () {}

            test () {
              listener()
            }
          }

          const client = createTestClient()

          client.start({ apiKey: VALID_API_KEY, plugins: [new TestPlugin()] })

          const plugin = client.getPlugin(TestPlugin)

          expect(plugin).toBeInstanceOf(TestPlugin)

          expect(listener).not.toHaveBeenCalled()

          plugin?.test()

          expect(listener).toHaveBeenCalled()
        })

        it('does not return a plugin if it has not been provided', () => {
          class TestPlugin {
            configure () {}
          }

          class AnotherPlugin {
            configure () {}
          }

          const client = createTestClient()

          client.start({ apiKey: VALID_API_KEY, plugins: [new TestPlugin()] })

          const plugin = client.getPlugin(AnotherPlugin)

          expect(plugin).toBeUndefined()
        })
      })

      describe('startNetworkSpan', () => {
        it('creates a network span', async () => {
          const delivery = new InMemoryDelivery()
          const client = createTestClient({ deliveryFactory: () => delivery })

          client.start(VALID_API_KEY)

          const span = client.startNetworkSpan({
            method: 'GET',
            url: 'https://example.com'
          })

          span.end({ status: 200 })

          await jest.runOnlyPendingTimersAsync()

          expect(delivery).toHaveSentSpan(expect.objectContaining({
            name: '[HTTP/GET]',
            kind: 3,
            events: [],
            spanId: 'a random 64 bit string',
            traceId: 'a random 128 bit string',
            startTimeUnixNano: expect.any(String),
            endTimeUnixNano: expect.any(String)
          }))

          const deliveredSpan = delivery.requests[0].resourceSpans[0].scopeSpans[0].spans[0]
          expect(deliveredSpan).toHaveAttribute('bugsnag.span.category', 'network')
          expect(deliveredSpan).toHaveAttribute('http.method', 'GET')
          expect(deliveredSpan).toHaveAttribute('http.url', 'https://example.com')
          expect(deliveredSpan).toHaveAttribute('http.status_code', 200)
        })
      })
    })

    it('creates and configures a given plugin', () => {
      const plugin = { configure: jest.fn() }
      const createPlugins = jest.fn(() => [plugin])
      const client = createTestClient({ plugins: createPlugins })
      expect(createPlugins).toHaveBeenCalled()
      expect(plugin.configure).not.toHaveBeenCalled()
      client.start(VALID_API_KEY)
      expect(plugin.configure).toHaveBeenCalled()
    })
  })

  describe('createNoopClient', () => {
    it('implements the expected API (minimal arguments)', () => {
      expect(() => {
        const client = createNoopClient()
        client.start('api key')

        const span = client.startSpan('name')
        span.end()
      }).not.toThrow()
    })

    it('implements the expected API (all arguments)', () => {
      expect(() => {
        const client = createNoopClient()
        client.start({
          apiKey: '1234',
          endpoint: 'https://example.bugsnag.com',
          releaseStage: 'staging'
        })

        const span = client.startSpan('name', { startTime: new Date() })
        span.end()
      }).not.toThrow()
    })
  })
})

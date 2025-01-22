import { ReactNativeSpanFactory } from '../lib/span-factory'
import { platformExtensions } from '../lib/platform-extensions'
import { createTestClient, IncrementingClock, InMemoryDelivery, VALID_API_KEY } from '@bugsnag/js-performance-test-utilities'

jest.useFakeTimers()

describe('startNavigationSpan', () => {
  it('creates a navigation span', async () => {
    const delivery = new InMemoryDelivery()
    const clock = new IncrementingClock()
    const testClient = createTestClient({
      deliveryFactory: () => delivery,
      spanFactory: ReactNativeSpanFactory,
      platformExtensions: (spanFactory, spanContextStorage) => platformExtensions(0, clock, spanFactory as ReactNativeSpanFactory, spanContextStorage)
    })

    testClient.start({ apiKey: VALID_API_KEY })
    await jest.runOnlyPendingTimersAsync()

    const span = testClient.startNavigationSpan('test')

    span.end()
    await jest.runOnlyPendingTimersAsync()

    expect(delivery.requests.length).toBe(1)
    expect(delivery).toHaveSentSpan(expect.objectContaining({
      name: '[Navigation]test',
      attributes: expect.arrayContaining([
        { key: 'bugsnag.span.category', value: { stringValue: 'navigation' } },
        { key: 'bugsnag.navigation.route', value: { stringValue: 'test' } }
      ])
    }))
  })
})

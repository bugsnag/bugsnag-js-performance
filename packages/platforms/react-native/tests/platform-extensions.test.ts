import { createPlatformExtensions } from '../lib/platform-extensions'
import { createTestClient, InMemoryDelivery, VALID_API_KEY } from '@bugsnag/js-performance-test-utilities'

jest.useFakeTimers()

describe('startNavigationSpan', () => {
  it('creates a navigation span', async () => {
    const delivery = new InMemoryDelivery()
    const testClient = createTestClient({ deliveryFactory: () => delivery, platformExtensions: createPlatformExtensions(0) })
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

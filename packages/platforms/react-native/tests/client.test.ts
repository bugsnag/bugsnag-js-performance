import { platformExtensions } from '../lib/client'
import { createTestClient, InMemoryDelivery, VALID_API_KEY } from '@bugsnag/js-performance-test-utilities'

jest.useFakeTimers()

describe('BugsnagPerformance', () => {
  describe('startNavigationSpan', () => {
    it('creates a navigation span', async () => {
      const delivery = new InMemoryDelivery()
      const testClient = createTestClient({ deliveryFactory: () => delivery, platformExtensions })
      testClient.start({ apiKey: VALID_API_KEY, appName: 'test' })
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
})

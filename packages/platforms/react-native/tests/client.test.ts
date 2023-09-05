import { platformExtensions } from '../lib/client'
import { createTestClient, InMemoryDelivery, VALID_API_KEY } from '@bugsnag/js-performance-test-utilities'

jest.useFakeTimers()

describe('BugsnagPerformance', () => {
  describe('startViewLoadSpan', () => {
    it('starts a view load span', async () => {
      const delivery = new InMemoryDelivery()
      const testClient = createTestClient({ deliveryFactory: () => delivery, platformExtensions })
      testClient.start({ apiKey: VALID_API_KEY, appName: 'test' })
      await jest.runOnlyPendingTimersAsync()

      const span = testClient.startViewLoadSpan('test')

      span.end()
      await jest.runOnlyPendingTimersAsync()

      expect(delivery.requests.length).toBe(1)
      expect(delivery).toHaveSentSpan(expect.objectContaining({
        name: '[Navigation]test',
        attributes: expect.arrayContaining([
          { key: 'bugsnag.span.category', value: { stringValue: 'view_load' } },
          { key: 'bugsnag.span.type', value: { stringValue: 'navigation' } }
        ])
      }))
    })
  })
})

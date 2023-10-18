import { InMemoryDelivery, VALID_API_KEY, createTestClient } from '@bugsnag/js-performance-test-utilities'
import { createSpanAttributesSource } from '../lib/span-attributes-source'
import { type AppStateStatus } from 'react-native/Libraries/AppState/AppState'

jest.useFakeTimers()

describe('spanAttributesSource', () => {
  describe('.requestAttributes()', () => {
    it('sets the bugsnag.app.in_foreground attribute', async () => {
      const mockAppState = { currentState: 'active' as AppStateStatus, isAvailable: true, addEventListener: jest.fn() }
      const spanAttributesSource = createSpanAttributesSource(mockAppState)
      const delivery = new InMemoryDelivery()
      const testClient = createTestClient({ spanAttributesSource, deliveryFactory: () => delivery })

      testClient.start({ apiKey: VALID_API_KEY })
      testClient.startSpan('foreground span').end()

      await jest.runOnlyPendingTimersAsync()

      expect(delivery).toHaveSentSpan(expect.objectContaining({
        name: 'foreground span',
        attributes: expect.arrayContaining([
          { key: 'bugsnag.app.in_foreground', value: { boolValue: true } }
        ])
      }))

      mockAppState.currentState = 'background'

      testClient.startSpan('background span').end()

      await jest.runOnlyPendingTimersAsync()

      expect(delivery).toHaveSentSpan(expect.objectContaining({
        name: 'background span',
        attributes: expect.arrayContaining([
          { key: 'bugsnag.app.in_foreground', value: { boolValue: false } },
          { key: 'net.host.connection.type', value: { stringValue: 'unknown' } }
        ])
      }))
    })
  })
})

import { InMemoryDelivery, VALID_API_KEY, createTestClient } from '@bugsnag/js-performance-test-utilities'
import { type AppStateStatus } from 'react-native/Libraries/AppState/AppState'
import { createSpanAttributesSource } from '../lib/span-attributes-source'

// eslint-disable-next-line jest/no-mocks-import
import { NetInfoCellularGeneration, NetInfoStateType, notifyNetworkStateChange, resetEventListeners } from '../__mocks__/@react-native-community/netinfo'

jest.useFakeTimers()

afterEach(() => {
  resetEventListeners()
})

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
          { key: 'bugsnag.app.in_foreground', value: { boolValue: false } }
        ])
      }))
    })

    it('sets the net.host.connection.type attribute', async () => {
      const mockAppState = { currentState: 'active' as AppStateStatus, isAvailable: true, addEventListener: jest.fn() }
      const spanAttributesSource = createSpanAttributesSource(mockAppState)
      const delivery = new InMemoryDelivery()
      const testClient = createTestClient({ spanAttributesSource, deliveryFactory: () => delivery })

      testClient.start({ apiKey: VALID_API_KEY })
      testClient.startSpan('span').end()

      await jest.runOnlyPendingTimersAsync()

      const deliveredSpan = delivery.requests[0].resourceSpans[0].scopeSpans[0].spans[0]
      expect(deliveredSpan.attributes).toStrictEqual(expect.arrayContaining([
        { key: 'bugsnag.span.category', value: { stringValue: 'custom' } },
        { key: 'bugsnag.app.in_foreground', value: { boolValue: true } },
        { key: 'net.host.connection.type', value: { stringValue: 'cell' } },
        { key: 'net.host.connection.subtype', value: { stringValue: '4g' } },
        { key: 'bugsnag.sampling.p', value: { doubleValue: 1 } }
      ]))
    })

    it('detects network changes and reports the latest net.host.connection.type attribute', async () => {
      const mockAppState = { currentState: 'active' as AppStateStatus, isAvailable: true, addEventListener: jest.fn() }
      const spanAttributesSource = createSpanAttributesSource(mockAppState)
      const delivery = new InMemoryDelivery()
      const testClient = createTestClient({ spanAttributesSource, deliveryFactory: () => delivery })

      testClient.start({ apiKey: VALID_API_KEY })

      // First network change (slower network)
      notifyNetworkStateChange({
        isConnected: true,
        isInternetReachable: true,
        type: NetInfoStateType.cellular,
        details: {
          isConnectionExpensive: true,
          carrier: 'Bugsnag',
          cellularGeneration: NetInfoCellularGeneration['3g']
        }
      })

      // Second network change (wifi)
      notifyNetworkStateChange({
        isConnected: true,
        isInternetReachable: true,
        type: NetInfoStateType.wifi,
        details: {
          bssid: 'bssid',
          frequency: 10,
          ipAddress: '1.2.3.4',
          isConnectionExpensive: false,
          linkSpeed: 1000,
          rxLinkSpeed: 1000,
          ssid: 'MyTestWiFiNetwork',
          strength: 88,
          subnet: '',
          txLinkSpeed: 1000
        }
      })

      testClient.startSpan('span').end()

      await jest.runOnlyPendingTimersAsync()

      const deliveredSpan = delivery.requests[0].resourceSpans[0].scopeSpans[0].spans[0]
      expect(deliveredSpan.attributes).toStrictEqual([
        { key: 'bugsnag.span.category', value: { stringValue: 'custom' } },
        { key: 'bugsnag.app.in_foreground', value: { boolValue: true } },
        { key: 'net.host.connection.type', value: { stringValue: 'wifi' } },
        // net.host.connection.subtype should not be present for a wifi connection
        { key: 'bugsnag.sampling.p', value: { doubleValue: 1 } }
      ])
    })
  })
})

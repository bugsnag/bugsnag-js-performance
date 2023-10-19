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

      const attiributes = delivery.requests[0].resourceSpans[0].scopeSpans[0].spans[0].attributes

      expect(attiributes).toStrictEqual(expect.arrayContaining([
        { key: 'net.host.connection.type', value: { stringValue: 'cell' } }
      ]))
    })

    it('detects network changes and reports the latest net.host.connection.type attribute', async () => {
      const mockAppState = { currentState: 'active' as AppStateStatus, isAvailable: true, addEventListener: jest.fn() }
      const spanAttributesSource = createSpanAttributesSource(mockAppState)
      const delivery = new InMemoryDelivery()
      const testClient = createTestClient({ spanAttributesSource, deliveryFactory: () => delivery })

      testClient.start({ apiKey: VALID_API_KEY })

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

      const attiributes = delivery.requests[0].resourceSpans[0].scopeSpans[0].spans[0].attributes

      expect(attiributes).toStrictEqual(expect.arrayContaining([
        { key: 'net.host.connection.type', value: { stringValue: 'wifi' } }
      ]))
    })
  })
})

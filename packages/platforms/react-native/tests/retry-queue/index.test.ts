import createRetryQueueFactory from '../../lib/retry-queue'
import { InMemoryQueue } from '@bugsnag/core-performance'
import { InMemoryDelivery, makePayloadCreator } from '@bugsnag/js-performance-test-utilities'
import { AppState } from 'react-native'

// eslint-disable-next-line jest/no-mocks-import
import {
  NetInfoStateType,
  notifyNetworkStateChange,
  resetEventListeners
} from '../../__mocks__/@react-native-community/netinfo'

afterEach(() => {
  // @ts-expect-error we add this in our RN mock
  AppState.reset()
  resetEventListeners()
})

const flushPromises = () => new Promise(process.nextTick)
const createPayload = makePayloadCreator()

describe('retry queue factory', () => {
  it('returns an InMemoryQueue', () => {
    const retryQueueFactory = createRetryQueueFactory()

    expect(retryQueueFactory(new InMemoryDelivery(), 20)).toBeInstanceOf(InMemoryQueue)
  })

  it.each(
    ['active', 'inactive', 'background']
  )('flushes the retry queue when the app state status changes to "%s"', async (status) => {
    const retryQueueFactory = createRetryQueueFactory()

    const delivery = new InMemoryDelivery()
    const queue = retryQueueFactory(delivery, 20)

    const validEndTime = BigInt(Date.now()) * BigInt(1_000_000)
    const payload = createPayload({ spanId: 'abcd', endTimeUnixNano: validEndTime.toString() })
    queue.add(payload, Date.now())

    expect(delivery.requests).toHaveLength(0)

    // @ts-expect-error we add this in our RN mock
    AppState.bugsnagChangeAppStateStatus(status)

    await flushPromises()

    expect(delivery.requests[0]).toStrictEqual(payload.body)
    expect(delivery.requests).toHaveLength(1)
  })

  it('flushes the retry queue when the app gains network connectivity', async () => {
    const retryQueueFactory = createRetryQueueFactory()

    const delivery = new InMemoryDelivery()
    const queue = retryQueueFactory(delivery, 20)

    const validEndTime = BigInt(Date.now()) * BigInt(1_000_000)
    const payload = createPayload({ spanId: 'abcd', endTimeUnixNano: validEndTime.toString() })
    queue.add(payload, Date.now())

    expect(delivery.requests).toHaveLength(0)

    notifyNetworkStateChange({
      isConnected: false,
      isInternetReachable: false,
      type: NetInfoStateType.none,
      details: null
    })

    // we just disconnected so there should be no requests
    await flushPromises()
    expect(delivery.requests).toHaveLength(0)

    notifyNetworkStateChange({
      isConnected: false,
      isInternetReachable: false,
      type: NetInfoStateType.none,
      details: null
    })

    // another disconnection should still not send a request
    await flushPromises()
    expect(delivery.requests).toHaveLength(0)

    // connecting should result in a flush
    notifyNetworkStateChange({
      isConnected: true,
      isInternetReachable: true,
      type: NetInfoStateType.ethernet,
      details: { ipAddress: '1234', subnet: '5678', isConnectionExpensive: false }
    })

    await flushPromises()

    expect(delivery.requests[0]).toStrictEqual(payload.body)
    expect(delivery.requests).toHaveLength(1)
  })
})

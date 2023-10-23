import createRetryQueueFactory from '../../lib/retry-queue'
import FileBasedRetryQueue from '../../lib/retry-queue/file-based'
import FileSystemFake from '../utilities/file-system-fake'
import { InMemoryDelivery, makePayloadCreator } from '@bugsnag/js-performance-test-utilities'
import { AppState } from 'react-native'

const EXPECTED_PATH = '/mock/CacheDir/bugsnag-performance-react-native/v1/retry-queue'
const flushPromises = () => new Promise(process.nextTick)
const createPayload = makePayloadCreator()

describe('File based retry queue factory', () => {
  it('returns a FileBasedRetryQueue', () => {
    const retryQueueFactory = createRetryQueueFactory(new FileSystemFake())

    expect(retryQueueFactory(new InMemoryDelivery(), 20)).toBeInstanceOf(FileBasedRetryQueue)
  })

  it('uses the correct path to the persistence directory', async () => {
    const fileSystem = new FileSystemFake()
    const retryQueueFactory = createRetryQueueFactory(fileSystem)

    const delivery = new InMemoryDelivery()
    const queue = retryQueueFactory(delivery, 20)

    const validEndTime = BigInt(Date.now()) * BigInt(1_000_000)
    const payload = createPayload({ spanId: 'abcd', endTimeUnixNano: validEndTime.toString() })
    queue.add(payload, 0)

    await flushPromises()

    const file = await fileSystem.readFile(`${EXPECTED_PATH}/retry-${validEndTime}-abcd.json`)
    expect(JSON.parse(file)).toStrictEqual(payload)

    await queue.flush()

    expect(delivery.requests[0]).toStrictEqual(payload.body)
    expect(delivery.requests).toHaveLength(1)
  })

  it('flushes the retry queue immediately', async () => {
    const fileSystem = new FileSystemFake()
    const retryQueueFactory = createRetryQueueFactory(fileSystem)

    const delivery = new InMemoryDelivery()

    const validEndTime = BigInt(Date.now()) * BigInt(1_000_000)
    const payload = createPayload({ spanId: 'xyz', endTimeUnixNano: validEndTime.toString() })

    await fileSystem.mkdir(EXPECTED_PATH)
    await fileSystem.writeFile(`${EXPECTED_PATH}/retry-${validEndTime}-xyz.json`, JSON.stringify(payload))

    expect(delivery.requests).toHaveLength(0)

    retryQueueFactory(delivery, 20)
    await flushPromises()

    expect(delivery.requests[0]).toStrictEqual(payload.body)
    expect(delivery.requests).toHaveLength(1)
  })

  it.each(
    ['active', 'inactive', 'background']
  )('flushes the retry queue when the app state status changes to "%s"', async (status) => {
    const fileSystem = new FileSystemFake()
    const retryQueueFactory = createRetryQueueFactory(fileSystem)

    const delivery = new InMemoryDelivery()
    const queue = retryQueueFactory(delivery, 20)

    const validEndTime = BigInt(Date.now()) * BigInt(1_000_000)
    const payload = createPayload({ spanId: 'abcd', endTimeUnixNano: validEndTime.toString() })
    await queue.add(payload, 0)

    expect(delivery.requests).toHaveLength(0)

    // @ts-expect-error we add this in our RN mock
    AppState.bugsnagChangeAppStateStatus(status)

    await flushPromises()

    expect(delivery.requests[0]).toStrictEqual(payload.body)
    expect(delivery.requests).toHaveLength(1)
  })
})

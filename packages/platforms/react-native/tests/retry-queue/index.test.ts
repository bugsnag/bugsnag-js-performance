import createRetryQueueFactory from '../../lib/retry-queue'
import FileBasedRetryQueue from '../../lib/retry-queue/file-based'
import FileSystemFake from '../utilities/file-system-fake'
import { InMemoryDelivery, makePayloadCreator } from '@bugsnag/js-performance-test-utilities'

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
})

import FileBasedRetryQueue from '../../lib/retry-queue/file-based'
import RetryQueueDirectory from '../../lib/retry-queue/directory'
import FileSystemFake from '../utilities/file-system-fake'
import { InMemoryDelivery, makePayloadCreator } from '@bugsnag/js-performance-test-utilities'

const createPayload = makePayloadCreator()

describe('RetryQueueDirectory', () => {
  describe('add', () => {
    it('writes a file to the retry queue directory', async () => {
      const delivery = new InMemoryDelivery()
      const fileSystem = new FileSystemFake()
      const directory = new RetryQueueDirectory(fileSystem, '/a/b/c')
      const queue = new FileBasedRetryQueue(delivery, directory)

      const payload = createPayload({ spanId: 'abcd', endTimeUnixNano: '1234' })

      const batchTime = Date.now()
      await queue.add(payload, batchTime)

      const contents = await directory.read(`retry-${batchTime}-abcd.json`)

      expect(JSON.parse(contents)).toStrictEqual(payload)
      expect(await directory.files()).toStrictEqual([`retry-${batchTime}-abcd.json`])
    })

    it('uses the last span id for the filename', async () => {
      const delivery = new InMemoryDelivery()
      const fileSystem = new FileSystemFake()
      const directory = new RetryQueueDirectory(fileSystem, '/a/b/c')
      const queue = new FileBasedRetryQueue(delivery, directory)

      const payload = createPayload(
        { spanId: 'abcd', endTimeUnixNano: '1234' },
        { spanId: 'wxyz', endTimeUnixNano: '1235' }
      )

      await queue.add(payload, 0)

      const contents = await directory.read('retry-0-wxyz.json')

      expect(JSON.parse(contents)).toStrictEqual(payload)
      expect(await directory.files()).toStrictEqual(['retry-0-wxyz.json'])
    })

    it('does not write a file if the payload has no spans', async () => {
      const delivery = new InMemoryDelivery()
      const fileSystem = new FileSystemFake()
      const directory = new RetryQueueDirectory(fileSystem, '/a/b/c')
      const queue = new FileBasedRetryQueue(delivery, directory)

      await queue.add(createPayload(), 0)

      expect(await directory.files()).toStrictEqual([])
    })

    it('writes separate files for different payloads', async () => {
      const delivery = new InMemoryDelivery()
      const fileSystem = new FileSystemFake()
      const directory = new RetryQueueDirectory(fileSystem, '/a/b/c')
      const queue = new FileBasedRetryQueue(delivery, directory)

      const payload1 = createPayload({ spanId: 'abcd', endTimeUnixNano: '1234' })
      const payload2 = createPayload({ spanId: 'wxyz', endTimeUnixNano: '1235' })

      const batchTime = Date.now()
      await queue.add(payload1, batchTime)
      await queue.add(payload2, batchTime)

      expect(await directory.files()).toStrictEqual([
        `retry-${batchTime}-abcd.json`,
        `retry-${batchTime}-wxyz.json`
      ])

      const contents1 = await directory.read(`retry-${batchTime}-wxyz.json`)
      expect(JSON.parse(contents1)).toStrictEqual(payload2)

      const contents2 = await directory.read(`retry-${batchTime}-abcd.json`)
      expect(JSON.parse(contents2)).toStrictEqual(payload1)
    })
  })

  describe('flush', () => {
    it('delivers payloads in order of newest -> oldest', async () => {
      const validEndTime = BigInt(Date.now()) * BigInt(1_000_000)
      const delivery = new InMemoryDelivery()
      const fileSystem = new FileSystemFake()
      const directory = new RetryQueueDirectory(fileSystem, '/aaa')
      const queue = new FileBasedRetryQueue(delivery, directory)

      const payload1 = createPayload({
        spanId: 'abcd',
        endTimeUnixNano: String(validEndTime)
      })

      const payload2 = createPayload({
        spanId: 'wxyz',
        endTimeUnixNano: String(validEndTime)
      })

      const payload3 = createPayload({
        spanId: 'jjjj',
        endTimeUnixNano: String(validEndTime)
      })

      const batchTime1 = Date.now()
      const batchTime2 = batchTime1 + 1
      const batchTime3 = batchTime1 + 2
      await queue.add(payload1, batchTime2)
      await queue.add(payload2, batchTime3)
      await queue.add(payload3, batchTime1)

      expect(await directory.files()).toStrictEqual([
        `retry-${batchTime3}-wxyz.json`,
        `retry-${batchTime2}-abcd.json`,
        `retry-${batchTime1}-jjjj.json`
      ])

      await queue.flush()

      expect(delivery.requests[0]).toStrictEqual(payload2.body)
      expect(delivery.requests[1]).toStrictEqual(payload1.body)
      expect(delivery.requests[2]).toStrictEqual(payload3.body)
      expect(delivery.requests).toHaveLength(3)

      expect(await directory.files()).toStrictEqual([])
    })

    it('deletes files with invalid names', async () => {
      const validEndTime = BigInt(Date.now()) * BigInt(1_000_000)
      const payload = createPayload({ spanId: 'a', endTimeUnixNano: validEndTime.toString() })

      const fileSystem = new FileSystemFake()
      await fileSystem.mkdir('/abc')

      const validTimeStamp = Date.now()

      await Promise.all([
        fileSystem.writeFile('/abc/retry-abc-123.json', 'swapped span id and timestamp'),
        fileSystem.writeFile('/abc/retry-123-abc.txt', 'invalid extension'),
        fileSystem.writeFile('/abc/:)', 'completely wrong'),
        fileSystem.writeFile('/abc/retry-0-a.txt', 'invalid extension'),
        fileSystem.writeFile(`/abc/retry-${validTimeStamp}-abcd.json`, JSON.stringify(payload))
      ])

      const delivery = new InMemoryDelivery()
      const directory = new RetryQueueDirectory(fileSystem, '/abc')
      const queue = new FileBasedRetryQueue(delivery, directory)

      expect(await directory.files()).toStrictEqual([
        `retry-${validTimeStamp}-abcd.json`,
        'retry-abc-123.json',
        'retry-123-abc.txt',
        ':)',
        'retry-0-a.txt'
      ])

      await queue.flush()

      // only 1 request should be made with the valid payload
      expect(delivery.requests[0]).toStrictEqual(payload.body)
      expect(delivery.requests).toHaveLength(1)

      // all the files should have been deleted
      expect(await directory.files()).toStrictEqual([])
    })

    it('deletes files with invalid contents', async () => {
      const validEndTime = BigInt(Date.now()) * BigInt(1_000_000)
      const payload = createPayload({ spanId: 'a', endTimeUnixNano: validEndTime.toString() })

      const fileSystem = new FileSystemFake()
      await fileSystem.mkdir('/abc')

      const validTimeStamp = Date.now()

      await Promise.all([
        fileSystem.writeFile('/abc/retry-abc-123.json', 'swapped span id and timestamp'),
        fileSystem.writeFile('/abc/retry-123-abc.txt', 'invalid extension'),
        fileSystem.writeFile('/abc/:)', 'completely wrong'),
        fileSystem.writeFile('/abc/retry-0-a.txt', 'invalid extension'),
        fileSystem.writeFile(`/abc/retry-${validTimeStamp}-ijkl.json`, JSON.stringify(payload)),
        fileSystem.writeFile(`/abc/retry-${validTimeStamp}-efgh.json`, '{"invalid json :) }}}}')
      ])

      const delivery = new InMemoryDelivery()
      const directory = new RetryQueueDirectory(fileSystem, '/abc')
      const queue = new FileBasedRetryQueue(delivery, directory)

      expect(await directory.files()).toStrictEqual([
        `retry-${validTimeStamp}-efgh.json`,
        `retry-${validTimeStamp}-ijkl.json`,
        'retry-abc-123.json',
        'retry-123-abc.txt',
        ':)',
        'retry-0-a.txt'
      ])

      await queue.flush()

      expect(delivery.requests[0]).toStrictEqual(payload.body)
      expect(delivery.requests).toHaveLength(1)

      // all the files should have been deleted
      expect(await directory.files()).toStrictEqual([])
    })

    it('deletes files after permanent delivery failure', async () => {
      const validEndTime = BigInt(Date.now()) * BigInt(1_000_000)
      const payload1 = createPayload({ spanId: 'a', endTimeUnixNano: validEndTime.toString() })
      const payload2 = createPayload({ spanId: 'b', endTimeUnixNano: (validEndTime + BigInt(1)).toString() })
      const payload3 = createPayload({ spanId: 'c', endTimeUnixNano: (validEndTime + BigInt(2)).toString() })

      const fileSystem = new FileSystemFake()
      const delivery = new InMemoryDelivery()
      const directory = new RetryQueueDirectory(fileSystem, '/abc')
      const queue = new FileBasedRetryQueue(delivery, directory)

      const batchTime1 = Date.now()
      const batchTime2 = batchTime1 + 1
      const batchTime3 = batchTime1 + 2
      await queue.add(payload1, batchTime1)
      await queue.add(payload2, batchTime2)
      await queue.add(payload3, batchTime3)

      expect(await directory.files()).toStrictEqual([
        `retry-${batchTime3}-c.json`,
        `retry-${batchTime2}-b.json`,
        `retry-${batchTime1}-a.json`
      ])

      delivery.setNextResponseState('failure-discard')
      delivery.setNextResponseState('success')

      await queue.flush()

      expect(delivery.requests).toStrictEqual([
        payload3.body,
        payload2.body,
        payload1.body
      ])

      // all files should have been deleted
      expect(await directory.files()).toStrictEqual([])
    })

    it('leaves files after retryable delivery failure', async () => {
      const validEndTime = BigInt(Date.now()) * BigInt(1_000_000)
      const payload1 = createPayload({ spanId: 'a', endTimeUnixNano: validEndTime.toString() })
      const payload2 = createPayload({ spanId: 'b', endTimeUnixNano: (validEndTime + BigInt(1)).toString() })
      const payload3 = createPayload({ spanId: 'c', endTimeUnixNano: (validEndTime + BigInt(2)).toString() })

      const fileSystem = new FileSystemFake()
      const delivery = new InMemoryDelivery()
      const directory = new RetryQueueDirectory(fileSystem, '/abc')
      const queue = new FileBasedRetryQueue(delivery, directory)

      const batchTime1 = Date.now()
      const batchTime2 = batchTime1 + 1
      const batchTime3 = batchTime1 + 2
      await queue.add(payload1, batchTime1)
      await queue.add(payload2, batchTime2)
      await queue.add(payload3, batchTime3)

      expect(await directory.files()).toStrictEqual([
        `retry-${batchTime3}-c.json`,
        `retry-${batchTime2}-b.json`,
        `retry-${batchTime1}-a.json`
      ])

      delivery.setNextResponseState('failure-retryable')
      delivery.setNextResponseState('success')

      await queue.flush()

      expect(delivery.requests).toStrictEqual([
        payload3.body,
        payload2.body,
        payload1.body
      ])

      // the second file should be left alone
      expect(await directory.files()).toStrictEqual([`retry-${batchTime2}-b.json`])
    })

    it('deletes files that are more than 24 hours old', async () => {
      const validEndTime = BigInt(Date.now()) * BigInt(1_000_000)
      const payload1 = createPayload({ spanId: 'a', endTimeUnixNano: validEndTime.toString() })
      const payload2 = createPayload({ spanId: 'c', endTimeUnixNano: validEndTime.toString() })

      const fileSystem = new FileSystemFake()
      const delivery = new InMemoryDelivery()
      const directory = new RetryQueueDirectory(fileSystem, '/abc')
      const queue = new FileBasedRetryQueue(delivery, directory)

      const batchTime1 = Date.now() - 1
      const batchTime2 = 1234567890
      await queue.add(payload1, batchTime1)
      await queue.add(payload2, batchTime2)

      expect(await directory.files()).toStrictEqual([
        `retry-${batchTime1}-a.json`,
        `retry-${batchTime2}-c.json`
      ])

      await queue.flush()

      expect(delivery.requests).toStrictEqual([payload1.body])
      expect(await directory.files()).toStrictEqual([])
    })

    it('deletes files that are more than 24 hours in the future', async () => {
      const validEndTime = BigInt(Date.now()) * BigInt(1_000_000)
      const payload1 = createPayload({ spanId: 'a', endTimeUnixNano: validEndTime.toString() })
      const payload2 = createPayload({ spanId: 'c', endTimeUnixNano: validEndTime.toString() })

      const fileSystem = new FileSystemFake()
      const delivery = new InMemoryDelivery()
      const directory = new RetryQueueDirectory(fileSystem, '/abc')
      const queue = new FileBasedRetryQueue(delivery, directory)

      const batchTime1 = Date.now()
      const batchTime2 = batchTime1 * 10
      await queue.add(payload1, batchTime1)
      await queue.add(payload2, batchTime2)

      expect(await directory.files()).toStrictEqual([
        `retry-${batchTime2}-c.json`,
        `retry-${batchTime1}-a.json`
      ])

      await queue.flush()

      expect(delivery.requests).toStrictEqual([payload1.body])
      expect(await directory.files()).toStrictEqual([])
    })
  })
})

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

      await queue.add(payload, 0)

      const contents = await directory.read('retry-1234-abcd.json')

      expect(JSON.parse(contents)).toStrictEqual(payload)
      expect(await directory.files()).toStrictEqual(['retry-1234-abcd.json'])
    })

    it('uses the span with the largest timestamp for the filename', async () => {
      const delivery = new InMemoryDelivery()
      const fileSystem = new FileSystemFake()
      const directory = new RetryQueueDirectory(fileSystem, '/a/b/c')
      const queue = new FileBasedRetryQueue(delivery, directory)

      const payload = createPayload(
        { spanId: 'abcd', endTimeUnixNano: '1234' },
        { spanId: 'wxyz', endTimeUnixNano: '1235' }
      )

      await queue.add(payload, 0)

      const contents = await directory.read('retry-1235-wxyz.json')

      expect(JSON.parse(contents)).toStrictEqual(payload)
      expect(await directory.files()).toStrictEqual(['retry-1235-wxyz.json'])
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

      await queue.add(payload1, 0)
      await queue.add(payload2, 0)

      expect(await directory.files()).toStrictEqual([
        'retry-1235-wxyz.json',
        'retry-1234-abcd.json'
      ])

      const contents1 = await directory.read('retry-1235-wxyz.json')
      expect(JSON.parse(contents1)).toStrictEqual(payload2)

      const contents2 = await directory.read('retry-1234-abcd.json')
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
        endTimeUnixNano: String(validEndTime + BigInt(99))
      })

      const payload2 = createPayload({
        spanId: 'wxyz',
        endTimeUnixNano: String(validEndTime + BigInt(999))
      })

      const payload3 = createPayload({
        spanId: 'jjjj',
        endTimeUnixNano: String(validEndTime + BigInt(9))
      })

      await queue.add(payload1, 0)
      await queue.add(payload2, 0)
      await queue.add(payload3, 0)

      expect(await directory.files()).toStrictEqual([
        `retry-${payload2.body.resourceSpans[0].scopeSpans[0].spans[0].endTimeUnixNano}-wxyz.json`,
        `retry-${payload1.body.resourceSpans[0].scopeSpans[0].spans[0].endTimeUnixNano}-abcd.json`,
        `retry-${payload3.body.resourceSpans[0].scopeSpans[0].spans[0].endTimeUnixNano}-jjjj.json`
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

      await Promise.all([
        fileSystem.writeFile('/abc/retry-abc-123.json', 'swapped span id and timestamp'),
        fileSystem.writeFile('/abc/retry-123-abc.txt', 'invalid extension'),
        fileSystem.writeFile('/abc/:)', 'completely wrong'),
        fileSystem.writeFile('/abc/retry-0-a.txt', 'invalid extension'),
        fileSystem.writeFile(`/abc/retry-${validEndTime}-abcd.json`, JSON.stringify(payload))
      ])

      const delivery = new InMemoryDelivery()
      const directory = new RetryQueueDirectory(fileSystem, '/abc')
      const queue = new FileBasedRetryQueue(delivery, directory)

      expect(await directory.files()).toStrictEqual([
        `retry-${validEndTime}-abcd.json`,
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

      await Promise.all([
        fileSystem.writeFile('/abc/retry-abc-123.json', 'swapped span id and timestamp'),
        fileSystem.writeFile('/abc/retry-123-abc.txt', 'invalid extension'),
        fileSystem.writeFile('/abc/:)', 'completely wrong'),
        fileSystem.writeFile('/abc/retry-0-a.txt', 'invalid extension'),
        fileSystem.writeFile(`/abc/retry-${validEndTime + BigInt(2)}-ijkl.json`, JSON.stringify(payload)),
        fileSystem.writeFile(`/abc/retry-${validEndTime + BigInt(1)}-efgh.json`, '{"invalid json :) }}}}')
      ])

      const delivery = new InMemoryDelivery()
      const directory = new RetryQueueDirectory(fileSystem, '/abc')
      const queue = new FileBasedRetryQueue(delivery, directory)

      expect(await directory.files()).toStrictEqual([
        `retry-${validEndTime + BigInt(2)}-ijkl.json`,
        `retry-${validEndTime + BigInt(1)}-efgh.json`,
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

      await queue.add(payload1, 1234)
      await queue.add(payload2, 1234)
      await queue.add(payload3, 1234)

      expect(await directory.files()).toStrictEqual([
        `retry-${validEndTime + BigInt(2)}-c.json`,
        `retry-${validEndTime + BigInt(1)}-b.json`,
        `retry-${validEndTime}-a.json`
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

      await queue.add(payload1, 1234)
      await queue.add(payload2, 1234)
      await queue.add(payload3, 1234)

      expect(await directory.files()).toStrictEqual([
        `retry-${validEndTime + BigInt(2)}-c.json`,
        `retry-${validEndTime + BigInt(1)}-b.json`,
        `retry-${validEndTime}-a.json`
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
      expect(await directory.files()).toStrictEqual([`retry-${validEndTime + BigInt(1)}-b.json`])
    })

    it('deletes files that are more than 24 hours old', async () => {
      const validEndTime = BigInt(Date.now()) * BigInt(1_000_000)
      const payload1 = createPayload({ spanId: 'a', endTimeUnixNano: validEndTime.toString() })
      const payload2 = createPayload({ spanId: 'c', endTimeUnixNano: '1234567890' })

      const fileSystem = new FileSystemFake()
      const delivery = new InMemoryDelivery()
      const directory = new RetryQueueDirectory(fileSystem, '/abc')
      const queue = new FileBasedRetryQueue(delivery, directory)

      await queue.add(payload1, 1234)
      await queue.add(payload2, 1234)

      expect(await directory.files()).toStrictEqual([
        `retry-${validEndTime}-a.json`,
        'retry-1234567890-c.json'
      ])

      await queue.flush()

      expect(delivery.requests).toStrictEqual([payload1.body])
      expect(await directory.files()).toStrictEqual([])
    })

    it('deletes files that are more than 24 hours in the future', async () => {
      const validEndTime = BigInt(Date.now()) * BigInt(1_000_000)
      const payload1 = createPayload({ spanId: 'a', endTimeUnixNano: validEndTime.toString() })
      const payload2 = createPayload({ spanId: 'c', endTimeUnixNano: (validEndTime * BigInt(10)).toString() })

      const fileSystem = new FileSystemFake()
      const delivery = new InMemoryDelivery()
      const directory = new RetryQueueDirectory(fileSystem, '/abc')
      const queue = new FileBasedRetryQueue(delivery, directory)

      await queue.add(payload1, 1234)
      await queue.add(payload2, 1234)

      expect(await directory.files()).toStrictEqual([
        `retry-${validEndTime * BigInt(10)}-c.json`,
        `retry-${validEndTime}-a.json`
      ])

      await queue.flush()

      expect(delivery.requests).toStrictEqual([payload1.body])
      expect(await directory.files()).toStrictEqual([])
    })
  })
})

import type { Subscription } from '../lib/event-emitter'
import { type FetchRequestData, initFetchEventEmitter } from '../lib/event-emitter-fetch'

function mockFetch (fail: boolean = false, status: number = 200) {
  return (input: RequestInfo | URL, init?: RequestInit | undefined) => {
    return new Promise<Response>((resolve, reject) => {
      if (fail) {
        reject(new Error('Fail'))
      } else {
        resolve({ status } as unknown as Response)
      }
    })
  }
}

// mock (fetch) Request
class MockRequest {
  url: string
  method: string

  constructor (url: string, opts?: { method: string }) {
    this.url = url
    this.method = (opts?.method) || 'GET'
  }
}

describe('fetch Event Emitter', () => {
  const window = {} as unknown as Window & typeof globalThis
  let subscription: Subscription

  afterEach(() => {
    if (subscription) subscription.unsubscribe()
  })

  it.each(['GET', 'PUT', 'POST', 'DELETE'])('should notify subscribers for a completed %s request', async (method) => {
    window.fetch = mockFetch()
    const eventEmitter = initFetchEventEmitter(window)

    const contexts: FetchRequestData[] = []
    const callback = (context: FetchRequestData) => contexts.push({ ...context })
    subscription = eventEmitter.subscribe(callback)

    const response = await window.fetch('http://test-url.com/', { method })
    expect(response.status).toEqual(200)

    expect(contexts.length).toEqual(2)
    expect(contexts[0]).toEqual({
      state: 'start',
      method,
      url: 'http://test-url.com/',
      startTime: expect.any(Date)
    })

    expect(contexts[1]).toEqual({
      state: 'end',
      method,
      url: 'http://test-url.com/',
      startTime: expect.any(Date),
      endTime: expect.any(Date),
      status: 200
    })
  })

  it('should notify subscribers when a request errors', async () => {
    window.fetch = mockFetch(true)
    const eventEmitter = initFetchEventEmitter(window)

    const contexts: FetchRequestData[] = []
    const callback = (context: FetchRequestData) => contexts.push({ ...context })
    subscription = eventEmitter.subscribe(callback)

    expect.assertions(4)
    await expect(window.fetch('http://test-url.com/')).rejects.toEqual(new Error('Fail'))
    expect(contexts.length).toEqual(2)
    expect(contexts[0]).toEqual({
      state: 'start',
      method: 'GET',
      url: 'http://test-url.com/',
      startTime: expect.any(Date)
    })

    expect(contexts[1]).toEqual({
      state: 'end',
      method: 'GET',
      url: 'http://test-url.com/',
      status: undefined,
      startTime: expect.any(Date),
      endTime: expect.any(Date),
      error: new Error('Fail')
    })
  })

  it('should handle a fetch with no method specified', async () => {
    window.fetch = mockFetch()
    const eventEmitter = initFetchEventEmitter(window)

    const contexts: FetchRequestData[] = []
    const callback = (context: FetchRequestData) => contexts.push({ ...context })
    subscription = eventEmitter.subscribe(callback)

    const response = await window.fetch('http://test-url.com/')
    expect(response.status).toEqual(200)

    expect(contexts.length).toEqual(2)
    expect(contexts[0]).toEqual({
      state: 'start',
      method: 'GET',
      url: 'http://test-url.com/',
      startTime: expect.any(Date)
    })

    expect(contexts[1]).toEqual({
      state: 'end',
      method: 'GET',
      url: 'http://test-url.com/',
      startTime: expect.any(Date),
      endTime: expect.any(Date),
      status: 200
    })
  })

  it('should handle a URL object', async () => {
    window.fetch = mockFetch()
    const eventEmitter = initFetchEventEmitter(window)

    const contexts: FetchRequestData[] = []
    const callback = (context: FetchRequestData) => contexts.push({ ...context })
    subscription = eventEmitter.subscribe(callback)

    const response = await window.fetch(new URL('http://test-url.com/'))
    expect(response.status).toEqual(200)

    expect(contexts.length).toEqual(2)
    expect(contexts[0]).toEqual({
      state: 'start',
      method: 'GET',
      url: 'http://test-url.com/',
      startTime: expect.any(Date)
    })

    expect(contexts[1]).toEqual({
      state: 'end',
      method: 'GET',
      url: 'http://test-url.com/',
      startTime: expect.any(Date),
      endTime: expect.any(Date),
      status: 200
    })
  })

  it('should handle a Request object', async () => {
    window.fetch = mockFetch()
    const eventEmitter = initFetchEventEmitter(window)

    const contexts: FetchRequestData[] = []
    const callback = (context: FetchRequestData) => contexts.push({ ...context })
    subscription = eventEmitter.subscribe(callback)

    const request = new MockRequest('http://test-url.com/')
    const response = await window.fetch(request as unknown as Request)
    expect(response.status).toEqual(200)

    expect(contexts.length).toEqual(2)
    expect(contexts[0]).toEqual({
      state: 'start',
      method: 'GET',
      url: 'http://test-url.com/',
      startTime: expect.any(Date)
    })

    expect(contexts[1]).toEqual({
      state: 'end',
      method: 'GET',
      url: 'http://test-url.com/',
      startTime: expect.any(Date),
      endTime: expect.any(Date),
      status: 200
    })
  })

  it('should handle a Request object with a method', async () => {
    window.fetch = mockFetch()
    const eventEmitter = initFetchEventEmitter(window)

    const contexts: FetchRequestData[] = []
    const callback = (context: FetchRequestData) => contexts.push({ ...context })
    subscription = eventEmitter.subscribe(callback)

    const request = new MockRequest('http://test-url.com/', { method: 'POST' })
    const response = await window.fetch(request as unknown as Request)
    expect(response.status).toEqual(200)

    expect(contexts.length).toEqual(2)
    expect(contexts[0]).toEqual({
      state: 'start',
      method: 'POST',
      url: 'http://test-url.com/',
      startTime: expect.any(Date)
    })

    expect(contexts[1]).toEqual({
      state: 'end',
      method: 'POST',
      url: 'http://test-url.com/',
      startTime: expect.any(Date),
      endTime: expect.any(Date),
      status: 200
    })
  })

  it('should handle a Request object with separate options', async () => {
    window.fetch = mockFetch()
    const eventEmitter = initFetchEventEmitter(window)

    const contexts: FetchRequestData[] = []
    const callback = (context: FetchRequestData) => contexts.push({ ...context })
    subscription = eventEmitter.subscribe(callback)

    const request = new MockRequest('http://test-url.com/')
    const response = await window.fetch(request as unknown as Request, { method: 'POST' })
    expect(response.status).toEqual(200)

    expect(contexts.length).toEqual(2)
    expect(contexts[0]).toEqual({
      state: 'start',
      method: 'POST',
      url: 'http://test-url.com/',
      startTime: expect.any(Date)
    })

    expect(contexts[1]).toEqual({
      state: 'end',
      method: 'POST',
      url: 'http://test-url.com/',
      startTime: expect.any(Date),
      endTime: expect.any(Date),
      status: 200
    })
  })

  it('should handle a fetch(undefined)', async () => {
    window.fetch = mockFetch(true)
    const eventEmitter = initFetchEventEmitter(window)

    const contexts: FetchRequestData[] = []
    const callback = (context: FetchRequestData) => contexts.push({ ...context })
    subscription = eventEmitter.subscribe(callback)

    expect.assertions(4)
    await expect(window.fetch(undefined as unknown as string)).rejects.toEqual(new Error('Fail'))
    expect(contexts.length).toEqual(2)
    expect(contexts[0]).toEqual({
      state: 'start',
      method: 'GET',
      url: undefined,
      startTime: expect.any(Date)
    })

    expect(contexts[1]).toEqual({
      state: 'end',
      method: 'GET',
      url: undefined,
      status: undefined,
      startTime: expect.any(Date),
      endTime: expect.any(Date),
      error: new Error('Fail')
    })
  })

  it('should handle a fetch(null)', async () => {
    window.fetch = mockFetch(true)
    const eventEmitter = initFetchEventEmitter(window)

    const contexts: FetchRequestData[] = []
    const callback = (context: FetchRequestData) => contexts.push({ ...context })
    subscription = eventEmitter.subscribe(callback)

    expect.assertions(4)
    await expect(window.fetch(null as unknown as RequestInfo)).rejects.toEqual(new Error('Fail'))
    expect(contexts.length).toEqual(2)
    expect(contexts[0]).toEqual({
      state: 'start',
      method: 'GET',
      url: null,
      startTime: expect.any(Date)
    })

    expect(contexts[1]).toEqual({
      state: 'end',
      method: 'GET',
      url: null,
      status: undefined,
      startTime: expect.any(Date),
      endTime: expect.any(Date),
      error: new Error('Fail')
    })
  })

  it('should handle a fetch(url, null)', async () => {
    window.fetch = mockFetch()
    const eventEmitter = initFetchEventEmitter(window)

    const contexts: FetchRequestData[] = []
    const callback = (context: FetchRequestData) => contexts.push({ ...context })
    subscription = eventEmitter.subscribe(callback)

    const response = await window.fetch('http://test-url.com/', null as unknown as RequestInit)
    expect(response.status).toEqual(200)

    expect(contexts.length).toEqual(2)
    expect(contexts[0]).toEqual({
      state: 'start',
      method: 'GET',
      url: 'http://test-url.com/',
      startTime: expect.any(Date)
    })

    expect(contexts[1]).toEqual({
      state: 'end',
      method: 'GET',
      url: 'http://test-url.com/',
      startTime: expect.any(Date),
      endTime: expect.any(Date),
      status: 200
    })
  })

  it('should handle a fetch(url, {}})', async () => {
    window.fetch = mockFetch()
    const eventEmitter = initFetchEventEmitter(window)

    const contexts: FetchRequestData[] = []
    const callback = (context: FetchRequestData) => contexts.push({ ...context })
    subscription = eventEmitter.subscribe(callback)

    const response = await window.fetch('http://test-url.com/', {})
    expect(response.status).toEqual(200)

    expect(contexts.length).toEqual(2)
    expect(contexts[0]).toEqual({
      state: 'start',
      method: 'GET',
      url: 'http://test-url.com/',
      startTime: expect.any(Date)
    })

    expect(contexts[1]).toEqual({
      state: 'end',
      method: 'GET',
      url: 'http://test-url.com/',
      startTime: expect.any(Date),
      endTime: expect.any(Date),
      status: 200
    })
  })

  it('should monkey-patch fetch on first subscribe', () => {
    const originalFetch = mockFetch()
    window.fetch = originalFetch
    const eventEmitter = initFetchEventEmitter(window)
    expect(window.fetch).toBe(originalFetch)

    const callback = jest.fn()
    subscription = eventEmitter.subscribe(callback)
    expect(window.fetch).not.toBe(originalFetch)
  })

  it('should restore original fetch when there are no more subscribers', () => {
    const originalFetch = mockFetch()
    window.fetch = originalFetch
    const eventEmitter = initFetchEventEmitter(window)
    const callback = jest.fn()

    subscription = eventEmitter.subscribe(callback)
    expect(window.fetch).not.toBe(originalFetch)

    subscription.unsubscribe()
    expect(window.fetch).toBe(originalFetch)
  })
})

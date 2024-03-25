import { type RequestEndContext, RequestTracker } from '../lib/request-tracker'

describe('Request Tracker', () => {
  it('should invoke start callbacks on onStart', () => {
    const requestTracker = new RequestTracker()
    const endCallback = jest.fn()
    const startCallback = jest.fn(() => ({ onRequestEnd: endCallback }))

    requestTracker.onStart(startCallback)
    expect(startCallback).not.toHaveBeenCalled()

    const context = { type: 'fetch', url: '/', method: 'GET', startTime: 1 } as const
    requestTracker.start(context)
    expect(startCallback).toHaveBeenCalledWith(context)
  })

  it('should invoke end callbacks on end', () => {
    const requestTracker = new RequestTracker()
    const endCallback = jest.fn()
    const startCallback = jest.fn(() => ({ onRequestEnd: endCallback }))

    requestTracker.onStart(startCallback)
    expect(startCallback).not.toHaveBeenCalled()

    const startContext = { type: 'fetch', url: '/', method: 'GET', startTime: 1 } as const
    const { onRequestEnd: onEnd } = requestTracker.start(startContext)
    expect(startCallback).toHaveBeenCalledWith(startContext)
    expect(endCallback).not.toHaveBeenCalled()

    const endContext: RequestEndContext = { status: 200, endTime: 2, state: 'success' }
    onEnd(endContext)
    expect(endCallback).toHaveBeenCalledWith(endContext)
  })

  it('should handle undefined end callbacks', () => {
    const requestTracker = new RequestTracker()
    const endCallback = jest.fn()
    const acceptCallback = jest.fn(() => ({ onRequestEnd: endCallback }))
    const rejectCallback = jest.fn()

    requestTracker.onStart(acceptCallback)
    requestTracker.onStart(rejectCallback)
    expect(acceptCallback).not.toHaveBeenCalled()
    expect(rejectCallback).not.toHaveBeenCalled()

    const startContext = { type: 'fetch', url: '/', method: 'GET', startTime: 1 } as const
    const { onRequestEnd: onEnd } = requestTracker.start(startContext)
    expect(acceptCallback).toHaveBeenCalledWith(startContext)
    expect(rejectCallback).toHaveBeenCalledWith(startContext)

    const endContext: RequestEndContext = { status: 200, endTime: 2, state: 'success' }
    onEnd(endContext)
    expect(endCallback).toHaveBeenCalledWith(endContext)
  })

  it('should handle callbacks with extraRequestHeaders', () => {
    const requestTracker = new RequestTracker()
    const endCallback1 = jest.fn()
    const endCallback2 = jest.fn()
    const startCallback1 = jest.fn(() => ({ onRequestEnd: endCallback1, extraRequestHeaders: { traceparent: 'abc123' } }))
    const startCallback2 = jest.fn(() => ({ onRequestEnd: endCallback2, extraRequestHeaders: { 'x-foo': 'bar' } }))

    requestTracker.onStart(startCallback1)
    requestTracker.onStart(startCallback2)

    const startContext = { type: 'fetch', url: '/', method: 'GET', startTime: 1 } as const
    const { onRequestEnd: onEnd, extraRequestHeaders } = requestTracker.start(startContext)

    expect(startCallback1).toHaveBeenCalledWith(startContext)
    expect(startCallback2).toHaveBeenCalledWith(startContext)

    expect(extraRequestHeaders).toEqual([
      { traceparent: 'abc123' },
      { 'x-foo': 'bar' }
    ])

    const endContext: RequestEndContext = { status: 200, endTime: 2, state: 'success' }
    onEnd(endContext)

    expect(endCallback1).toHaveBeenCalledWith(endContext)
    expect(endCallback2).toHaveBeenCalledWith(endContext)
  })
})

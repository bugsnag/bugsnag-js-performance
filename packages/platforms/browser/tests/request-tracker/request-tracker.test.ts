import { type RequestEndContext, RequestTracker } from '../../lib/request-tracker/request-tracker'

describe('Request Tracker', () => {
  it('should invoke start callbacks on onStart', () => {
    const requestTracker = new RequestTracker()
    const endCallback = jest.fn()
    const startCallback = jest.fn(() => endCallback)

    requestTracker.onStart(startCallback)
    expect(startCallback).not.toHaveBeenCalled()

    const context = { url: '/', method: 'GET', startTime: 1 }
    requestTracker.start(context)
    expect(startCallback).toHaveBeenCalledWith(context)
  })

  it('should invoke end callbacks on end', () => {
    const requestTracker = new RequestTracker()
    const endCallback = jest.fn()
    const startCallback = jest.fn(() => endCallback)

    requestTracker.onStart(startCallback)
    expect(startCallback).not.toHaveBeenCalled()

    const startContext = { url: '/', method: 'GET', startTime: 1 }
    const onEnd = requestTracker.start(startContext)
    expect(startCallback).toHaveBeenCalledWith(startContext)
    expect(endCallback).not.toHaveBeenCalled()

    const endContext: RequestEndContext = { status: 200, endTime: 2, state: 'success' }
    onEnd(endContext)
    expect(endCallback).toHaveBeenCalledWith(endContext)
  })

  it('should handle undefined end callbacks', () => {
    const requestTracker = new RequestTracker()
    const endCallback = jest.fn()
    const acceptCallback = jest.fn(() => endCallback)
    const rejectCallback = jest.fn()

    requestTracker.onStart(acceptCallback)
    requestTracker.onStart(rejectCallback)
    expect(acceptCallback).not.toHaveBeenCalled()
    expect(rejectCallback).not.toHaveBeenCalled()

    const startContext = { url: '/', method: 'GET', startTime: 1 }
    const onEnd = requestTracker.start(startContext)
    expect(acceptCallback).toHaveBeenCalledWith(startContext)
    expect(rejectCallback).toHaveBeenCalledWith(startContext)

    const endContext: RequestEndContext = { status: 200, endTime: 2, state: 'success' }
    onEnd(endContext)
    expect(endCallback).toHaveBeenCalledWith(endContext)
  })
})

import { createRequestTracker } from '../lib/request-tracker'

describe('Request Tracker', () => {
  it('should invoke start callbacks on onStart', () => {
    const requestTracker = createRequestTracker()
    const endCallback = jest.fn()
    const startCallback = jest.fn(() => endCallback)

    requestTracker.add(startCallback)
    expect(startCallback).not.toHaveBeenCalled()

    const context = { url: '/', method: 'GET', startTime: 1 }
    requestTracker.onStart(context)
    expect(startCallback).toHaveBeenCalledWith(context)
  })

  it('should invoke end callbacks on end', () => {
    const requestTracker = createRequestTracker()
    const endCallback = jest.fn()
    const startCallback = jest.fn(() => endCallback)

    requestTracker.add(startCallback)
    expect(startCallback).not.toHaveBeenCalled()

    const startContext = { url: '/', method: 'GET', startTime: 1 }
    const onEnd = requestTracker.onStart(startContext)
    expect(startCallback).toHaveBeenCalledWith(startContext)
    expect(endCallback).not.toHaveBeenCalled()

    const endContext = { status: 200, endTime: 2 }
    onEnd(endContext)
    expect(endCallback).toHaveBeenCalledWith(endContext)
  })
})

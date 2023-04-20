import EventEmitter from '../lib/event-emitter'

describe('Event Emitter', () => {
  let eventEmitter: EventEmitter<void>
  let subscriber: jest.Func
  let initialize: jest.Func
  let uninitialize: jest.Func

  beforeEach(() => {
    uninitialize = jest.fn()
    initialize = jest.fn(() => uninitialize)
    eventEmitter = new EventEmitter(initialize)
    subscriber = jest.fn()
  })

  it('should allow subscriptions', () => {
    eventEmitter.subscribe(subscriber)
    expect(subscriber).not.toHaveBeenCalled()

    eventEmitter.emit()
    expect(subscriber).toHaveBeenCalled()
  })

  it('should allow subscribers to unsubscribe', () => {
    const { unsubscribe } = eventEmitter.subscribe(subscriber)
    expect(subscriber).not.toHaveBeenCalled()

    eventEmitter.emit()
    expect(subscriber).toHaveBeenCalled()

    unsubscribe()
    eventEmitter.emit()
    expect(subscriber).toHaveBeenCalledTimes(1)
  })

  it('should call initialize on first subscribe', () => {
    expect(initialize).not.toHaveBeenCalled()
    eventEmitter.subscribe(subscriber)
    expect(initialize).toHaveBeenCalled()
  })

  it('should call uninitialize when there are no more subscribers', () => {
    const { unsubscribe } = eventEmitter.subscribe(subscriber)
    expect(subscriber).not.toHaveBeenCalled()

    eventEmitter.emit()
    expect(subscriber).toHaveBeenCalled()
    expect(uninitialize).not.toHaveBeenCalled()

    unsubscribe()
    expect(uninitialize).toHaveBeenCalled()
  })
})

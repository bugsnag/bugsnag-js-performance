import EventEmitter from '../lib/event-emitter'

describe('Event Emitter', () => {
  let eventEmitter: EventEmitter<void>
  let subscriber: jest.Func
  let initialise: jest.Func
  let uninitialise: jest.Func

  beforeEach(() => {
    uninitialise = jest.fn()
    initialise = jest.fn(() => uninitialise)
    eventEmitter = new EventEmitter(initialise)
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
    expect(initialise).not.toHaveBeenCalled()
    eventEmitter.subscribe(subscriber)
    expect(initialise).toHaveBeenCalled()
  })

  it('should call uninitialize when there are no more subscribers', () => {
    const { unsubscribe } = eventEmitter.subscribe(subscriber)
    expect(subscriber).not.toHaveBeenCalled()

    eventEmitter.emit()
    expect(subscriber).toHaveBeenCalled()
    expect(uninitialise).not.toHaveBeenCalled()

    unsubscribe()
    expect(uninitialise).toHaveBeenCalled()
  })
})

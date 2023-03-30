/**
 * @jest-environment jsdom
 */

import createBrowserBackgroundingListener from '../lib/backgrounding-listener'

// there are a few issues with using the real 'document' (e.g. visibilityState
// is readonly) so we stub it
class DocumentStub {
  readonly #eventListeners = new Map<string, () => void>()
  #visibilityState: 'visible' | 'hidden' = 'visible'

  get visibilityState () {
    return this.#visibilityState
  }

  set visibilityState (state: 'visible' | 'hidden') {
    this.#visibilityState = state

    const callback = this.#eventListeners.get('visibilitychange')

    if (callback) {
      callback()
    }
  }

  addEventListener (event: string, callback: () => void) {
    this.#eventListeners.set(event, callback)
  }
}

describe('Browser BackgroundingListener', () => {
  it('calls the registered callback with "in-foreground" when visibilityState changes to "visible"', () => {
    const documentStub = new DocumentStub()
    const onStateChangeCallback = jest.fn()

    const listener = createBrowserBackgroundingListener(documentStub)
    listener.onStateChange(onStateChangeCallback)

    expect(onStateChangeCallback).not.toHaveBeenCalled()

    documentStub.visibilityState = 'visible'

    expect(onStateChangeCallback).toHaveBeenCalledWith('in-foreground')
    expect(onStateChangeCallback).toHaveBeenCalledTimes(1)
  })

  it('calls the registered callback with "in-background" when visibilityState changes to "hidden"', () => {
    const documentStub = new DocumentStub()
    const onStateChangeCallback = jest.fn()

    const listener = createBrowserBackgroundingListener(documentStub)
    listener.onStateChange(onStateChangeCallback)

    expect(onStateChangeCallback).not.toHaveBeenCalled()

    documentStub.visibilityState = 'hidden'

    expect(onStateChangeCallback).toHaveBeenCalledWith('in-background')
    expect(onStateChangeCallback).toHaveBeenCalledTimes(1)
  })

  it('calls the registered callback immediately when visibilityState is "hidden" on registration', () => {
    const documentStub = new DocumentStub()
    const onStateChangeCallback = jest.fn()

    const listener = createBrowserBackgroundingListener(documentStub)

    documentStub.visibilityState = 'hidden'

    expect(onStateChangeCallback).not.toHaveBeenCalled()

    listener.onStateChange(onStateChangeCallback)

    expect(onStateChangeCallback).toHaveBeenCalledWith('in-background')
    expect(onStateChangeCallback).toHaveBeenCalledTimes(1)
  })
})

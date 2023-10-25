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

class WindowFake {
  readonly #eventListeners = new Map<string, () => void>()

  readonly document = new DocumentStub()

  addEventListener (event: string, callback: () => void) {
    this.#eventListeners.set(event, callback)
  }

  _hidePage () {
    const callback = this.#eventListeners.get('pagehide')

    if (callback) {
      callback()
    }
  }

  _showPage () {
    const callback = this.#eventListeners.get('pageshow')

    if (callback) {
      callback()
    }
  }
}

describe('Browser BackgroundingListener', () => {
  it('calls the registered callback immediately when visibilityState is "hidden" on registration', () => {
    const windowFake = new WindowFake()
    const onStateChangeCallback = jest.fn()

    const listener = createBrowserBackgroundingListener(windowFake)

    windowFake.document.visibilityState = 'hidden'

    expect(onStateChangeCallback).not.toHaveBeenCalled()

    listener.onStateChange(onStateChangeCallback)

    expect(onStateChangeCallback).toHaveBeenCalledWith('in-background')
    expect(onStateChangeCallback).toHaveBeenCalledTimes(1)
  })

  it('calls the registered callback with "in-background" when visibilityState changes to "hidden"', () => {
    const windowFake = new WindowFake()
    const onStateChangeCallback = jest.fn()

    const listener = createBrowserBackgroundingListener(windowFake)
    listener.onStateChange(onStateChangeCallback)

    expect(onStateChangeCallback).not.toHaveBeenCalled()

    windowFake.document.visibilityState = 'hidden'

    expect(onStateChangeCallback).toHaveBeenCalledWith('in-background')
    expect(onStateChangeCallback).toHaveBeenCalledTimes(1)
  })

  it('calls the registered callback with "in-foreground" when visibilityState changes to "visible"', () => {
    const windowFake = new WindowFake()
    const onStateChangeCallback = jest.fn()

    windowFake.document.visibilityState = 'hidden'
    const listener = createBrowserBackgroundingListener(windowFake)
    listener.onStateChange(onStateChangeCallback)

    expect(onStateChangeCallback).toHaveBeenCalledWith('in-background')
    expect(onStateChangeCallback).toHaveBeenCalledTimes(1)

    windowFake.document.visibilityState = 'visible'

    expect(onStateChangeCallback).toHaveBeenCalledWith('in-foreground')
    expect(onStateChangeCallback).toHaveBeenCalledTimes(2)
  })

  it('calls the registered callback with "in-background" on pagehide', () => {
    const windowFake = new WindowFake()
    const onStateChangeCallback = jest.fn()

    const listener = createBrowserBackgroundingListener(windowFake)
    listener.onStateChange(onStateChangeCallback)

    expect(onStateChangeCallback).not.toHaveBeenCalled()

    windowFake._hidePage()

    expect(onStateChangeCallback).toHaveBeenCalledWith('in-background')
    expect(onStateChangeCallback).toHaveBeenCalledTimes(1)
  })

  it('calls the registered callback with "in-foreground" on a pageshow', () => {
    const windowFake = new WindowFake()
    const onStateChangeCallback = jest.fn()

    const listener = createBrowserBackgroundingListener(windowFake)
    listener.onStateChange(onStateChangeCallback)

    expect(onStateChangeCallback).not.toHaveBeenCalled()

    windowFake._hidePage()

    expect(onStateChangeCallback).toHaveBeenCalledWith('in-background')
    expect(onStateChangeCallback).toHaveBeenCalledTimes(1)

    windowFake._showPage()
    expect(onStateChangeCallback).toHaveBeenCalledWith('in-foreground')
    expect(onStateChangeCallback).toHaveBeenCalledTimes(2)
  })

  it('does not call the registered callback with in-background if the page is already hidden', () => {
    const windowFake = new WindowFake()
    const onStateChangeCallback = jest.fn()

    windowFake.document.visibilityState = 'hidden'
    const listener = createBrowserBackgroundingListener(windowFake)
    listener.onStateChange(onStateChangeCallback)

    expect(onStateChangeCallback).toHaveBeenCalledWith('in-background')
    expect(onStateChangeCallback).toHaveBeenCalledTimes(1)

    windowFake.document.visibilityState = 'hidden'

    expect(onStateChangeCallback).toHaveBeenCalledTimes(1)

    windowFake._hidePage()

    expect(onStateChangeCallback).toHaveBeenCalledTimes(1)
  })

  it('does not call the registered callback with in-foreground when the page is already visible', () => {
    const windowFake = new WindowFake()
    const onStateChangeCallback = jest.fn()

    const listener = createBrowserBackgroundingListener(windowFake)
    listener.onStateChange(onStateChangeCallback)

    expect(onStateChangeCallback).not.toHaveBeenCalled()

    windowFake.document.visibilityState = 'visible'

    expect(onStateChangeCallback).not.toHaveBeenCalled()

    windowFake._showPage()

    expect(onStateChangeCallback).not.toHaveBeenCalled()
  })
})

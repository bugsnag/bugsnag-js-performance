// Mock XMLHttpRequest for React Native tests
class XMLHttpRequestFake {
  _listeners: { load: Array<() => void>, error: Array<() => void> }
  status: number | null

  constructor () {
    this._listeners = { load: [], error: [] }
    this.status = null
  }

  open (method: string, url: string | { toString: () => any }) {
  }

  send (fail: boolean, status: number | null = null) {
    if (fail) {
      this?._listeners.error.forEach(fn => { fn() })
    } else {
      this.status = status
      this?._listeners.load.forEach(fn => { fn() })
    }
  }

  addEventListener (evt: 'load' | 'error', listener: () => void) {
    this?._listeners[evt].push(listener)
  }

  removeEventListener (evt: 'load' | 'error', listener: () => void) {
    for (let i = this?._listeners?.[evt]?.length ?? 0 - 1; i >= 0; i--) {
      if (listener.name === this?._listeners?.[evt]?.[i]?.name) delete this?._listeners[evt][i]
    }
  }
}

global.XMLHttpRequest = XMLHttpRequestFake as unknown as typeof globalThis.XMLHttpRequest

// Trick the client into thinking it's not running in the remote debugger
// @ts-expect-error 'typeof globalThis' has no index signature
global.nativeCallSyncHook = () => {}

const RESPONSE_TIME = 100

const response = {
  status: 200,
  headers: new Headers({ 'Bugsnag-Sampling-Probability': '1.0' })
}

global.fetch = jest.fn().mockImplementation(() => new Promise((resolve) => {
  setTimeout(() => {
    resolve(response)
  }, RESPONSE_TIME)
}))

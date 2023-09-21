import { defaultNetworkRequestCallback, isNetworkRequestCallback } from '@bugsnag/request-tracker-performance'

describe('defaultNetworkRequestCallback', () => {
  it('returns an unmodified networkRequestInfo object', () => {
    const networkRequestInfo = {
      url: 'https://bugsnag.com/unit-test',
      type: 'fetch'
    } as const

    const response = defaultNetworkRequestCallback(networkRequestInfo)

    expect(response.url).toBe('https://bugsnag.com/unit-test')
    expect(response.type).toBe('fetch')
    expect(response).toBe(networkRequestInfo)
  })
})

describe('isNetworkRequestCallback', () => {
  it('returns true for the defaultNetworkRequestCallback', () => {
    const isValid = isNetworkRequestCallback(defaultNetworkRequestCallback)
    expect(isValid).toBe(true)
  })

  const invalidCallbacks = [
    { type: 'array', callback: [] },
    // eslint-disable-next-line compat/compat
    { type: 'bigint', callback: BigInt(9007199254740991) },
    { type: 'boolean', callback: true },
    { type: 'number', callback: 1234 },
    { type: 'null', callback: null },
    { type: 'object', callback: { foo: 'bar' } },
    { type: 'string', callback: 'string' },
    { type: 'symbol', callback: Symbol('unique symbol') },
    { type: 'undefined', callback: undefined }
  ]

  it.each(invalidCallbacks)('returns false for invalid callback ($type)', ({ callback }) => {
    const isValid = isNetworkRequestCallback(callback)
    expect(isValid).toBe(false)
  })
})

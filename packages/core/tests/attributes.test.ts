import { toJsonAttribute } from '../lib/attributes'

describe('toJsonAttribute', () => {
  it('converts a string into an OTEL compliant value', () => {
    const JSONAttribute = toJsonAttribute('test.string', 'string')
    expect(JSONAttribute).toStrictEqual({ key: 'test.string', value: { stringValue: 'string' } })
  })

  it('converts a number into an OTEL compliant value', () => {
    const JSONAttribute = toJsonAttribute('test.number', 12345)
    expect(JSONAttribute).toStrictEqual({ key: 'test.number', value: { doubleValue: 12345 } })
  })

  it('converts a double into an OTEL compliant value', () => {
    const JSONAttribute = toJsonAttribute('test.number', 123.45)
    expect(JSONAttribute).toStrictEqual({ key: 'test.number', value: { doubleValue: 123.45 } })
  })

  it('converts a boolean into an OTEL compliant value', () => {
    const JSONAttribute = toJsonAttribute('test.bool', false)
    expect(JSONAttribute).toStrictEqual({ key: 'test.bool', value: { boolValue: false } })
  })

  it('converts an unsupported value (object) into undefined', () => {
    // @ts-expect-error Argument is not assignable
    const JSONAttribute = toJsonAttribute('test.object', { key: 'test.key', value: 'a string' })
    expect(JSONAttribute).toBeUndefined()
  })

  it('converts an unsupported value (function) into undefined', () => {
    // @ts-expect-error Argument is not assignable
    const JSONAttribute = toJsonAttribute('test.function', () => 'string')
    expect(JSONAttribute).toBeUndefined()
  })
})

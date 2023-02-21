import { attributeToJson } from '../lib/attributes'

describe('attributeToJson', () => {
  it('converts a string into an OTEL compliant value', () => {
    const attribute = attributeToJson('test.string', 'string')
    expect(attribute).toStrictEqual({ key: 'test.string', value: { stringValue: 'string' } })
  })

  it('converts a number into an OTEL compliant value', () => {
    const attribute = attributeToJson('test.number', 12345)
    expect(attribute).toStrictEqual({ key: 'test.number', value: { doubleValue: 12345 } })
  })

  it('converts a double into an OTEL compliant value', () => {
    const attribute = attributeToJson('test.number', 123.45)
    expect(attribute).toStrictEqual({ key: 'test.number', value: { doubleValue: 123.45 } })
  })

  it('converts a boolean into an OTEL compliant value', () => {
    const attribute = attributeToJson('test.bool', false)
    expect(attribute).toStrictEqual({ key: 'test.bool', value: { boolValue: false } })
  })

  it('converts an unsupported value (object) into undefined', () => {
    // @ts-expect-error Argument is not assignable
    const attribute = attributeToJson('test.object', { key: 'test.key', value: 'a string' })
    expect(attribute).toBeUndefined()
  })

  it('converts an unsupported value (function) into undefined', () => {
    // @ts-expect-error Argument is not assignable
    const attribute = attributeToJson('test.function', () => 'string')
    expect(attribute).toBeUndefined()
  })

  it('converts an unsupported value (NaN) into undefined', () => {
    const attribute = attributeToJson('test.NaN', NaN)
    expect(attribute).toBeUndefined()
  })

  it('converts an unsupported value (Infinity) into undefined', () => {
    const attribute = attributeToJson('test.Infinity', Infinity)
    expect(attribute).toBeUndefined()
  })

  it('converts an unsupported value (-Infinity) into undefined', () => {
    const attribute = attributeToJson('test.-Infinity', -Infinity)
    expect(attribute).toBeUndefined()
  })
})

import { SpanAttributes, attributeToJson } from '../lib/attributes'

describe('SpanAttributes', () => {
  it('prevents adding span attributes with invalid values', () => {
    const attributes = new SpanAttributes(new Map())
    attributes.set('test.NaN', NaN)
    attributes.set('test.Infinity', Infinity)
    attributes.set('test.-Infinity', -Infinity)

    expect(attributes.toJson()).toStrictEqual([])
  })
})

describe('attributeToJson', () => {
  it('converts a string into an OTEL compliant value', () => {
    const attribute = attributeToJson('test.string', 'string')
    expect(attribute).toStrictEqual({ key: 'test.string', value: { stringValue: 'string' } })
  })

  it('converts an integer into an OTEL compliant value', () => {
    const attribute = attributeToJson('test.int', 12345)
    expect(attribute).toStrictEqual({ key: 'test.int', value: { intValue: '12345' } })
  })

  it('converts a double into an OTEL compliant value', () => {
    const attribute = attributeToJson('test.double', 123.45)
    expect(attribute).toStrictEqual({ key: 'test.double', value: { doubleValue: 123.45 } })
  })

  it('converts a boolean into an OTEL compliant value', () => {
    const attribute = attributeToJson('test.bool', false)
    expect(attribute).toStrictEqual({ key: 'test.bool', value: { boolValue: false } })
  })

  it('converts an array into an OTEL compliant value', () => {
    const attribute = attributeToJson('test.array', ['unit', 'test'])
    expect(attribute).toStrictEqual({ key: 'test.array', value: { arrayValue: { values: [{ stringValue: 'unit' }, { stringValue: 'test' }] } } })
  })

  it('converts an empty array into an OTEL compliant value', () => {
    const attribute = attributeToJson('test.array', [])
    expect(attribute).toStrictEqual({ key: 'test.array', value: { arrayValue: { } } })
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

import toJSONAttribute from '../lib/to-json-attribute'

describe('toJSONAttribute', () => {
  it('converts a string into an OTEL compliant value', () => {
    const JSONAttribute = toJSONAttribute('test.string', 'string')
    expect(JSONAttribute).toStrictEqual({ key: 'test.string', value: { stringValue: 'string' } })
  })

  it('converts a number into an OTEL compliant value', () => {
    const JSONAttribute = toJSONAttribute('test.number', 12345)
    expect(JSONAttribute).toStrictEqual({ key: 'test.number', value: { doubleValue: 12345 } })
  })

  it('converts a boolean into an OTEL compliant value', () => {
    const JSONAttribute = toJSONAttribute('test.bool', false)
    expect(JSONAttribute).toStrictEqual({ key: 'test.bool', value: { boolValue: false } })
  })
})

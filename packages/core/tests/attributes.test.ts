import { SpanAttributes, attributeToJson } from '../lib/attributes'
import { defaultSpanAttributeLimits } from '../lib/custom-attribute-limits'

describe('SpanAttributes', () => {
  it('prevents adding span attributes with invalid values', () => {
    const attributes = new SpanAttributes(new Map(), defaultSpanAttributeLimits, 'test.span', console)
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

  it('converts a string array into an OTEL compliant value', () => {
    const attribute = attributeToJson('test.array', ['unit', 'test'])
    expect(attribute).toStrictEqual({ key: 'test.array', value: { arrayValue: { values: [{ stringValue: 'unit' }, { stringValue: 'test' }] } } })
  })

  it('converts an integer array into an OTEL compliant value', () => {
    const attribute = attributeToJson('test.array', [1, 2])
    expect(attribute).toStrictEqual({ key: 'test.array', value: { arrayValue: { values: [{ intValue: '1' }, { intValue: '2' }] } } })
  })

  it('converts a double array into an OTEL compliant value', () => {
    const attribute = attributeToJson('test.array', [1.2, 3.4])
    expect(attribute).toStrictEqual({ key: 'test.array', value: { arrayValue: { values: [{ doubleValue: 1.2 }, { doubleValue: 3.4 }] } } })
  })

  it('converts a boolean array into an OTEL compliant value', () => {
    const attribute = attributeToJson('test.array', [true, false])
    expect(attribute).toStrictEqual({ key: 'test.array', value: { arrayValue: { values: [{ boolValue: true }, { boolValue: false }] } } })
  })

  it('converts a mixed array into an OTEL compliant value', () => {
    // @ts-expect-error Typescript will try to enforce a single array type
    const attribute = attributeToJson('test.mixed.array', ['one', 2, 3.4, true])
    expect(attribute).toStrictEqual({ key: 'test.mixed.array', value: { arrayValue: { values: [{ stringValue: 'one' }, { intValue: '2' }, { doubleValue: 3.4 }, { boolValue: true }] } } })
  })

  it('converts an invalid array into an OTEL compliant value', () => {
    // @ts-expect-error Invalid values will be removed
    const attribute = attributeToJson('test.invalid.array', [() => null, [], {}, NaN, Symbol('i will go')])
    expect(attribute).toStrictEqual({ key: 'test.invalid.array', value: { arrayValue: { } } })
  })

  it('converts an empty array into an OTEL compliant value', () => {
    const attribute = attributeToJson('test.empty.array', [])
    expect(attribute).toStrictEqual({ key: 'test.empty.array', value: { arrayValue: { } } })
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

describe('attribute validation', () => {
  const jestLogger = { warn: jest.fn(), error: jest.fn(), debug: jest.fn(), info: jest.fn() }
  let attributes: SpanAttributes

  beforeEach(() => {
    jestLogger.warn.mockClear()
    attributes = new SpanAttributes(new Map(), { attributeArrayLengthLimit: 5, attributeCountLimit: 5, attributeStringValueLimit: 20 }, 'test.span', jestLogger)
  })

  it('prevents adding an attribute with a key that exceeds the limit', () => {
    const attributeKey = 'a'.repeat(256)
    attributes.set(attributeKey, 'value')
    expect(attributes.toJson()).toStrictEqual([])
    expect(jestLogger.warn).toHaveBeenCalledWith(`Span attribute ${attributeKey} in span test.span was dropped as the key length exceeds the 128 character fixed limit.`)
    expect(attributes.droppedAttributesCount).toBe(1)
  })

  it('truncates an attribute with a string value that exceeds the limit', () => {
    const attributeValue = 'a'.repeat(256)
    attributes.set('test.string', attributeValue)
    expect(attributes.toJson()).toStrictEqual([{ key: 'test.string', value: { stringValue: 'a'.repeat(20) + ' *** 236 CHARS TRUNCATED' } }])
    expect(jestLogger.warn).toHaveBeenCalledWith('Span attribute test.string in span test.span was truncated as the string exceeds the 20 character limit set by attributeStringValueLimit.')
    expect(attributes.droppedAttributesCount).toBe(0)
  })

  it('prevents adding an attribute with an array value that exceeds the limit', () => {
    attributes.set('test.array', Array.from({ length: 10 }, (_, i) => i))
    expect(attributes.toJson()).toStrictEqual([{
      key: 'test.array',
      value: { arrayValue: { values: Array.from({ length: 5 }, (_, i) => ({ intValue: i.toString() })) } }
    }])
    expect(jestLogger.warn).toHaveBeenCalledWith('Span attribute test.array in span test.span was truncated as the array exceeds the 5 element limit set by attributeArrayLengthLimit.')
    expect(attributes.droppedAttributesCount).toBe(0)
  })

  it('prevents adding an attribute when the count limit is reached', () => {
    attributes.set('test.1', 'value')
    attributes.set('test.2', 'value')
    attributes.set('test.3', 'value')
    attributes.set('test.4', 'value')
    attributes.set('test.5', 'value')

    // New attribute should be discarded
    attributes.set('test.6', 'value')
    expect(jestLogger.warn).toHaveBeenCalledWith('Span attribute test.6 in span test.span was dropped as the number of attributes exceeds the 5 attribute limit set by attributeCountLimit.')
    expect(jestLogger.warn).toHaveBeenCalledTimes(1)
    expect(attributes.droppedAttributesCount).toBe(1)
    expect(attributes.toJson()).toStrictEqual([
      { key: 'test.1', value: { stringValue: 'value' } },
      { key: 'test.2', value: { stringValue: 'value' } },
      { key: 'test.3', value: { stringValue: 'value' } },
      { key: 'test.4', value: { stringValue: 'value' } },
      { key: 'test.5', value: { stringValue: 'value' } }
    ])

    // Existing attribute can be updated when at the attribute limit
    attributes.set('test.5', 'new-value')
    expect(jestLogger.warn).toHaveBeenCalledTimes(1)
    expect(jestLogger.warn).not.toHaveBeenCalledWith('Span attribute test.5 in span test.span was dropped as the number of attributes exceeds the 5 attribute limit set by attributeCountLimit.')
    expect(attributes.droppedAttributesCount).toBe(1)
    expect(attributes.toJson()).toStrictEqual([
      { key: 'test.1', value: { stringValue: 'value' } },
      { key: 'test.2', value: { stringValue: 'value' } },
      { key: 'test.3', value: { stringValue: 'value' } },
      { key: 'test.4', value: { stringValue: 'value' } },
      { key: 'test.5', value: { stringValue: 'new-value' } }
    ])

    // New attributes can be added after removing an existing attribute
    attributes.remove('test.5')
    attributes.set('test.7', 'value')
    expect(jestLogger.warn).toHaveBeenCalledTimes(1)
    expect(attributes.droppedAttributesCount).toBe(1)
    expect(attributes.toJson()).toStrictEqual([
      { key: 'test.1', value: { stringValue: 'value' } },
      { key: 'test.2', value: { stringValue: 'value' } },
      { key: 'test.3', value: { stringValue: 'value' } },
      { key: 'test.4', value: { stringValue: 'value' } },
      { key: 'test.7', value: { stringValue: 'value' } }
    ])
  })
})

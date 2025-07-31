import { SpanAttributes, ResourceAttributes, attributeToJson } from '../lib/attributes'
import { defaultSpanAttributeLimits } from '../lib/custom-attribute-limits'

describe('SpanAttributes', () => {
  describe('set()', () => {
    const jestLogger = { warn: jest.fn(), error: jest.fn(), debug: jest.fn(), info: jest.fn() }
    let attributes: SpanAttributes

    beforeEach(() => {
      jestLogger.warn.mockClear()
      attributes = new SpanAttributes(new Map(), defaultSpanAttributeLimits, 'test.span', jestLogger)
    })

    it('allows setting valid attributes with set()', () => {
      attributes.set('internal.string', 'value')
      attributes.set('internal.number', 42)
      attributes.set('internal.boolean', true)
      attributes.set('internal.array', ['a', 'b'])

      const result = attributes.toObject()
      expect(result).toEqual({
        'internal.string': 'value',
        'internal.number': 42,
        'internal.boolean': true,
        'internal.array': ['a', 'b']
      })
    })

    it('prevents adding span attributes with invalid values', () => {
      const attributes = new SpanAttributes(new Map(), defaultSpanAttributeLimits, 'test.span', console)
      attributes.set('test.NaN', NaN)
      attributes.set('test.Infinity', Infinity)
      attributes.set('test.-Infinity', -Infinity)

      expect(attributes.toJson()).toStrictEqual([])
    })

    it('removes the attribute when value is null', () => {
      attributes.set('test.key', 'initial-value')
      expect(attributes.toObject()['test.key']).toBe('initial-value')

      attributes.set('test.key', null)
      expect(attributes.toObject()).not.toHaveProperty('test.key')
    })

    it('ignores setting an attribute with an empty key', () => {
      attributes.set('', 'value')
      expect(attributes.toJson()).toStrictEqual([])
    })

    it('ignores setting an attribute with an undefined value', () => {
      // @ts-expect-error Testing undefined value
      attributes.set('test.undefined', undefined)
      expect(attributes.toJson()).toStrictEqual([])
    })

    it('does not enforce attribute count limits with set() (internal use)', () => {
      const limitedAttributes = new SpanAttributes(
        new Map(),
        { attributeArrayLengthLimit: 5, attributeCountLimit: 2, attributeStringValueLimit: 20 },
        'test.span',
        jestLogger
      )

      // set() should allow exceeding limits for internal attributes
      limitedAttributes.set('internal.1', 'value1')
      limitedAttributes.set('internal.2', 'value2')
      limitedAttributes.set('internal.3', 'value3') // Exceeds limit

      const result = limitedAttributes.toObject()
      expect(Object.keys(result)).toHaveLength(3)
      expect(jestLogger.warn).not.toHaveBeenCalled()
    })
  })

  describe('setCustom', () => {
    const jestLogger = { warn: jest.fn(), error: jest.fn(), debug: jest.fn(), info: jest.fn() }
    let attributes: SpanAttributes

    beforeEach(() => {
      jestLogger.warn.mockClear()
      attributes = new SpanAttributes(new Map(), { attributeArrayLengthLimit: 5, attributeCountLimit: 5, attributeStringValueLimit: 20 }, 'test.span', jestLogger)
    })

    it('allows setting valid attributes with set()', () => {
      attributes.setCustom('custom.string', 'value')
      attributes.setCustom('custom.number', 42)
      attributes.setCustom('custom.boolean', true)
      attributes.setCustom('custom.array', ['a', 'b'])

      expect(attributes.toJson()).toStrictEqual([
        { key: 'custom.string', value: { stringValue: 'value' } },
        { key: 'custom.number', value: { intValue: '42' } },
        { key: 'custom.boolean', value: { boolValue: true } },
        { key: 'custom.array', value: { arrayValue: { values: [{ stringValue: 'a' }, { stringValue: 'b' }] } } }
      ])
    })

    it('prevents adding span attributes with invalid values', () => {
      const attributes = new SpanAttributes(new Map(), defaultSpanAttributeLimits, 'test.span', console)
      attributes.setCustom('test.NaN', NaN)
      attributes.setCustom('test.Infinity', Infinity)
      attributes.setCustom('test.-Infinity', -Infinity)

      expect(attributes.toJson()).toStrictEqual([])
    })

    it('prevents adding an attribute with a key that exceeds the limit', () => {
      const attributeKey = 'a'.repeat(256)
      attributes.setCustom(attributeKey, 'value')
      expect(attributes.toJson()).toStrictEqual([])
      expect(jestLogger.warn).toHaveBeenCalledWith(`Span attribute ${attributeKey} in span test.span was dropped as the key length exceeds the 128 character fixed limit.`)
      expect(attributes.droppedAttributesCount).toBe(1)
    })

    it('prevents adding an attribute when the count limit is reached', () => {
      attributes.setCustom('test.1', 'value')
      attributes.setCustom('test.2', 'value')
      attributes.setCustom('test.3', 'value')
      attributes.setCustom('test.4', 'value')
      attributes.setCustom('test.5', 'value')

      // New attribute should be discarded
      attributes.setCustom('test.6', 'value')
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
      attributes.setCustom('test.5', 'new-value')
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
      attributes.setCustom('test.7', 'value')
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

    it('removes the attribute when value is null', () => {
      attributes.setCustom('test.key', 'initial-value')
      expect(attributes.toObject()['test.key']).toBe('initial-value')

      attributes.setCustom('test.key', null)
      expect(attributes.toObject()).not.toHaveProperty('test.key')
    })

    it('ignores setting an attribute with an empty key', () => {
      attributes.setCustom('', 'value')
      expect(attributes.toJson()).toStrictEqual([])
    })

    it('ignores setting an attribute with an undefined value', () => {
      // @ts-expect-error Testing undefined value
      attributes.setCustom('test.undefined', undefined)
      expect(attributes.toJson()).toStrictEqual([])
    })
  })

  describe('toJson()', () => {
    const jestLogger = { warn: jest.fn(), error: jest.fn(), debug: jest.fn(), info: jest.fn() }
    let attributes: SpanAttributes

    beforeEach(() => {
      jestLogger.warn.mockClear()
      attributes = new SpanAttributes(new Map(), { attributeArrayLengthLimit: 5, attributeCountLimit: 5, attributeStringValueLimit: 20 }, 'test.span', jestLogger)
    })

    it('truncates an attribute with a string value that exceeds the limit', () => {
      const attributeValue = 'a'.repeat(256)
      attributes.setCustom('test.string', attributeValue)
      expect(attributes.toJson()).toStrictEqual([{ key: 'test.string', value: { stringValue: 'a'.repeat(20) + ' *** 236 CHARS TRUNCATED' } }])
      expect(jestLogger.warn).toHaveBeenCalledWith('Span attribute test.string in span test.span was truncated as the string exceeds the 20 character limit set by attributeStringValueLimit.')
      expect(attributes.droppedAttributesCount).toBe(0)
    })

    it('truncates an attribute with an array value that exceeds the limit', () => {
      attributes.setCustom('test.array', Array.from({ length: 10 }, (_, i) => i))
      expect(attributes.toJson()).toStrictEqual([{
        key: 'test.array',
        value: { arrayValue: { values: Array.from({ length: 5 }, (_, i) => ({ intValue: i.toString() })) } }
      }])
      expect(jestLogger.warn).toHaveBeenCalledWith('Span attribute test.array in span test.span was truncated as the array exceeds the 5 element limit set by attributeArrayLengthLimit.')
      expect(attributes.droppedAttributesCount).toBe(0)
    })
  })

  describe('toObject()', () => {
    let attributes: SpanAttributes

    beforeEach(() => {
      attributes = new SpanAttributes(new Map(), defaultSpanAttributeLimits, 'test.span', console)
    })

    it('returns an empty object when no attributes are set', () => {
      expect(attributes.toObject()).toEqual({})
    })

    it('returns all attributes as a plain object', () => {
      attributes.set('string.attr', 'value')
      attributes.set('number.attr', 123)
      attributes.set('boolean.attr', false)
      attributes.set('array.attr', [1, 2, 3])

      const result = attributes.toObject()
      expect(result).toEqual({
        'string.attr': 'value',
        'number.attr': 123,
        'boolean.attr': false,
        'array.attr': [1, 2, 3]
      })
    })

    it('returns a snapshot that does not affect the internal attributes', () => {
      attributes.set('test.key', 'original')
      const obj1 = attributes.toObject()

      // Modify the returned object
      obj1['test.key'] = 'modified'
      obj1['new.key'] = 'added'

      // Original attributes should be unchanged
      const obj2 = attributes.toObject()
      expect(obj2).toEqual({ 'test.key': 'original' })
      expect(obj2).not.toHaveProperty('new.key')
    })

    it('preserves attribute types correctly', () => {
      attributes.set('zero', 0)
      attributes.set('false', false)
      attributes.set('empty.string', '')
      attributes.set('empty.array', [])

      const result = attributes.toObject()
      expect(result.zero).toBe(0)
      expect(result.false).toBe(false)
      expect(result['empty.string']).toBe('')
      expect(result['empty.array']).toEqual([])
    })
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

  it('always converts bugsnag.sampling.p as doubleValue even for integers', () => {
    // Regular integer should be intValue
    const regularInt = attributeToJson('regular.int', 1)
    expect(regularInt).toEqual({
      key: 'regular.int',
      value: { intValue: '1' }
    })

    // bugsnag.sampling.p should always be doubleValue
    const samplingP = attributeToJson('bugsnag.sampling.p', 1)
    expect(samplingP).toEqual({
      key: 'bugsnag.sampling.p',
      value: { doubleValue: 1 }
    })
  })
})

describe('ResourceAttributes', () => {
  const jestLogger = { warn: jest.fn(), error: jest.fn(), debug: jest.fn(), info: jest.fn() }

  beforeEach(() => {
    jestLogger.warn.mockClear()
  })

  it('creates resource attributes with all required fields', () => {
    const resourceAttributes = new ResourceAttributes('production', '1.2.3', 'my-service', 'bugsnag-js-performance', '2.0.0', jestLogger)

    const attributes = resourceAttributes.toObject()
    expect(attributes).toEqual({
      'deployment.environment': 'production',
      'telemetry.sdk.name': 'bugsnag-js-performance',
      'telemetry.sdk.version': '2.0.0',
      'service.name': 'my-service',
      'service.version': '1.2.3'
    })
  })

  it('creates resource attributes without service.version when appVersion is empty', () => {
    const resourceAttributes = new ResourceAttributes('staging', '', 'my-service', 'bugsnag-js-performance', '2.0.0', jestLogger)

    const attributes = resourceAttributes.toObject()
    expect(attributes).toEqual({
      'deployment.environment': 'staging',
      'telemetry.sdk.name': 'bugsnag-js-performance',
      'telemetry.sdk.version': '2.0.0',
      'service.name': 'my-service'
    })
    expect(attributes).not.toHaveProperty('service.version')
  })
})

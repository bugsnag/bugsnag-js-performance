import type { Span } from '../lib'
import * as validation from '../lib/validation'

describe('validation', () => {
  const nonObjects: Array<{ type: string, value: any }> = [
    { type: 'bigint', value: BigInt(9007199254740991) },
    { type: 'boolean', value: true },
    { type: 'empty string', value: '' },
    { type: 'string', value: 'hello' },
    { type: 'function', value: () => {} },
    { type: 'number', value: 12345 },
    { type: 'array', value: [] },
    { type: 'symbol', value: Symbol('test') },
    { type: 'null', value: null },
    { type: 'NaN', value: NaN },
    { type: 'Infinity', value: Infinity },
    { type: '-Infinity', value: -Infinity },
    { type: 'undefined', value: undefined },
    { type: 'class', value: class { a () {} } }
  ]

  const nonStrings = nonObjects.filter(({ value }) => typeof value !== 'string')

  describe('isObject', () => {
    it.each(nonObjects)('fails validation with $type', ({ value, type }) => {
      expect(validation.isObject(value)).toBe(false)
    })

    it('passes validation with an empty object', () => {
      expect(validation.isObject({})).toBe(true)
    })

    it('passes validation with an object with properties', () => {
      const object = { a: 1, b: 2, c: { d: 4, e: 5 } }

      expect(validation.isObject(object)).toBe(true)
    })

    it('passes validation with an instance', () => {
      const Abc = class { a () {} }

      expect(validation.isObject(new Abc())).toBe(true)
    })
  })

  describe('isString', () => {
    it.each(nonStrings)('fails validation with $type', ({ value, type }) => {
      expect(validation.isString(value)).toBe(false)
    })

    it('passes validation with an empty string', () => {
      expect(validation.isString('')).toBe(true)
    })

    it('passes validation with a non-empty string', () => {
      expect(validation.isString('hi')).toBe(true)
    })
  })

  describe('isStringWithLength', () => {
    it.each(nonStrings.concat([
      { type: 'empty string', value: '' }
    ]))('fails validation with $type', ({ value, type }) => {
      expect(validation.isStringWithLength(value)).toBe(false)
    })

    it('passes validation with a 1 character string', () => {
      expect(validation.isString('a')).toBe(true)
    })

    it('passes validation with a long string', () => {
      expect(validation.isString('hello '.repeat(1024))).toBe(true)
    })
  })

  describe('isStringArray', () => {
    it.each([
      ...nonObjects.filter(({ type }) => type !== 'array'),
      ...nonStrings.map(({ type, value }) => ({ type: `array of ${type}`, value: [value] }))
    ])('fails validation with $type', ({ value, type }) => {
      expect(validation.isStringArray(value)).toBe(false)
    })

    it('passes validation with an array of strings', () => {
      expect(validation.isStringArray(['production', 'development'])).toBe(true)
    })

    it('passes validation with an empty array', () => {
      expect(validation.isStringArray([])).toBe(true)
    })
  })

  describe('isLogger', () => {
    it.each(nonObjects.concat([
      { type: 'empty object', value: {} },
      { type: 'object with some properties', value: { a: 1, b: 2 } },
      {
        type: 'object with subset of keys',
        value: { debug: jest.fn(), info: jest.fn(), warn: jest.fn() }
      },
      {
        type: 'object with the right keys but not functions',
        value: { debug: 1, info: 2, warn: 3, error: 4 }
      }
    ]))('fails validation with $type', ({ value, type }) => {
      expect(validation.isLogger(value)).toBe(false)
    })

    it('passes validation with a valid logger object', () => {
      const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() }

      expect(validation.isLogger(logger)).toBe(true)
    })

    it('passes validation with a valid logger class instance', () => {
      const Logger = class {
        debug () {}
        info () {}
        warn () {}
        error () {}
      }

      expect(validation.isLogger(new Logger())).toBe(true)
    })

    it('passes validation with the console object', () => {
      expect(validation.isLogger(console)).toBe(true)
    })
  })

  describe('isPersistedProbability', () => {
    it('passes with valid PersistedProbabilty type', () => {
      const probability = {
        value: 1234,
        time: 5678
      }

      expect(validation.isPersistedProbability(probability)).toBe(true)
    })

    it.each(nonObjects)('fails validation with $type', (value) => {
      expect(validation.isPersistedProbability(value)).toBe(false)
    })

    it.each([
      { value: 'not a number', time: 1234 },
      { value: 1234, time: 'not a number' },
      { value: 'not a number', time: 'also not a number' },
      { value: 1234 },
      { time: 1234 }
    ])('fails validation with %s', (value) => {
      expect(validation.isPersistedProbability(value)).toBe(false)
    })
  })

  describe('isNumber', () => {
    it.each([-1, 0, 1, 10000, new Date().getTime(), performance.now()])('passes validation with %s', (value) => {
      expect(validation.isNumber(value)).toBe(true)
    })

    it.each(['', 'string', true, false, undefined, null, NaN, Infinity, -Infinity, () => {}, [], {}, new Date()])('fails validation with %s', (value) => {
      expect(validation.isNumber(value)).toBe(false)
    })
  })

  describe('isBoolean', () => {
    const nonBooleans = nonObjects.filter(({ value }) => typeof value !== 'boolean')

    it.each(nonBooleans)('fails validation with $type', ({ value }) => {
      expect(validation.isBoolean(value)).toBe(false)
    })

    it.each([true, false])('passes validation with %s', value => {
      expect(validation.isBoolean(value)).toBe(true)
    })
  })

  describe('isSpanContext', () => {
    it.each(nonObjects)('fails validation with $type', ({ value }) => {
      expect(validation.isSpanContext(value)).toBe(false)
    })

    const invalidSpanContexts: any[] = [
      { id: 1234, traceId: '5678', isValid: () => true, samplingRate: 12345, samplingProbability: 1 },
      { id: '1234', traceId: 5678, isValid: () => true, samplingRate: 12345, samplingProbability: 1 },
      { id: '1234', traceId: '5678', isValid: true, samplingRate: 12345, samplingProbability: 1 },
      { id: '1234', traceId: '5678', isValid: () => true, samplingRate: '12345' },
      { id: '1234', traceId: '5678', isValid: true, samplingRate: 12345, samplingProbability: '1' }
    ]

    it.each(invalidSpanContexts)('fails validation with %s', (value) => {
      expect(validation.isSpanContext(value)).toBe(false)
    })

    it('passes with valid SpanContext type', () => {
      const spanContext = {
        id: '1234',
        traceId: '5678',
        samplingRate: 12345,
        samplingProbability: 1,
        isValid: () => true
      }

      expect(validation.isSpanContext(spanContext)).toBe(true)

      spanContext.isValid = () => false
      expect(validation.isSpanContext(spanContext)).toBe(true)
    })
  })

  describe('isParentContext', () => {
    it.each(nonObjects)('fails validation with $type', ({ value }) => {
      expect(validation.isParentContext(value)).toBe(false)
    })

    const invalidParentContexts: any[] = [
      { id: 1234, traceId: '5678' },
      { id: '1234', traceId: 5678 },
      { id: 1234, traceId: 5678 }
    ]

    it.each(invalidParentContexts)('fails validation with %s', (value) => {
      expect(validation.isParentContext(value)).toBe(false)
    })

    it('passes with valid ParentContext type', () => {
      const parentContext = {
        id: '1234',
        traceId: '5678'
      }

      expect(validation.isParentContext(parentContext)).toBe(true)
    })
  })

  describe('isTime', () => {
    it.each([-1, 0, 1, 10000, new Date().getTime(), performance.now(), new Date()])('passes validation with %s', (value) => {
      expect(validation.isTime(value)).toBe(true)
    })

    it.each(['', 'string', true, false, undefined, null, NaN, Infinity, -Infinity, () => {}, [], {}])('fails validation with %s', (value) => {
      expect(validation.isTime(value)).toBe(false)
    })
  })

  describe('isPlugin', () => {
    const validPlugins = [
      { install: jest.fn(), start: jest.fn() },
      { install: jest.fn(), start: jest.fn(), additional: jest.fn() }
    ]

    it.each(validPlugins)('passes validation with %s', (value) => {
      expect(validation.isPlugin(value)).toBe(true)
    })

    it.each(nonObjects)('fails validation with %s', (value) => {
      expect(validation.isPlugin(value)).toBe(false)
    })
  })

  describe('isCallbackArray', () => {
    const validCallbacks: any[] = [
      [[]],
      [[() => {}]],
      [[() => {}, () => {}]],
      [[(span: Span) => { console.log(span) }]]
    ]

    it.each(validCallbacks)('passes validation with array of callbacks', (value) => {
      expect(validation.isCallbackArray(value)).toBe(true)
    })

    const invalidCallbacks = [
      ...nonObjects,
      { callback: () => {} },
      [1, 2, 3],
      ['string'],
      [() => {}, 'not a function'],
      [null],
      [undefined],
      [{}]
    ]

    it.each(invalidCallbacks)('fails validation with %s', (value) => {
      expect(validation.isCallbackArray(value)).toBe(false)
    })
  })
})

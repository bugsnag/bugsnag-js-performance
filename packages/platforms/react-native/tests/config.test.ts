import { createSchema } from '../lib/config'

const stringValidation = [
  { expected: false, value: true },
  { expected: false, value: false },
  { expected: false, value: undefined },
  { expected: false, value: null },
  { expected: false, value: 123 },
  { expected: false, value: BigInt(9007199254740991) },
  { expected: false, value: () => 123 },
  { expected: false, value: '' },
  { expected: false, value: /a/ },
  { expected: false, value: {} },
  { expected: false, value: { a: 1, b: 2 } },
  { expected: false, value: [] },
  { expected: false, value: [[]] },
  { expected: false, value: [['a']] },
  { expected: false, value: ['a', /b/, 1] },
  { expected: false, value: Symbol('test') },
  { expected: true, value: 'string' }
]

const booleanValidation = [
  { expected: true, value: true },
  { expected: true, value: false },
  { expected: false, value: undefined },
  { expected: false, value: null },
  { expected: false, value: 123 },
  { expected: false, value: BigInt(9007199254740991) },
  { expected: false, value: () => 123 },
  { expected: false, value: '' },
  { expected: false, value: /a/ },
  { expected: false, value: {} },
  { expected: false, value: { a: 1, b: 2 } },
  { expected: false, value: [] },
  { expected: false, value: [[]] },
  { expected: false, value: [['a']] },
  { expected: false, value: ['a', /b/, 1] },
  { expected: false, value: Symbol('test') },
  { expected: false, value: 'string' }
]

describe('ReactNativeSchema', () => {
  const schema = createSchema()

  describe('codeBundleId', () => {
    it('defaults to an empty string', () => {
      expect(schema.codeBundleId.defaultValue).toBe('')
    })

    describe('.validate()', () => {
      it.each(stringValidation)('returns $expected for the value $value', ({ expected, value }) => {
        const schema = createSchema()
        const validate = schema.codeBundleId.validate
        expect(validate(value)).toBe(expected)
      })
    })
  })

  describe('autoInstrumentAppStarts', () => {
    it('defaults to true', () => {
      expect(schema.autoInstrumentAppStarts.defaultValue).toBe(true)
    })

    describe('.validate()', () => {
      it.each(booleanValidation)('returns $expected for the value $value', ({ expected, value }) => {
        const schema = createSchema()
        const validate = schema.autoInstrumentAppStarts.validate
        expect(validate(value)).toBe(expected)
      })
    })
  })

  describe('wrapperComponentProvider', () => {
    it('defaults to null', () => {
      expect(schema.wrapperComponentProvider.defaultValue).toBe(null)
    })

    const functionOrNullValidation = [
      { expected: true, value: () => 123 },
      { expected: true, value: null },
      { expected: false, value: undefined },
      { expected: false, value: true },
      { expected: false, value: false },
      { expected: false, value: 123 },
      { expected: false, value: BigInt(9007199254740991) },
      { expected: false, value: '' },
      { expected: false, value: /a/ },
      { expected: false, value: {} },
      { expected: false, value: { a: 1, b: 2 } },
      { expected: false, value: [] },
      { expected: false, value: [[]] },
      { expected: false, value: [['a']] },
      { expected: false, value: ['a', /b/, 1] },
      { expected: false, value: Symbol('test') },
      { expected: false, value: 'string' }
    ]

    describe('.validate()', () => {
      it.each(functionOrNullValidation)('returns $expected for the value $value', ({ expected, value }) => {
        const schema = createSchema()
        const validate = schema.wrapperComponentProvider.validate
        expect(validate(value)).toBe(expected)
      })
    })
  })

  describe('tracePropagationUrls', () => {
    it('defaults to an empty array', () => {
      const schema = createSchema()

      expect(schema.tracePropagationUrls.defaultValue).toStrictEqual([])
    })

    it.each([
      [false, 123],
      [false, false],
      [false, null],
      [false, undefined],
      [false, ''],
      [false, 'a'],
      [false, /a/],
      [false, {}],
      [false, { a: 1, b: 2 }],
      [false, [[]]],
      [false, [['a']]],
      [false, ['a', /b/, 1]],

      [true, []],
      [true, ['a']],
      [true, [/a/]],
      [true, ['a', 'b', 'c']],
      [true, [/a/, /b/, /c/]],
      [true, ['a', /b/, 'c']]
    ])('returns %s from validation for the value %p', (expected, value) => {
      const schema = createSchema()
      const validate = schema.tracePropagationUrls.validate

      expect(validate(value)).toBe(expected)
    })
  })
})

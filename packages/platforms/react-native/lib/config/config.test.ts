import { createSchema } from './config'

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

describe('ReactNativeSchema', () => {
  const schema = createSchema()

  describe('appName', () => {
    it('defaults to an empty string', () => {
      expect(schema.appName.defaultValue).toBe('')
    })

    describe('.validate()', () => {
      it.each(stringValidation)('returns $expected for the value $value', ({ expected, value }) => {
        const schema = createSchema()
        const validate = schema.appName.validate
        expect(validate(value)).toBe(expected)
      })
    })
  })

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
})

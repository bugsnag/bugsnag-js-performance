import { createSchema } from './config'

const stringValidation = [
  { expected: false, value: 123 },
  { expected: false, value: false },
  { expected: false, value: null },
  { expected: false, value: undefined },
  { expected: false, value: '' },
  { expected: false, value: /a/ },
  { expected: false, value: {} },
  { expected: false, value: { a: 1, b: 2 } },
  { expected: false, value: [[]] },
  { expected: false, value: [['a']] },
  { expected: false, value: ['a', /b/, 1] },
  { expected: false, value: [] },
  { expected: false, value: ['a'] },
  { expected: false, value: [/a/] },
  { expected: false, value: ['a', 'b', 'c'] },
  { expected: false, value: [/a/, /b/, /c/] },
  { expected: false, value: ['a', /b/, 'c'] },
  { expected: true, value: 'a' }
]

describe('ReactNativeSchema', () => {
  const schema = createSchema()

  describe('appName', () => {
    it('defaults to an empty string', () => {
      expect(schema.appName.defaultValue).toBe('')
    })

    it.each(stringValidation)('returns $expected from validation for the value $value', ({ expected, value }) => {
      const schema = createSchema()
      const validate = schema.appName.validate
      expect(validate(value)).toBe(expected)
    })
  })

  describe('codeBundleId', () => {
    it('defaults to an empty string', () => {
      expect(schema.codeBundleId.defaultValue).toBe('')
    })

    it.each(stringValidation)('returns $expected from validation for the value $value', ({ expected, value }) => {
      const schema = createSchema()
      const validate = schema.codeBundleId.validate
      expect(validate(value)).toBe(expected)
    })
  })
})

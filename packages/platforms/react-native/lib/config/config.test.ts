import { createSchema } from './config'

describe('ReactNativeSchema', () => {
  const schema = createSchema()

  describe('appName', () => {
    it('defaults to an empty string', () => {
      expect(schema.appName.defaultValue).toBe('')
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
      const validate = schema.appName.validate
      expect(validate(value)).toBe(expected)
    })
  })

  describe('codeBundleId', () => {
    it('defaults to an empty string', () => {
      expect(schema.codeBundleId.defaultValue).toBe('')
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
      const validate = schema.codeBundleId.validate
      expect(validate(value)).toBe(expected)
    })
  })
})

/**
 * @jest-environment jsdom
 */

import { createSchema } from '../lib/config'
import MockRoutingProvider from './utilities/mock-routing-provider'

describe('createSchema', () => {
  describe('settleIgnoreUrls', () => {
    it('defaults to an empty array', () => {
      const schema = createSchema(new MockRoutingProvider())

      expect(schema.settleIgnoreUrls.defaultValue).toStrictEqual([])
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
      const schema = createSchema(new MockRoutingProvider())
      const validate = schema.settleIgnoreUrls.validate

      expect(validate(value)).toBe(expected)
    })
  })

  describe('serviceName', () => {
    it('defaults to unknown_service', () => {
      const schema = createSchema(new MockRoutingProvider())
      expect(schema.serviceName.defaultValue).toBe('unknown_service')
    })
  })
})

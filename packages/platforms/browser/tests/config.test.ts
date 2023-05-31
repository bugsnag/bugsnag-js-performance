/**
 * @jest-environment jsdom
 */

import { DefaultRoutingProvider } from '@bugsnag/js-performance-test-utilities'
import { createSchema } from '../lib/config'

describe('createSchema', () => {
  it('sets releaseStage.defaultValue to development on localhost', () => {
    const schema = createSchema('localhost', new DefaultRoutingProvider())
    expect(schema.releaseStage.defaultValue).toStrictEqual('development')
  })

  it('sets releaseStage.defaultValue to production on another host', () => {
    const schema = createSchema('bugsnag.com', new DefaultRoutingProvider())
    expect(schema.releaseStage.defaultValue).toStrictEqual('production')
  })

  describe('settleIgnoreUrls', () => {
    it('defaults to an empty array', () => {
      const schema = createSchema('', new DefaultRoutingProvider())

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
      const schema = createSchema('', new DefaultRoutingProvider())
      const validate = schema.settleIgnoreUrls.validate

      expect(validate(value)).toBe(expected)
    })
  })
})

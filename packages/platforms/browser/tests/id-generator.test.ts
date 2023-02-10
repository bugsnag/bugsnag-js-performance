/**
 * @jest-environment jsdom
 */

import idGenerator from '../lib/id-generator'

describe('Browser ID generator', () => {
  it('generates random 64 bit ID', () => {
    const id = idGenerator.generate(64)

    expect(id).toMatch(/^[a-f0-9]{16}$/)
  })

  it('generates random 128 bit ID', () => {
    const id = idGenerator.generate(128)

    expect(id).toMatch(/^[a-f0-9]{32}$/)
  })
})

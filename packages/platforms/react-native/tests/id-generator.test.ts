import createIdGenerator from '../lib/id-generator'
import type { IdGenerator } from '@bugsnag/core-performance'
import NativeBugsnagPerformance from '../lib/NativeBugsnagPerformance'

describe('React Native ID generator', () => {
  let idGenerator: IdGenerator
  beforeAll(() => {
    idGenerator = createIdGenerator(NativeBugsnagPerformance)
  })

  it('generates random 64 bit ID', () => {
    const id = idGenerator.generate(64)

    expect(id).toMatch(/^[a-f0-9]{16}$/)
  })

  it('generates random 128 bit ID', () => {
    const id = idGenerator.generate(128)

    expect(id).toMatch(/^[a-f0-9]{32}$/)
  })
})

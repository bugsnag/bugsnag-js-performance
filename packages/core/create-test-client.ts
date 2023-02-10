import { createClient } from './lib/core'
import type { ClientOptions, BugsnagPerformance } from './lib/core'

const defaultOptions = () => ({
  processor: { add: jest.fn() },
  idGenerator: { generate: jest.fn() },
  clock: { now: jest.fn(() => performance.now()), convert: jest.fn((date: Date) => date.getTime() * 1_000_000) }
})

function createTestClient (optionOverrides: Partial<ClientOptions> = {}): BugsnagPerformance {
  return createClient({ ...defaultOptions(), ...optionOverrides })
}

export default createTestClient

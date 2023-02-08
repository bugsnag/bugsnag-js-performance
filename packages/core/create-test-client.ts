import { createClient } from './lib/core'
import type { ClientOptions, BugsnagPerformance } from './lib/core'

const defaultOptions = () => ({
  processor: { add: jest.fn() }
})

function createTestClient (optionOverrides: Partial<ClientOptions> = {}): BugsnagPerformance {
  return createClient({ ...defaultOptions(), ...optionOverrides })
}

export default createTestClient

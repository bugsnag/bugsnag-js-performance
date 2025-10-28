/* eslint-disable @typescript-eslint/no-var-requires */
import type { ReactNativeConfiguration } from '../lib/config'
import type { BugsnagPerformance } from '@bugsnag/core-performance'
import type { PlatformExtensions } from '../lib/platform-extensions'

let client: BugsnagPerformance<ReactNativeConfiguration, PlatformExtensions>

describe('Default React Native Client', () => {
  it('should create a valid client', () => {
    client = require('../lib/client').default

    expect(client).toBeDefined()
    expect(client.start).toBeDefined()
    expect(client.startSpan).toBeDefined()
    expect(client.startNetworkSpan).toBeDefined()
    expect(client.getPlugin).toBeDefined()
    expect(client.getSpanControls).toBeDefined()
    expect(client.startNavigationSpan).toBeDefined()
    expect(client.withInstrumentedAppStarts).toBeDefined()
    expect(client.attach).toBeDefined()
  })
})

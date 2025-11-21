/* eslint-disable @typescript-eslint/consistent-type-assertions */
import createClock from './clock'
import type { ReactNativeConfiguration } from './config'
import { createReactNativeClient } from './create-client'
import type { PlatformExtensions } from './platform-extensions'
import type { BugsnagPerformance } from '@bugsnag/core-performance'

// Singleton client instance shared across the entire application.
// Will be lazily created on first property access to the BugsnagPerformance proxy below,
// OR can be pre-configured by calling registerClient()
let clientInstance: unknown

// Sets the singleton BugsnagPerformance client instance.
// Upstream libraries such as Expo MUST call this to pre-configure the client instance upfront before any usage.
export function registerClient<C extends ReactNativeConfiguration = ReactNativeConfiguration, T = PlatformExtensions> (client: BugsnagPerformance<C, T>): void {
  clientInstance = client
}

const clock = createClock(performance)
const appStartTime = clock.now()

// Proxy wrapper for lazy initialization of the BugsnagPerformance client.
// On first property access:
// - Uses pre-configured client from registerClient() if available, otherwise creates a new client
// - Copies all client properties to the proxy target and removes the get trap
// - All subsequent accesses go directly to the target, bypassing the proxy for optimal performance
const client = new Proxy({} as BugsnagPerformance<ReactNativeConfiguration, PlatformExtensions>, {
  get (target, prop) {
    // React uses the $$typeof property to identify React elements - we return undefined
    // to avoid triggering client creation during React's internal type checking
    if (prop === '$$typeof') return undefined

    // initialize the client instance here if it hasn't already been set via registerClient()
    if (!clientInstance) {
      clientInstance = createReactNativeClient({ appStartTime, clock })
    }

    // Now that the client has been initialized, we can add all its properties to the proxy target
    // and remove the get trap in order to bypass the proxy for future accesses
    const client = clientInstance as BugsnagPerformance<ReactNativeConfiguration, PlatformExtensions>
    Object.defineProperties(target, Object.getOwnPropertyDescriptors(client))
    delete this.get

    return client[prop as keyof typeof client]
  }
})

export default client

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

// Proxy wrapper that provides lazy initialization of the BugsnagPerformance client.
// How it works:
// 1. If registerClient() was called (e.g., by Expo), the proxy delegates to that pre-configured instance
// 2. Otherwise, on first property access, it creates a default client via createReactNativeClient()
// 3. All subsequent accesses use the same singleton instance, ensuring one client per app
// The Proxy intercepts all property accesses and forwards them to the actual client instance.
const client = new Proxy({} as BugsnagPerformance<ReactNativeConfiguration, PlatformExtensions>, {
  get (_target, prop) {
    // React uses the $$typeof property to identify React elements - we return undefined
    // to avoid triggering client creation during React's internal type checking
    if (prop === '$$typeof') return undefined

    if (!clientInstance) {
      clientInstance = createReactNativeClient({ appStartTime, clock })
    }
    const client = clientInstance as BugsnagPerformance<ReactNativeConfiguration, PlatformExtensions>
    return client[prop as keyof typeof client]
  }
})

export default client

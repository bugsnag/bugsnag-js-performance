import BugsnagPerformance from './client'

export type { ReactNativeConfiguration, ReactNativeAttachConfiguration, ReactNativeSchema } from './config'
export type { PlatformExtensions } from './platform-extensions'
export { createDefaultPlatformExtensions } from './platform-extensions'
export type { AppStartSpanControl } from './auto-instrumentation/app-start-plugin'
export { AppStartSpanQuery } from './auto-instrumentation/app-start-plugin'
export { ReactNativeSpanFactory } from './span-factory'
export { createSchema as createReactNativeSchema } from './config'
export { createReactNativeClient } from './create-client'
export type { ReactNativeClientOptions } from './create-client'

export default BugsnagPerformance

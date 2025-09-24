import BugsnagPerformance from './client'

export type { ReactNativeConfiguration, ReactNativeAttachConfiguration } from './config'
export type { PlatformExtensions } from './platform-extensions'
export type { AppStartSpanControl } from './auto-instrumentation/app-start-plugin'
export { AppStartSpanQuery } from './auto-instrumentation/app-start-plugin'
export { ReactNativeSpanFactory } from './span-factory'

export default BugsnagPerformance

import { type BrowserConfiguration } from '@bugsnag/browser-performance'
import { type BugsnagPerformance, type Configuration } from '@bugsnag/core-performance'

declare const Bugsnag: BugsnagPerformance<BrowserConfiguration | Configuration>

export default Bugsnag
export * from '@bugsnag/browser-performance'

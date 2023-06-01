import { BugsnagPerformance, type Configuration } from '@bugsnag/core-performance'
import { type BrowserConfiguration } from '@bugsnag/browser-performance'

export default BugsnagPerformance<BrowserConfiguration | Configuration>

import { type BugsnagPerformance, type Configuration } from '@bugsnag/core-performance'

export default class NodePerformanceClient implements BugsnagPerformance<Configuration> {
  start () { }

  startSpan (name: string, startTime?: Date | number) {
    return {
      end () { }
    }
  }
}

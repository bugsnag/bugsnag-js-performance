import { NativeScenarioLauncher } from '../lib/native'
import { createBenchmarkRunner } from './BenchmarkRunner'
import * as Benchmarks from './core'
import BugsnagPerformance from "@bugsnag/react-native-performance/lib";

const reportBenchmarkResults = async (results, endpoint) => {

}

export const runBenchmark = async (name, config, apiKey, endpoint) => {
  const configFlags = new Set(config.split(' '))

  const configuration = {
    apiKey,
    endpoint,
    nativeSpans: configFlags.has('nativeSpans'),
    jsSpans: configFlags.has('jsSpans'),
    enabledMetrics: {
      rendering: configFlags.has('rendering'),
      cpu: configFlags.has('cpu'),
      memory: configFlags.has('memory'),
    },
    // benchmarks discard all spans
    samplingProbability: 0,
  }

  if (configFlags.has('native')) {
    await NativeScenarioLauncher.startNativePerformance(configuration)
    await BugsnagPerformance.attach();
  } else {
    BugsnagPerformance.start(configuration);
  }

  const runner = createBenchmarkRunner({configFlags})
  const results = await runner.runBenchmark(Benchmarks[name])

  return await reportBenchmarkResults(results, endpoint)
}

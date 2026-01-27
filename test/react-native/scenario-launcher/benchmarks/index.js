import { NativeScenarioLauncher } from '../lib/native'
import { createBenchmarkRunner } from './BenchmarkRunner'
import * as Benchmarks from './core'
import BugsnagPerformance from '@bugsnag/react-native-performance';
import { BugsnagJavascriptSpansPlugin, BugsnagNativeSpansPlugin } from "@bugsnag/plugin-react-native-span-access";

const reportBenchmarkResults = async (results, mazeAddress) => {
  const url = `http://${mazeAddress}/metrics`

  // Format timestamp as "EEE MMM dd HH:mm:ss zzz yyyy"
  const timestamp = new Date().toString()

  // Create flat JSON object
  const flatResults = {
    timestamp,
    benchmark: results.name,
    totalTimeTaken: results.totalTimeTaken,
    totalExcludedTime: results.totalExcludedTime,
    totalMeasuredTime: results.totalMeasuredTime,
    totalIterations: results.totalIterations,
  }

  // Add config flags as boolean properties
  if (results.configFlags) {
    for (const flag of results.configFlags) {
      flatResults[flag] = true
    }
  }

  // Add individual run results
  if (results.runResults) {
    results.runResults.forEach((run, index) => {
      flatResults[`timeTaken.${index}`] = run.timeTaken
      flatResults[`excludedTime.${index}`] = run.excludedTime
      flatResults[`measuredTime.${index}`] = run.measuredTime
      flatResults[`iterations.${index}`] = run.iterations
    })
  }

  try {
    console.error(`[BugsnagPerformance] Sending benchmark results to ${url}`)
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(flatResults),
    })

    if (!response.ok) {
      console.error(`[BugsnagPerformance] Failed to send benchmark results: ${response.status} ${response.statusText}`)
    } else {
      console.error(`[BugsnagPerformance] Successfully sent benchmark results`)
    }
  } catch (error) {
    console.error(`[BugsnagPerformance] Error sending benchmark results: ${error.message}`)
  }
}

export const runBenchmark = async (name, config, apiKey, endpoint, mazeAddress) => {
  const configFlags = new Set(config.split(' '))

  const plugins = []

  if (configFlags.has('nativeSpans')) {
    plugins.push(new BugsnagNativeSpansPlugin())
  }

  if (configFlags.has('jsSpans')) {
    plugins.push(new BugsnagJavascriptSpansPlugin())
  }

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
    await BugsnagPerformance.attach({
      plugins
    });
  } else {
    BugsnagPerformance.start(configuration);
  }

  const runner = createBenchmarkRunner({configFlags})
  const results = await runner.runBenchmark(Benchmarks[name])

  // Add benchmark name and config flags to results for reporting
  results.name = name
  results.configFlags = configFlags

  await reportBenchmarkResults(results, mazeAddress)

  NativeScenarioLauncher.exitApp()
}

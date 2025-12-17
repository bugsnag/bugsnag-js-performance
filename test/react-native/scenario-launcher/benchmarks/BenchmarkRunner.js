const createRunResult = (
  timeTaken,
  excludedTime,
  iterations,
) => {
  const measuredTime = timeTaken - excludedTime
  return ({
    timeTaken,
    excludedTime,
    iterations,
    measuredTime,
    averageTimePerIteration: iterations > 0 ? measuredTime / iterations : 0
  });
}

const createBenchmarkResult = (
  benchmarkName,
  runResults,
  configFlags
) => {
  const timeTaken = runResults.reduce((sum, r) => sum + r.timeTaken, 0)
  const excludedTime = runResults.reduce((sum, r) => sum + r.excludedTime, 0)
  const iterations = runResults.reduce((sum, r) => sum + r.iterations, 0)
  const measuredTime = timeTaken - excludedTime

  return ({
    benchmarkName,
    runResults,
    configFlags,
    timeTaken,
    excludedTime,
    iterations,
    measuredTime,
    averageTimePerIteration: iterations > 0 ? measuredTime / iterations : 0
  });
}

// Create separate trackers for sync and async
const createSyncTracker = (iterations) => ({
  remainingIterations: iterations,
  excludedTime: 0,

  measureRepeated (fn) {
    while (this.remainingIterations > 0) {
      fn()
      this.remainingIterations--
    }
  },

  runWithTimingDisabled (fn) {
    const startTime = performance.now()
    try {
      return fn()
    } finally {
      const endTime = performance.now()
      this.excludedTime += (endTime - startTime)
    }
  }
})


const createAsyncTracker = (iterations) => ({
  remainingIterations: iterations,
  excludedTime: 0,

  async measureRepeated (fn) {
    while (this.remainingIterations > 0) {
      await fn()
      this.remainingIterations--
    }
  },

  async runWithTimingDisabled (fn) {
    const startTime = performance.now()
    try {
      return await fn()
    } finally {
      const endTime = performance.now()
      this.excludedTime += (endTime - startTime)
    }
  }
})

// Benchmark runner factory
export const createBenchmarkRunner = (config = {}) => {
  const {
    configFlags = new Set(),
    warmupIterations = 1000,
    iterationsPerRun = 25000,
    numberOfRuns = 5
  } = config

  const cleanup = () => {
    return new Promise(resolve => setTimeout(resolve, 100))
  }

  // Run sync benchmark
  const runSyncBenchmark = async (benchmark) => {
    console.log(`Running sync benchmark: ${benchmark.name}`)

    // Warmup
    const warmupTracker = createSyncTracker(warmupIterations)
    benchmark.setup?.()
    benchmark.run(warmupTracker)
    benchmark.teardown?.()
    await cleanup()

    // Main runs
    const runResults = []
    for (let i = 0; i < numberOfRuns; i++) {
      benchmark.setup?.()
      const tracker = createSyncTracker(iterationsPerRun)

      const startTime = performance.now()
      benchmark.run(tracker)
      const endTime = performance.now()

      benchmark.teardown?.()

      runResults.push(createRunResult(
        (endTime - startTime),
        tracker.excludedTime,
        iterationsPerRun,
      ))

      await cleanup()
    }

    console.error(`Reporting results for benchmark: ${benchmark.name}`)
    return createBenchmarkResult(benchmark.name, runResults, configFlags)
  }

  // Run async benchmark
  const runAsyncBenchmark = async (benchmark) => {
    console.error(`Running async benchmark: ${benchmark.name}`)

    // Warmup
    const warmupTracker = createAsyncTracker(warmupIterations)
    await benchmark.setup?.()
    await benchmark.run(warmupTracker)
    await benchmark.teardown?.()
    await cleanup()

    // Main runs
    const runResults = []
    for (let i = 0; i < numberOfRuns; i++) {
      await benchmark.setup?.()
      const tracker = createAsyncTracker(iterationsPerRun)

      const startTime = performance.now()
      await benchmark.run(tracker)
      const endTime = performance.now()

      await benchmark.teardown?.()

      runResults.push(createRunResult(
        (endTime - startTime),
        tracker.excludedTime,
        iterationsPerRun,
      ))

      await cleanup()
    }

    console.error(`Reporting results for async benchmark: ${benchmark.name}`)
    return createBenchmarkResult(benchmark.name, runResults, configFlags)
  }

  return {
    /**
     * Run a Benchmark and report the results as a Promise.
     *
     * ```typescript
     * interface Benchmark {
     *   name: string
     *   run: (tracker: BenchmarkTracker) => Promise<void>|void
     *   setup?: () => Promise<void>
     *   teardown?: () => Promise<void>
     *   isAsync: boolean // true if run returns a promise, false to measure synchronous code
     * }
     * ```
     *
     * @param benchmark
     * @returns {Promise<{benchmarkName: *, runResults: *, configFlags: *, timeTaken: *, excludedTime: *, iterations: *, getMeasuredTime: function(): *, getAverageTimePerIteration: function(): number}>}
     */
    runBenchmark: (benchmark) => {
      return benchmark.isAsync
        ? runAsyncBenchmark(benchmark)
        : runSyncBenchmark(benchmark)
    }
  }
}

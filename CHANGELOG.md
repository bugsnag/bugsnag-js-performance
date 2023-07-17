# Changelog

## v0.3.0 (2023-07-17)

### Fixed

- (core) Use platform clock to set the `Bugsnag-Sent-At` header [#265](https://github.com/bugsnag/bugsnag-js-performance/pull/265)
- (browser) Only add `http.flavor` span attribute when it is a useful value [#255](https://github.com/bugsnag/bugsnag-js-performance/pull/255)

### Removed

- (browser) Remove the `networkInstrumentationIgnoreUrls` config option [#261](https://github.com/bugsnag/bugsnag-js-performance/pull/261)

## v0.2.0 (2023-07-10)

### Added

- (core, browser) Log a warning when providing invalid options to `startSpan` [#245](https://github.com/bugsnag/bugsnag-js-performance/pull/245)
- (core) Added `bugsnag.sampling.p` attribute [#258](https://github.com/bugsnag/bugsnag-js-performance/pull/258)

### Fixed

- (core) Correctly report the `Bugsnag-Span-Sampling` header [#256](https://github.com/bugsnag/bugsnag-js-performance/pull/256) [#257](https://github.com/bugsnag/bugsnag-js-performance/pull/257)

## v0.1.1 (2023-06-28)

### Added

- (core) Allow spans to be nested and introduce the notion of a context stack & current span context [#198](https://github.com/bugsnag/bugsnag-js-performance/pull/198) [#206](https://github.com/bugsnag/bugsnag-js-performance/pull/206) [#209](https://github.com/bugsnag/bugsnag-js-performance/pull/209) [#210](https://github.com/bugsnag/bugsnag-js-performance/pull/210)
- (core) Add `makeCurrentContext` span option [#211](https://github.com/bugsnag/bugsnag-js-performance/pull/211)
- (core) Add `parentContext` span option [#214](https://github.com/bugsnag/bugsnag-js-performance/pull/214)
- (core) Add `device.id` as a resource attribute [#217](https://github.com/bugsnag/bugsnag-js-performance/pull/217)
- (core) Add `generateAnonymousId` config option [#217](https://github.com/bugsnag/bugsnag-js-performance/pull/217)
- (core) Add `isFirstClass` span option [#218](https://github.com/bugsnag/bugsnag-js-performance/pull/218)
- (core) Log a warning when trying to end a Span multiple times [#200](https://github.com/bugsnag/bugsnag-js-performance/pull/200)
- (core) Add 'Bugsnag-Sent-At' header to trace payloads [#220](https://github.com/bugsnag/bugsnag-js-performance/pull/220)
- (browser) Add PageLoadPhase sub-spans for full page loads [#212](https://github.com/bugsnag/bugsnag-js-performance/pull/212) [#224](https://github.com/bugsnag/bugsnag-js-performance/pull/224)
- (browser) Add ResourceLoad instrumentation [#225](https://github.com/bugsnag/bugsnag-js-performance/pull/225)
- (browser) Set title and url attributes for page load and route change spans when settling [#240](https://github.com/bugsnag/bugsnag-js-performance/pull/240)

### Removed

- (core) *Breaking change*: The `samplingProbability` configuration option has been removed. A default probability of 1.0 is used until a probability value is received from the server [#219](https://github.com/bugsnag/bugsnag-js-performance/pull/219)
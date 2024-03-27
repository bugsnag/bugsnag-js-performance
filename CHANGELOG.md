# Changelog

## Unreleased

### Added

- (browser) This release adds experimental trace propagation support. When enabled, by setting `propagateTraceContext` to `true` in the `networkRequestCallback` handler, a `traceparent` header will be added to the outgoing network request.

### Deprecated

- (react-native) For improved consistency with our error SDK, this release renames the existing navigation plugins and their exported types. The old packages are now marked as deprecated in NPM, but can be used until the next major version of this library. However we recommend renaming any existing references to the new packages straightaway:
  - React Navigation:
    - Rename package import from `@bugsnag/react-navigation-performance` to `@bugsnag/plugin-react-navigation-performance`
    - Rename plugin type from `ReactNavigationNativePlugin` to `BugsnagPluginReactNavigationPerformance`
  - React Native Navigation:
    - Rename package import from `@bugsnag/react-native-navigation-performance` to `@bugsnag/plugin-react-native-navigation-performance`
    - Rename plugin type from `ReactNativeNavigationPlugin` to `BugsnagPluginReactNativeNavigationPerformance`

## v2.3.0 (2024-03-20)

This release adds support for instrumenting navigation spans when using the [react-native-navigation](https://github.com/wix/react-native-navigation) library

### Added 

- (react-native-navigation) Added `@bugsnag/react-native-navigation-performance` package [#404](https://github.com/bugsnag/bugsnag-js-performance/pull/404)

### Fixed

- (browser) Prevent throwing an error in edge cases when `performance.getEntriesByType()` returns undefined [#401](https://github.com/bugsnag/bugsnag-js-performance/pull/401)
- (react-native) Broaden version range allowed for `@react-native-community/netinfo` peer dependency [#413](https://github.com/bugsnag/bugsnag-js-performance/pull/413)
- (react-navigation) Refactor `CompleteNavigation` as a functional component [#418](https://github.com/bugsnag/bugsnag-js-performance/pull/418)
- (react-native) Update the android namepsace to `com.bugsnag.reactnative.performance` to prevent overlap with the native android package [#426]https://github.com/bugsnag/bugsnag-js-performance/pull/426

## v2.2.0 (2024-02-01)

This release adds support for automatic span instrumentation when using React Navigation in React Native apps. See [online docs](https://docs.bugsnag.com/performance/integration-guides/react-native/navigation-libraries) for details.

- (browser) Export noops from browser package when window or document is undefined [#390](https://github.com/bugsnag/bugsnag-js-performance/pull/390)

## v2.1.0 (2023-12-12)

### Fixed

- (react-router) Allow `/` as a basename [#337](https://github.com/bugsnag/bugsnag-js-performance/pull/337)
- (vue-router) Allow `/` as a basename [#337](https://github.com/bugsnag/bugsnag-js-performance/pull/337)
- (react-native) Generate random bytes natively for ID generation [#380](https://github.com/bugsnag/bugsnag-js-performance/pull/380)
- (react-native) Discard spans when the app is in the background [#384](https://github.com/bugsnag/bugsnag-js-performance/pull/384)

### Added

- (angular) Added new integration for angular apps [#293](https://github.com/bugsnag/bugsnag-js-performance/pull/293)

## v2.0.0 (2023-11-20)

### Added

- (react-native) Added `net.host.connection.type` span attribute [#334](https://github.com/bugsnag/bugsnag-js-performance/pull/334)
- (react-native) Added `net.host.connection.subtype` span attribute [#360](https://github.com/bugsnag/bugsnag-js-performance/pull/360)
- (react-native) Added persistence to retry queue [#357](https://github.com/bugsnag/bugsnag-js-performance/pull/357)

### Fixed

- (browser) Fall back to unbuffered performance observer when buffer is not supported [#352](https://github.com/bugsnag/bugsnag-js-performance/pull/352)
- (browser) Listen for pagehide and pageshow events in backgrounding listener [#362](https://github.com/bugsnag/bugsnag-js-performance/pull/362)
- (core) Round timestamps to the nearest integer [#364](https://github.com/bugsnag/bugsnag-js-performance/pull/364)

## v1.2.0 (2023-10-12)

This release adds support for running BugSnag Performance in React Native apps. See [online docs](https://docs.bugsnag.com/performance/integration-guides/react-native) for details.

### Added

- (delivery-fetch) Added `@bugsnag/delivery-fetch-performance` package [#281](https://github.com/bugsnag/bugsnag-js-performance/pull/281)

## v1.1.0 (2023-09-18)

### Added

- (browser) Added new `VueRouterRoutingProvider` for integration with vue-router [#293](https://github.com/bugsnag/bugsnag-js-performance/pull/293)
- (browser) Added new `ReactRouterRoutingProvider` for integration with react-router v6 [#285](https://github.com/bugsnag/bugsnag-js-performance/pull/285)

### Fixed

- (browser) Do not retry delivery for oversized payloads when connection fails [#280](https://github.com/bugsnag/bugsnag-js-performance/pull/280)
- (browser) Fallback to the default route resolver for full page load spans if the configured `routingProvider` does not return a route [#300](https://github.com/bugsnag/bugsnag-js-performance/pull/300)

## v1.0.0 (2023-07-27)

### Added

- (browser) Added new `networkRequestCallback` config option [#262](https://github.com/bugsnag/bugsnag-js-performance/pull/262)
- (browser) Add `sendPageAttributes` configuration option [#266](https://github.com/bugsnag/bugsnag-js-performance/pull/266) [#270](https://github.com/bugsnag/bugsnag-js-performance/pull/270) [#271](https://github.com/bugsnag/bugsnag-js-performance/pull/271)

### Fixed

- (browser) Calculate time origin on create as well as visibility change [#268](https://github.com/bugsnag/bugsnag-js-performance/pull/268)
- (browser) Only track network requests over http(s) [#275](https://github.com/bugsnag/bugsnag-js-performance/pull/275)
- (browser) Fall back to default route resolver when custom resolver returns empty string or undefined [#276](https://github.com/bugsnag/bugsnag-js-performance/pull/276)
- (browser) Fix sampling logic when batching for delivery [#278](https://github.com/bugsnag/bugsnag-js-performance/pull/278)

### Removed

- Removed `@bugsnag/js-performance` meta package [#264](https://github.com/bugsnag/bugsnag-js-performance/pull/264)

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

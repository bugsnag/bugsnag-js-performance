# Changelog

## [Unreleased]

### Fixed

- (browser) Fix TLS PageLoadPhase span start times when `secureConnectionStart` is 0 [#781](https://github.com/bugsnag/bugsnag-js-performance/pull/781)

- (react-native) Fix linker error when `plugin-react-native-span-access` is not installed [#787](https://github.com/bugsnag/bugsnag-js-performance/pull/787)

## [v3.4.0] (2026-01-27)

### Added

- (plugin-react-native-span-access) Added `BugsnagReactNativeAppStartPlugin` to support React Native app starts as child spans of native view loads [#705](https://github.com/bugsnag/bugsnag-js-performance/pull/705) [#705](https://github.com/bugsnag/bugsnag-js-performance/pull/721) [#749](https://github.com/bugsnag/bugsnag-js-performance/pull/749) [#757](https://github.com/bugsnag/bugsnag-js-performance/pull/757)

### Fixed

- (plugin-react-navigation) Ensure navigation container is ready before initializing tracking [#755](https://github.com/bugsnag/bugsnag-js-performance/pull/755)

- (react-native) Add proguard rules for React Native Android module [#766](https://github.com/bugsnag/bugsnag-js-performance/pull/766)

## [v3.3.0] (2025-11-24)

### Changed

- (react-native) Introduced a lazy-loading singleton client to ensure a single client instance per app [#748](https://github.com/bugsnag/bugsnag-js-performance/pull/748)

## [v3.2.0] (2025-11-13)

### Added

- (react-native) Added `createReactNativeClient` factory method for internal use by upstream libraries [#730](https://github.com/bugsnag/bugsnag-js-performance/pull/730)

### Changed

- Amend secondary endpoint to `bugsnag.smartbear.com` [#737](https://github.com/bugsnag/bugsnag-js/pull/737)

## [v3.1.0] (2025-09-24)

### Added

- (react-native) Added `AppStartSpanControl` and `AppStartSpanQuery` to allow custom categorization of app start spans [#700](https://github.com/bugsnag/bugsnag-js-performance/pull/700)

## [v3.0.1] (2025-08-14)

### Fixed

- Bump peer dependencies to v3.0.0 [#694](https://github.com/bugsnag/bugsnag-js-performance/pull/694)

## [v3.0.0] (2025-08-13)

*Breaking change*: For React Native apps integrating with the native Android/iOS Performance SDKs, the minimum required versions are now: 
- Bugsnag Android Performance [v2.0.0](https://github.com/bugsnag/bugsnag-android-performance/releases/tag/v2.0.0) 
- Bugsnag Cocoa Performance [v1.14.0](https://github.com/bugsnag/bugsnag-cocoa-performance/releases/tag/v1.14.0)

Upgrading these versions is required for continued compatibility with the React Native integration. Please refer to the linked release notes for details on changes in the native SDKs.

### Added

- (react-native) Added `BugsnagJavascriptSpansPlugin` to `@bugsnag/plugin-react-native-span-access` to support accessing JavaScript span controls from native code [#682](https://github.com/bugsnag/bugsnag-js-performance/pull/682)

## [v2.15.0] (2025-08-12)

### Changed

- Reduce batch time in development environment [#673](https://github.com/bugsnag/bugsnag-js-performance/pull/673)
- Calling `setAttribute` with a `null` or `undefined` attribute value now clears the attribute from the span [#679](https://github.com/bugsnag/bugsnag-js-performance/pull/679)

### Fixed

- (react-native) Added a short debounce during app start to allow backgrounded apps to come to the foreground [#665](https://github.com/bugsnag/bugsnag-js-performance/pull/665)
- (react-native) Fix a crash when refreshing the entropy pool on iOS [#667](https://github.com/bugsnag/bugsnag-js-performance/pull/667)
- (ract-native) Fix span and trace ID encoding in the iOS native integration [#683](https://github.com/bugsnag/bugsnag-js-performance/pull/683)

## [v2.14.0] (2025-06-25)

### Added
- Set default endpoints based on API key [#643](https://github.com/bugsnag/bugsnag-js-performance/pull/643)
- (core) Added `onSpanStart` callbacks config option to allow spans to be inspected and modified on creation. [#631](https://github.com/bugsnag/bugsnag-js-performance/pull/631)
- (svelte-kit-performance) Added new routing provider for instrumenting route change spans with [SvelteKit](https://svelte.dev/docs/kit/introduction) [#632](https://github.com/bugsnag/bugsnag-js-performance/pull/632)
- (core) Introduced `SpanControlProvider` interface and `BugsnagPerformance.getSpanControls` method to allow access to a registered `SpanControlProvider`. [#634](https://github.com/bugsnag/bugsnag-js-performance/pull/634)
- (browser, react-native) Added `@bugsnag/plugin-named-spans` package for tracking and accessing open spans by name [#644](https://github.com/bugsnag/bugsnag-js-performance/pull/644)
- (react-native) Added `@bugsnag/plugin-react-native-span-access` package for accessing native spans from Javascript [#633](https://github.com/bugsnag/bugsnag-js-performance/pull/633) [#636](https://github.com/bugsnag/bugsnag-js-performance/pull/636) [#639](https://github.com/bugsnag/bugsnag-js-performance/pull/639) [#645](https://github.com/bugsnag/bugsnag-js-performance/pull/645)

## [v2.13.0] (2025-05-15)

### Added

- (core) Introduced `RemoteParentContext` to allow cross-layer parenting of spans, along with easy encoding of `traceparent` headers [#620](https://github.com/bugsnag/bugsnag-js-performance/pull/620)

## [v2.12.0] (2025-03-26)

This release adds support for React Native 0.77 to `@bugsnag/react-native-performance`

### Added

- (plugin-react-performance) Added new react library with `withInstrumentedComponent` higher order component to instrument component rendering spans [#584](https://github.com/bugsnag/bugsnag-js-performance/pull/584)

### Fixed

- (react-native) Fix turbo module check in React Native 0.77 [#578](https://github.com/bugsnag/bugsnag-js-performance/pull/578)

## [v2.11.0] (2025-01-23)

### Added

- (react-native) Added `BugsnagPerformance.attach` method to support integration with native BugSnag Performance Monitoring SDKs for Android and iOS [#573](https://github.com/bugsnag/bugsnag-js-performance/pull/573)

### Changed

- (react-native) Replaced `react-native-file-access` peer dependency with internal native module implementation. This peer dependency is no longer required by the SDK. [#561](https://github.com/bugsnag/bugsnag-js-performance/pull/561)

## [v2.10.1] (2024-11-12)

### Fixed

- (react-native) Prevent duplicate app start spans from being started [#524](https://github.com/bugsnag/bugsnag-js-performance/pull/524)

### Changed

- (browser) Update Span and Trace ID generator code to allow for modified `Array.from` API [#518](https://github.com/bugsnag/bugsnag-js-performance/pull/518)

## [v2.10.0] (2024-09-26)

### Added

- Allow setting custom span attributes [#510](https://github.com/bugsnag/bugsnag-js-performance/pull/510)

## [v2.9.1] (2024-09-11)

### Fixed

- (core) Fix URL.hostname error on React Native [#504](https://github.com/bugsnag/bugsnag-js-performance/pull/504)

## [v2.9.0] (2024-09-05)

### Added

- (react-native) Add new withInstrumentedAppStarts method to workaround automatically instrumented app start span issues [#497](https://github.com/bugsnag/bugsnag-js-performance/pull/497)

### Changed

- (core) Discard spans open for more than one hour [#494](https://github.com/bugsnag/bugsnag-js-performance/pull/494)
- (core) use API key subdomain as default endpoint [#500](https://github.com/bugsnag/bugsnag-js-performance/pull/500)

## [v2.8.0] (2024-08-20)

### Added

- (browser) Add serviceName config option for browser and ensure service.name attribute is always set [#477](https://github.com/bugsnag/bugsnag-js-performance/pull/477)
- Add a fixed sampling probability configuration option [#487](https://github.com/bugsnag/bugsnag-js-performance/pull/487)
- (react-native) Support react-native-file-access v1.x [#488](https://github.com/bugsnag/bugsnag-js-performance/pull/488)
- (react-native) Support React Native 0.64 [#489](https://github.com/bugsnag/bugsnag-js-performance/pull/489)

### Changed

- (vue-router) Use vue router to resolve routes [#476](https://github.com/bugsnag/bugsnag-js-performance/pull/476)
- Update error correlation implementation to monkey patch the error notifier [#474](https://github.com/bugsnag/bugsnag-js-performance/pull/474)
- (react-native) Ensure native module is fully backwards compatible [#478](https://github.com/bugsnag/bugsnag-js-performance/pull/478)
- (react-native) Use batch time for filenames in retry queue [#486](https://github.com/bugsnag/bugsnag-js-performance/pull/486)
- (core) Avoid long running timers when ensuring probability freshness [#481](https://github.com/bugsnag/bugsnag-js-performance/pull/481)

### Fixed

- (react-native) Set initial background state to foreground if initial app state is 'inactive' [#491](https://github.com/bugsnag/bugsnag-js-performance/pull/491)

## [v2.7.1] (2024-07-16)

### Changed

- Update type imports to ensure TypeScript backwards compatibility [#471](https://github.com/bugsnag/bugsnag-js-performance/pull/471)

## [v2.7.0] (2024-07-03)

### Added

- (react-native) Support remote debugging in Chrome [#468](https://github.com/bugsnag/bugsnag-js-performance/pull/468)

### Fixed

- (plugin-react-navigation) Fix a crash when navigation ref is created using useRef [#469](https://github.com/bugsnag/bugsnag-js-performance/pull/469)

## [v2.6.0] (2024-06-06)

### Added

- (browser) Set parent span context for full page load spans based on traceparent meta tag, if present [#446](https://github.com/bugsnag/bugsnag-js-performance/pull/446)

### Fixed

- (plugin-react-navigation) Fix an issue where a navigation span could inherit the end time of the last span [#457](https://github.com/bugsnag/bugsnag-js-performance/pull/457)

## [v2.5.0] (2024-05-02)

### Added

- (react-native) Add trace propagation headers for React Native [#437](https://github.com/bugsnag/bugsnag-js-performance/pull/437) [#444](https://github.com/bugsnag/bugsnag-js-performance/pull/444)
- Add new `startNetworkSpan` method to `BugsnagPerformance` [#448](https://github.com/bugsnag/bugsnag-js-performance/pull/448)
- Change network span naming convention to `[HTTP/VERB]` [#448](https://github.com/bugsnag/bugsnag-js-performance/pull/448)

### Fixed

- (core) Fix import of `@bugsnag/cuid` not working in node ESM environment [#445](https://github.com/bugsnag/bugsnag-js-performance/pull/445)

## v2.4.1 (2024-04-18)

### Fixed

- (core) Delay span batching while initial sampling request is in flight [#433](https://github.com/bugsnag/bugsnag-js-performance/pull/433)
- (core) Refactor span batching to ensure correct sampling values for subsequent spans [#435](https://github.com/bugsnag/bugsnag-js-performance/pull/435)
- (request-tracker) Ensure existing headers are preserved for fetch requests [#436](https://github.com/bugsnag/bugsnag-js-performance/pull/436)

## v2.4.0 (2024-03-27)

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

### Fixed

- (plugin-react-navigation) Fix an issue where refs are not forwarded to the NavigationContainer [#431](https://github.com/bugsnag/bugsnag-js-performance/pull/431)

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

Feature: App Start spans

Scenario: App starts are automatically instrumented
  When I run 'AppStartScenario'
  And I wait to receive a sampling request
  And I wait for 1 span

  # Check the initial probability request
  Then the sampling request "Bugsnag-Span-Sampling" header equals "1.0:0"

  And the trace "Bugsnag-Span-Sampling" header equals "1:1"
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "[AppStart/ReactNativeInit]"
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.kind" equals 3
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.spanId" matches the regex "^[A-Fa-f0-9]{16}$"
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.traceId" matches the regex "^[A-Fa-f0-9]{32}$"
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.startTimeUnixNano" matches the regex "^[0-9]+$"
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.endTimeUnixNano" matches the regex "^[0-9]+$"
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "bugsnag.span.category" equals "app_start"
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "bugsnag.app_start.type" equals "ReactNativeInit"
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" bool attribute "bugsnag.app.in_foreground" is true

Scenario: A wrapper component provider can be provided as a config option
  When I run 'WrapperComponentProviderScenario'
  Given the element "wrapper-component" is present within 60 seconds 
  And the element "app-component" is present within 60 seconds 

  And I wait to receive a sampling request
  And I wait for 1 span

  # Check the initial probability request
  Then the sampling request "Bugsnag-Span-Sampling" header equals "1.0:0"
  
  And the trace "Bugsnag-Span-Sampling" header equals "1:1"
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "[AppStart/ReactNativeInit]"
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.kind" equals 3
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.spanId" matches the regex "^[A-Fa-f0-9]{16}$"
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.traceId" matches the regex "^[A-Fa-f0-9]{32}$"
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.startTimeUnixNano" matches the regex "^[0-9]+$"
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.endTimeUnixNano" matches the regex "^[0-9]+$"
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "bugsnag.span.category" equals "app_start"
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "bugsnag.app_start.type" equals "ReactNativeInit"


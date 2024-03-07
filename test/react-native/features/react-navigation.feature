@react_navigation
Feature: Navigation spans with React Navigation

  @skip_new_arch
  Scenario: Navigation Spans are automatically instrumented
    When I run 'ReactNavigationScenario'
    And I wait to receive a sampling request
    And I wait for 2 spans

    # Check the initial probability request
    Then the sampling request "Bugsnag-Span-Sampling" header equals "1.0:0"

    And the trace "Bugsnag-Span-Sampling" header equals "1:2"

    # App start span
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "[AppStart/ReactNativeInit]"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.kind" equals 3
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.spanId" matches the regex "^[A-Fa-f0-9]{16}$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.spanId" is stored as the value "parent_span_id"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.traceId" matches the regex "^[A-Fa-f0-9]{32}$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.startTimeUnixNano" matches the regex "^[0-9]+$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.endTimeUnixNano" matches the regex "^[0-9]+$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "bugsnag.span.category" equals "app_start"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "bugsnag.app_start.type" equals "ReactNativeInit"

    # Navigation span
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1.name" equals "[Navigation]Details"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1.kind" equals 3
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1.spanId" matches the regex "^[A-Fa-f0-9]{16}$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1.traceId" matches the regex "^[A-Fa-f0-9]{32}$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1.parentSpanId" equals the stored value "parent_span_id"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1.startTimeUnixNano" matches the regex "^[0-9]+$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1.endTimeUnixNano" matches the regex "^[0-9]+$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1" string attribute "bugsnag.span.category" equals "navigation"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1" string attribute "bugsnag.navigation.route" equals "Details"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1" string attribute "bugsnag.navigation.triggered_by" equals "@bugsnag/react-navigation-performance"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1" string attribute "bugsnag.navigation.ended_by" equals "immediate"

Feature: Navigation spans

  Scenario: Manual Navigation Spans can be logged
    When I run 'NavigationSpanScenario'
    And I wait to receive a sampling request
    And I wait for 1 span

    # Check the initial probability request
    Then the sampling request "Bugsnag-Span-Sampling" header equals "1.0:0"

    And the trace "Bugsnag-Span-Sampling" header equals "1:1"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "[Navigation]NavigationSpanScenario"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.kind" equals 3
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.spanId" matches the regex "^[A-Fa-f0-9]{16}$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.traceId" matches the regex "^[A-Fa-f0-9]{32}$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.startTimeUnixNano" matches the regex "^[0-9]+$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.endTimeUnixNano" matches the regex "^[0-9]+$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "bugsnag.span.category" equals "navigation"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "bugsnag.navigation.route" equals "NavigationSpanScenario"

Feature: Manual creation of spans

  Scenario: Manual spans can be logged
    Given I navigate to the test URL "/manual-span"
    When I wait for 1 span
    Then the trace "Bugsnag-Span-Sampling" header equals "1.0:1"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "Custom/ManualSpanScenario"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.kind" equals 3
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.spanId" matches the regex "^[A-Fa-f0-9]{16}$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.traceId" matches the regex "^[A-Fa-f0-9]{32}$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.startTimeUnixNano" matches the regex "^[0-9]+$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.endTimeUnixNano" matches the regex "^[0-9]+$"
    And the trace payload field "resourceSpans.0.resource" string attribute "telemetry.sdk.name" equals "bugsnag.performance.browser"
    And the trace payload field "resourceSpans.0.resource" string attribute "telemetry.sdk.version" equals "0.0.0"
    And the trace payload field "resourceSpans.0.resource" string attribute "deployment.environment" equals the stored value "environment"

  @chromium_only @local_only
  Scenario: userAgentData is included in custom span
    Given I navigate to the test URL "/manual-span"
    When I wait for 1 span
    Then the trace payload field "resourceSpans.0.resource" bool attribute "browser.mobile" is false
    And the trace payload field "resourceSpans.0.resource" string attribute "browser.platform" is one of:
      | Android |
      | Chrome OS |
      | Chromium OS |
      | iOS |
      | Linux |
      | macOS |
      | Windows |
      | Unknown |

  Scenario: Spans can be logged before start
    Given I navigate to the test URL "/pre-start-spans"
    When I wait to receive at least 1 trace
    Then a span name equals "Custom/Post Start"
    And a span name equals "Custom/Pre Start Span 0"
    And a span name equals "Custom/Pre Start Span 1"
    And a span name equals "Custom/Pre Start Span 2"

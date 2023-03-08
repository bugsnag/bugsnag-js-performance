Feature: Manual creation of spans

  Scenario: Manual spans can be logged
    Given I navigate to the test URL "/manual-span"
    And I wait to receive at least 1 trace
    Then the trace "Bugsnag-Span-Sampling" header equals "1.0:1"
    * the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "Custom/ManualSpanScenario"
    * the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.kind" equals 3
    * the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.spanId" matches the regex "^[A-Fa-f0-9]{16}$"
    * the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.traceId" matches the regex "^[A-Fa-f0-9]{32}$"
    * the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.startTimeUnixNano" matches the regex "^[0-9]+$"
    * the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.endTimeUnixNano" matches the regex "^[0-9]+$"

    * the trace payload field "resourceSpans.0.resource" string attribute "releaseStage" equals "production"
    * the trace payload field "resourceSpans.0.resource" string attribute "sdkName" equals "bugsnag.performance.browser"
    * the trace payload field "resourceSpans.0.resource" string attribute "sdkVersion" equals "0.0.0"

  @chromium_only @local_only
  Scenario: userAgentData is included in custom span
    Given I navigate to the test URL "/manual-span"
    And I wait to receive at least 1 trace
    Then the trace payload field "resourceSpans.0.resource" bool attribute "mobile" is false
    * the trace payload field "resourceSpans.0.resource" string attribute "platform" is one of:
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
    And I wait to receive at least 1 trace
    Then a span name equals "Custom/Post Start"
    * a span name equals "Custom/Pre Start Span 0"
    * a span name equals "Custom/Pre Start Span 1"
    * a span name equals "Custom/Pre Start Span 2"

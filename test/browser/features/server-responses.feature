Feature: Server responses

  Scenario: No Bugsnag-Sampling-Probability header
    Given I navigate to the test URL "/one-span-per-trace"
    When I click the element "send-span"
    And I wait to receive 1 trace
    Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "Span 1"

    When I discard the oldest trace
    And I click the element "send-span"
    And I wait to receive 1 trace
    Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "Span 2"

    When I discard the oldest trace
    And I click the element "send-span"
    And I wait to receive 1 trace
    Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "Span 3"

  Scenario: Bugsnag-Sampling-Probability header in response after 1 span
    Given I navigate to the test URL "/one-span-per-trace"
    When I set the sampling probability to "0.0"
    And I click the element "send-span"
    And I wait to receive 1 trace
    Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "Span 1"

    And I discard the oldest trace
    And I click the element "send-span"
    Then I should receive no traces

  Scenario: Bugsnag-Sampling-Probability header in response after 2 spans
    Given I navigate to the test URL "/one-span-per-trace"
    When I click the element "send-span"
    And I wait to receive 1 trace
    Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "Span 1"

    When I set the sampling probability to "0.0"
    And I discard the oldest trace
    And I click the element "send-span"
    And I wait to receive 1 trace
    Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "Span 2"

    When I discard the oldest trace
    And I click the element "send-span"
    Then I should receive no traces

Feature: Error correlation

  Scenario: Reported errors include the current trace and span id
    When I run 'ErrorCorrelationScenario'
    And I wait to receive a sampling request
    And I execute the command "start-bugsnag-notifier"
    And I wait to receive a session
    And I execute the command "start-span"
    And I execute the command "send-error"

    # Wait for the error
    And I wait to receive an error
    Then the error is a valid browser payload for the error reporting API

    # End the span
    And I execute the command "end-span"
    And I wait to receive 1 trace

    # Assert on the span, and store the trace id and span id
    Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.id" is stored as the value "spanId"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.traceid" is stored as the value "traceId"

    # Check span id is included in the error
    And the error payload field "events.0.correlation.spanId" equals the stored value "spanId"
    And the error payload field "events.0.correlation.traceId" equals the stored value "traceId"

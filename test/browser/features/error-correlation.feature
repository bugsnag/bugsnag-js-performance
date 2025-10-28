Feature: Error Correlation

  Scenario: Error does not include the correlation property when no spans are open
    Given I navigate to the test URL "/docs/error-correlation"
    And I wait to receive a sampling request
    And I click the element "send-error"
    And I wait to receive an error
    Then the error is a valid browser payload for the error reporting API
    And the error payload field "events.0.correlation" is null

  Scenario: Reported errors include the current trace and span id
    Given I navigate to the test URL "/docs/error-correlation"
    And I wait to receive a sampling request
    Then I click the element "start-span"
    And I wait for 1 second
    And I click the element "send-error"

    # Wait for the error
    And I wait to receive an error
    Then the error is a valid browser payload for the error reporting API

    # End the span
    Then I click the element "end-span"
    And I wait to receive a span named "Custom/ErrorCorrelationScenario"

    # Assert on the span, and store the trace id and span id
    Then the "spanId" field of the span named "Custom/ErrorCorrelationScenario" is stored as the value "spanId"
    And the "traceId" field of the span named "Custom/ErrorCorrelationScenario" is stored as the value "traceId"

    # Check span id is included in the error
    And the error payload field "events.0.correlation" is not null
    And the error payload field "events.0.correlation.spanId" equals the stored value "spanId"
    And the error payload field "events.0.correlation.traceId" equals the stored value "traceId"

  Scenario: Reported errors do not include the trace and span id if the span is not the current context
    Given I navigate to the test URL "/docs/error-correlation"
    And I wait to receive a sampling request
    Then I click the element "start-span"
    And I wait for 1 second
    Then I click the element "start-nested-span"
    And I wait for 1 second
    And I click the element "send-error"

    # Wait for the error
    And I wait to receive an error
    Then the error is a valid browser payload for the error reporting API

    # End the span
    Then I click the element "end-span"
    And I wait to receive a span named "Custom/ErrorCorrelationScenario"

    # Assert on the span, and store the trace id and span id
    Then the "spanId" field of the span named "Custom/ErrorCorrelationScenario" is stored as the value "spanId"
    And the "traceId" field of the span named "Custom/ErrorCorrelationScenario" is stored as the value "traceId"

    # End the child span
    Then I discard the oldest trace
    And I click the element "end-nested-span"
    And I wait to receive a span named "Custom/ChildSpan"

    # Store the child span id
    Then the "spanId" field of the span named "Custom/ChildSpan" is stored as the value "childSpanId"

    # Check span id is included in the error
    And the error payload field "events.0.correlation" is not null
    And the error payload field "events.0.correlation.spanId" equals the stored value "spanId"
    And the error payload field "events.0.correlation.spanId" does not equal the stored value "childSpanId"
    And the error payload field "events.0.correlation.traceId" equals the stored value "traceId"

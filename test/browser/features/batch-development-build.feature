Feature: Batch development build timing

  Scenario: Trace is sent after 5 seconds with batch development build
    Given I navigate to the test URL "/docs/batch-development-build"
    When I wait to receive 1 trace
    Then a span name equals "Custom/Batch Timeout"
    And the span named "Custom/Batch Timeout" was delivered approximately 5 seconds after ending

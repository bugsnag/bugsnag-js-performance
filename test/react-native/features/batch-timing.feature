Feature: Batch development build timing

  Scenario: Trace is sent after 5 seconds with batch development build
    When I run 'BatchTimingScenario'
    When I wait to receive 1 trace
    Then a span name equals 'Custom/Batch Timing'
    And the span named 'Custom/Batch Timing' was delivered approximately 5 seconds after ending

Feature: Span batching

  Scenario: Batch is successfully delivered after timeout 
    Given I navigate to the test URL "/batch-timeout"
    When I wait to receive at least 1 trace
    Then a span name equals "Custom/Batch Timeout"

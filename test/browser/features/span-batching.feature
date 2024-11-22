Feature: Span batching

  Scenario: Batch is successfully delivered after timeout 
    Given I navigate to the test URL "/batch-timeout"
    When I wait to receive 1 trace
    Then a span name equals "Custom/Batch Timeout"

  Scenario: Batch is successfully delivered after reaching max batch size
    Given I navigate to the test URL "/batch-max-limit"
    When I wait to receive 1 trace
    Then a span name equals "Custom/Full Batch 1"
    And a span name equals "Custom/Full Batch 2"
    And a span name equals "Custom/Full Batch 3"
    And a span name equals "Custom/Full Batch 4"
    And a span name equals "Custom/Full Batch 5"

  Scenario: Empty batch is not delivered after timeout
    Given I navigate to the test URL "/empty-batch"
    Then I should have received no spans

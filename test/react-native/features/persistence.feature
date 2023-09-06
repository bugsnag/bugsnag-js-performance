Feature: Persistence

  Scenario: Sampling values are persisted
    Given I clear all persistent data
    And I set the sampling probability to "0.0"
    And I run "ManualSpanScenario"
    And I wait to receive a sampling request

    # Initial sampling request with no persisted sampling probability.
    Then the sampling request "Bugsnag-Span-Sampling" header equals "1.0:0"

    # Sampling value should be persisted, meaning no sampling request is made, and no spans are delivered.
    When I relaunch the app
    And I run "ManualSpanScenario"
    Then I should receive no sampling request
    And I should receive no traces

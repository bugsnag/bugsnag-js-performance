Feature: Persistence

  Scenario: Sampling values are persisted
    Given I set the sampling probability to "0.0"
    And I run 'PersistSamplingValueScenario'

    # Ensure maze-runner did what we expected.
    When I wait to receive a sampling request
    Then the sampling request "Bugsnag-Span-Sampling" header equals "0.0:0"

    # Sampling value should be persisted, meaning no sampling request is made, and no spans are delivered.
    When I run 'ManualSpanScenario'
    # Then I should receive no sampling request
    And I should receive no traces

Feature: Backgrounding listener

  Scenario: Spans are discarded when app is in the background
    When I run 'BackgroundSpanScenario'
    And I wait to receive a sampling request
    And I send the app to the background for 10 seconds
    Then I wait to receive 1 span
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "foreground span"

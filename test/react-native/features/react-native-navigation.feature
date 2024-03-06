@react_native_navigation
Feature: Navigation spans with React Native Navigation

  Scenario: Navigation Spans are automatically instrumented
    When I run 'RNNChangeRouteScenario'
    And I wait to receive a sampling request

    # Check the initial probability request
    Then the sampling request "Bugsnag-Span-Sampling" header equals "1.0:0"

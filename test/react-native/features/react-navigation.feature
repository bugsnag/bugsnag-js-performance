@react_navigation
Feature: Navigation spans with React Navigation

  @skip_new_arch
  Scenario: Navigation Spans are automatically instrumented
    When I run 'ReactNavigationScenario'
    And I wait to receive a sampling request
    And I wait for 2 spans

    # Check the initial probability request
    Then the sampling request "Bugsnag-Span-Sampling" header equals "1.0:0"

    And the trace "Bugsnag-Span-Sampling" header equals "1:2"
    And a span named "[Navigation]Details" has a parent named "ParentSpan"
    And a span named "[Navigation]Details" contains the attributes:
      | attribute                       | type        | value                                 |
      | bugsnag.span.category           | stringValue | navigation                            |
      | bugsnag.navigation.route        | stringValue | Details                               |
      | bugsnag.navigation.triggered_by | stringValue | @bugsnag/react-navigation-performance |
      | bugsnag.navigation.ended_by     | stringValue | immediate                             |
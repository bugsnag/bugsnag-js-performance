@react_navigation
Feature: Navigation spans with React Navigation

  @skip_new_arch
  Scenario: Navigation Spans are automatically instrumented
    When I run 'ReactNavigationScenario'
    And I wait to receive a sampling request
    And I wait for 3 spans

    # Check the initial probability request
    Then the sampling request "Bugsnag-Span-Sampling" header equals "1.0:0"

    And the trace "Bugsnag-Span-Sampling" header equals "1:2"
    And a span named "[Navigation]Screen2" has a parent named "ParentSpan"
    And a span named "[Navigation]Screen2" contains the attributes:
      | attribute                       | type        | value                                 |
      | bugsnag.span.category           | stringValue | navigation                            |
      | bugsnag.navigation.route        | stringValue | Screen2                               |
      | bugsnag.navigation.triggered_by | stringValue | @bugsnag/react-navigation-performance |
      | bugsnag.navigation.ended_by     | stringValue | immediate                             |

    And a span named "[Navigation]Screen3" has a parent named "ParentSpan"
    And a span named "[Navigation]Screen3" contains the attributes:
      | attribute                         | type        | value                                 |
      | bugsnag.span.category             | stringValue | navigation                            |
      | bugsnag.navigation.route          | stringValue | Screen3                               |
      | bugsnag.navigation.previous_route | stringValue | Screen2                               |
      | bugsnag.navigation.triggered_by   | stringValue | @bugsnag/react-navigation-performance |
      | bugsnag.navigation.ended_by       | stringValue | immediate                             |

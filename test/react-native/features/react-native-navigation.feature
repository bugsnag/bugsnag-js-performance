@react_native_navigation
Feature: Navigation spans with React Native Navigation

  Scenario: Navigation Spans are automatically instrumented
    When I run 'ReactNativeNavigationScenario'
    And I wait to receive a sampling request
    And I wait for 1 span

    # Check the initial probability request
    Then the sampling request "Bugsnag-Span-Sampling" header equals "1.0:0"

    And the trace "Bugsnag-Span-Sampling" header equals "1:2"

    And a span named "[AppStart/ReactNativeInit]" contains the attributes:
      | attribute                       | type        | value                                 |
      | bugsnag.span.category           | stringValue | app_start                             |
      | bugsnag.app_start.type          | stringValue | ReactNativeInit                       |

    And a span named "[Navigation]Screen 1" has a parent named "[AppStart/ReactNativeInit]"
    And a span named "[Navigation]Screen 1" contains the attributes:
      | attribute                       | type        | value                                        |
      | bugsnag.span.category           | stringValue | navigation                                   |
      | bugsnag.navigation.route        | stringValue | Screen 1                                     |
      | bugsnag.navigation.triggered_by | stringValue | @bugsnag/react-native-navigation-performance |
      | bugsnag.navigation.ended_by     | stringValue | immediate                                    |

    And a span named "[Navigation]Screen 2" contains the attributes:
      | attribute                         | type        | value                                        |
      | bugsnag.span.category             | stringValue | navigation                                   |
      | bugsnag.navigation.route          | stringValue | Screen 2                                     |
      | bugsnag.navigation.triggered_by   | stringValue | @bugsnag/react-native-navigation-performance |
      # | bugsnag.navigation.previous_route | stringValue | Screen 1                                     |
      # | bugsnag.navigation.ended_by       | stringValue | condition                                    |

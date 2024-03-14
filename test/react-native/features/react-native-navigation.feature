@react_native_navigation
Feature: React native navigation support

  Scenario: Navigation spans are automatically instrumented
    When I run 'ReactNativeNavigationScenario'
    And I wait to receive a sampling request
    And I wait for 1 span

    Then a span named "[Navigation]Screen 1" contains the attributes:
      | attribute                       | type        | value                                        |
      | bugsnag.span.category           | stringValue | navigation                                   |
      | bugsnag.navigation.route        | stringValue | Screen 1                                     |
      | bugsnag.navigation.triggered_by | stringValue | @bugsnag/react-native-navigation-performance |
      | bugsnag.navigation.ended_by     | stringValue | immediate                                    |

    When I discard the oldest trace
    And I navigate to "Screen 2"
    And I wait for 1 span

    Then a span named "[Navigation]Screen 2" contains the attributes:
      | attribute                         | type        | value                                        |
      | bugsnag.span.category             | stringValue | navigation                                   |
      | bugsnag.navigation.route          | stringValue | Screen 2                                     |
      | bugsnag.navigation.triggered_by   | stringValue | @bugsnag/react-native-navigation-performance |
      | bugsnag.navigation.previous_route | stringValue | Screen 1                                     |
      | bugsnag.navigation.ended_by       | stringValue | condition                                    |


    When I discard the oldest trace
    And I navigate to "Screen 3"
    And I wait for 1 span

    Then a span named "[Navigation]Screen 3" contains the attributes:
      | attribute                         | type        | value                                        |
      | bugsnag.span.category             | stringValue | navigation                                   |
      | bugsnag.navigation.route          | stringValue | Screen 3                                     |
      | bugsnag.navigation.triggered_by   | stringValue | @bugsnag/react-native-navigation-performance |
      | bugsnag.navigation.previous_route | stringValue | Screen 2                                     |
      | bugsnag.navigation.ended_by       | stringValue | mount                                        |

    When I discard the oldest trace
    And I navigate to "Screen 4"
    And I wait for 1 span

    Then a span named "[Navigation]Screen 4" contains the attributes:
      | attribute                         | type        | value                                        |
      | bugsnag.span.category             | stringValue | navigation                                   |
      | bugsnag.navigation.route          | stringValue | Screen 4                                     |
      | bugsnag.navigation.triggered_by   | stringValue | @bugsnag/react-native-navigation-performance |
      | bugsnag.navigation.previous_route | stringValue | Screen 3                                     |
      | bugsnag.navigation.ended_by       | stringValue | unmount                                      |

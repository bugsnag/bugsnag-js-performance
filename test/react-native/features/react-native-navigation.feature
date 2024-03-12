@react_native_navigation
Feature: Navigation spans with React Native Navigation

  Scenario: Navigation Spans are automatically instrumented
    When I run 'ReactNativeNavigationScenario'
    And I wait to receive a sampling request
    And I wait for 6 spans

    # Check the initial probability request
    Then the sampling request "Bugsnag-Span-Sampling" header equals "1.0:0"

    And the trace "Bugsnag-Span-Sampling" header equals "1:6"

    And a span named "[AppStart/ReactNativeInit]" contains the attributes:
      | attribute                       | type        | value                                 |
      | bugsnag.span.category           | stringValue | app_start                             |
      | bugsnag.app_start.type          | stringValue | ReactNativeInit                       |

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
      | bugsnag.navigation.previous_route | stringValue | Screen 1                                     |
      | bugsnag.navigation.ended_by       | stringValue | condition                                    |

    And a span named "[Navigation]Screen 3" contains the attributes:
      | attribute                         | type        | value                                        |
      | bugsnag.span.category             | stringValue | navigation                                   |
      | bugsnag.navigation.route          | stringValue | Screen 3                                     |
      | bugsnag.navigation.triggered_by   | stringValue | @bugsnag/react-native-navigation-performance |
      | bugsnag.navigation.previous_route | stringValue | Screen 2                                     |
      | bugsnag.navigation.ended_by       | stringValue | mount                                        |

    And a span named "[Navigation]Screen 4" contains the attributes:
      | attribute                         | type        | value                                        |
      | bugsnag.span.category             | stringValue | navigation                                   |
      | bugsnag.navigation.route          | stringValue | Screen 4                                     |
      | bugsnag.navigation.triggered_by   | stringValue | @bugsnag/react-native-navigation-performance |
      | bugsnag.navigation.previous_route | stringValue | Screen 3                                     |
      | bugsnag.navigation.ended_by       | stringValue | unmount                                      |

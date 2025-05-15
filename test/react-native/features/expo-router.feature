@expo
Feature: Navigation spans with Expo Router

  Scenario: Navigation Spans are automatically instrumented
    When I run 'ExpoRouterScenario'
    And I wait to receive a sampling request
    And I wait for 4 spans

    # Check the initial probability request
    Then the sampling request "Bugsnag-Span-Sampling" header equals "1.0:0"

    And the trace "Bugsnag-Span-Sampling" header equals "1:4"

    And a span named "[Navigation]two" contains the attributes:
      | attribute                         | type        | value                                        |
      | bugsnag.span.category             | stringValue | navigation                                   |
      | bugsnag.navigation.route          | stringValue | two                                          |
      | bugsnag.navigation.previous_route | stringValue | index                                        |
      | bugsnag.navigation.triggered_by   | stringValue | @bugsnag/plugin-react-navigation-performance |
      | bugsnag.navigation.ended_by       | stringValue | immediate                                    |

    And a span named "[Navigation]three" contains the attributes:
      | attribute                         | type        | value                                        |
      | bugsnag.span.category             | stringValue | navigation                                   |
      | bugsnag.navigation.route          | stringValue | three                                        |
      | bugsnag.navigation.previous_route | stringValue | two                                          |
      | bugsnag.navigation.triggered_by   | stringValue | @bugsnag/plugin-react-navigation-performance |
      | bugsnag.navigation.ended_by       | stringValue | immediate                                    |

    And a span named "[Navigation]four" contains the attributes:
      | attribute                         | type        | value                                        |
      | bugsnag.span.category             | stringValue | navigation                                   |
      | bugsnag.navigation.route          | stringValue | four                                         |
      | bugsnag.navigation.previous_route | stringValue | three                                        |
      | bugsnag.navigation.triggered_by   | stringValue | @bugsnag/plugin-react-navigation-performance |
      | bugsnag.navigation.ended_by       | stringValue | immediate                                    |

    And a span named "[Navigation]five" contains the attributes:
      | attribute                         | type        | value                                        |
      | bugsnag.span.category             | stringValue | navigation                                   |
      | bugsnag.navigation.route          | stringValue | five                                         |
      | bugsnag.navigation.previous_route | stringValue | four                                         |
      | bugsnag.navigation.triggered_by   | stringValue | @bugsnag/plugin-react-navigation-performance |
      | bugsnag.navigation.ended_by       | stringValue | immediate                                    |

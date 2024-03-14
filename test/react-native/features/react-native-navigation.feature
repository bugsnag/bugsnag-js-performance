@react_native_navigation
Feature: React native navigation support

  Scenario: Navigation spans are automatically instrumented
    When I run 'ReactNativeNavigationScenario'
    And I wait to receive a sampling request
    And I wait for 1 span

    # And a span named "[AppStart/ReactNativeInit]" contains the attributes:
    #   | attribute                       | type        | value                                 |
    #   | bugsnag.span.category           | stringValue | app_start                             |
    #   | bugsnag.app_start.type          | stringValue | ReactNativeInit                       |

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

  Scenario: App starts are automatically instrumented
    When I run 'AppStartScenario'
    And I wait to receive a sampling request
    And I wait for 1 span

    # Check the initial probability request
    Then the sampling request "Bugsnag-Span-Sampling" header equals "1.0:0"

    And the trace "Bugsnag-Span-Sampling" header equals "1:1"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "[AppStart/ReactNativeInit]"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.kind" equals 3
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.spanId" matches the regex "^[A-Fa-f0-9]{16}$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.traceId" matches the regex "^[A-Fa-f0-9]{32}$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.startTimeUnixNano" matches the regex "^[0-9]+$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.endTimeUnixNano" matches the regex "^[0-9]+$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "bugsnag.span.category" equals "app_start"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "bugsnag.app_start.type" equals "ReactNativeInit"

  Scenario: A wrapper component provider can be provided as a config option
    When I run 'WrapperComponentProviderScenario'
    Given the element "wrapper-component" is present within 60 seconds 
    And the element "app-component" is present within 60 seconds 

    And I wait to receive a sampling request
    And I wait for 1 span

    # Check the initial probability request
    Then the sampling request "Bugsnag-Span-Sampling" header equals "1.0:0"
    
    And the trace "Bugsnag-Span-Sampling" header equals "1:1"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "[AppStart/ReactNativeInit]"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.kind" equals 3
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.spanId" matches the regex "^[A-Fa-f0-9]{16}$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.traceId" matches the regex "^[A-Fa-f0-9]{32}$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.startTimeUnixNano" matches the regex "^[0-9]+$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.endTimeUnixNano" matches the regex "^[0-9]+$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "bugsnag.span.category" equals "app_start"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "bugsnag.app_start.type" equals "ReactNativeInit"

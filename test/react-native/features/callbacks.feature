Feature: Span callbacks

  Scenario: Span attributes can be modified in callbacks
    When I run 'SpanCallbacksScenario'
    And I wait to receive a sampling request
    And I wait to receive at least 2 spans

    Then a span named "Span 1" contains the attributes:
      | attribute                         | type        | value                                        |
      | bugsnag.span.category             | stringValue | custom                                       |
      | start_callback                    | intValue    | 1                                            |
      | end_callback                      | boolValue   | true                                         |

    And a span named "Span 2" contains the attributes:
      | attribute                         | type        | value                                        |
      | bugsnag.span.category             | stringValue | custom                                       |
      | start_callback                    | intValue    | 2                                            |
      | end_callback                      | boolValue   | true                                         |

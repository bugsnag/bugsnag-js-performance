Feature: Custom attributes

    Scenario: Custom attributes can be added to spans
        Given I navigate to the test URL "/custom-attributes"
        And I wait for 1 span

        Then a span named "Custom/CustomAttributesScenario" contains the attributes: 
            | attribute                                 | type         | value                | 
            | bugsnag.span.category                     | stringValue  | custom               |
            | custom.string                             | stringValue  | custom attribute     |
            | custom.int                                | intValue     | 12345                |
            | custom.double                             | doubleValue  | 123.45               |
            | custom.bool.true                          | boolValue    | true                 |
            | custom.bool.false                         | boolValue    | false                |
            | custom.array.empty                        | arrayValue   | {}                   |

        And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string array attribute "custom.array.string" equals the array:
            | one   |
            | two   |
            | three |

        And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" integer array attribute "custom.array.int" equals the array:
            | 1   |
            | 2   |
            | 3   |

        And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" double array attribute "custom.array.double" equals the array:
            | 1.1   |
            | 2.2   |
            | 3.3   |

        And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" boolean array attribute "custom.array.bool" equals the array:
            | true   |
            | false  |
            | true   |

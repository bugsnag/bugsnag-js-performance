Feature: Custom attributes

    Scenario: Custom attributes can be added to spans
        Given I navigate to the test URL "/custom-attributes"
        And I wait for 1 span

        Then a span named "Custom/CustomAttributesScenario" contains the attributes: 
            | attribute                                 | type         | value                | 
            | bugsnag.span.category                     | stringValue  | custom               |
            | custom.string                             | stringValue  | custom attribute     |
            | custom.int                                | doubleValue  | 12345                |
            | custom.bool.true                          | boolValue    | true                 |
            | custom.bool.false                         | boolValue    | false                |
            # | custom.array.empty                        | arrayValue   | values               |
            # | custom.array.string                       | arrayValue   | values               |
            # | custom.array.int                          | arrayValue   | values               |
            # | custom.array.bool                         | arrayValue   | values               |
            # | custom.array.mixed                        | arrayValue   | values               |

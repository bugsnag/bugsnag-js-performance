@native_integration
Feature: Native Integration

  Scenario: Native Integration
    When I run 'NativeIntegrationScenario'
    And I wait to receive 2 spans
    Then a span named "Native child span" has a parent named "JS parent span"
    And a span named "Native child span" contains the attributes:
            | attribute                         | type             | value                    |
            | bugsnag.span.category             | stringValue      | custom                   |
            | bugsnag.span.first_class          | boolValue        | true                     |
            | custom.native.attribute           | stringValue      | Native span attribute    |
    And a span named "JS parent span" contains the attributes:
            | attribute                         | type             | value                    |
            | bugsnag.span.category             | stringValue      | custom                   |
            | custom.native.attribute           | stringValue      | JS span attribute        |

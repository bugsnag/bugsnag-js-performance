@native_integration
Feature: Native Integration

  Scenario: Native Integration
    When I run 'NativeIntegrationScenario'
    And I wait for 60 seconds
    Then a span named "NativeIntegration" contains the attributes:
            | attribute                         | type             | value                    |
            | bugsnag.span.first_class          | boolValue        | true                     |


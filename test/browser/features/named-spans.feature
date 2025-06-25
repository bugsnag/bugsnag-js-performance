@skip_on_cdn_build
Feature: Named span access plugin

  Scenario: Spans can be queried by name
    Given I navigate to the test URL "/docs/named-spans"
    And I wait for 1 span

    Then a span named "Span 1" contains the attributes: 
    | attribute             | type         | value  | 
    | bugsnag.span.category | stringValue  | custom |
    | custom_attribute      | boolValue    | true   |



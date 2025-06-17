Feature: Named span access plugin

  Scenario: Spans can be queried by name
    When I run 'NamedSpansPluginScenario'
    And I wait to receive a sampling request
    And I wait for 1 span

    Then a span named "NamedSpansPluginScenario" contains the attributes: 
    | attribute             | type         | value  | 
    | bugsnag.span.category | stringValue  | custom |
    | custom_attribute      | boolValue    | true   |
Feature: Manual spans

Scenario: Manual Spans can be logged
  When I run 'ManualSpanScenario'
  And I wait to receive a sampling request
  And I wait for 1 span
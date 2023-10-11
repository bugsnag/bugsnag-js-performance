Feature: Nested spans

Scenario: Spans can be nested
  When I run 'NestedSpansScenario'
  And I wait to receive a sampling request
  And I wait to receive at least 1 trace

  # All child spans should have parents
  And a span named 'Nested Span 1' has a parent named 'Parent Span'
  And a span named 'Nested Span 2' has a parent named 'Parent Span'
  And a span named 'Nested Span 3' has a parent named 'Parent Span'
  
Feature: Nested spans

Scenario: Spans can be nested
  When I run 'NestedSpansScenario'
  And I wait to receive a sampling request
  And I wait to receive at least 1 trace

  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "Nested Span 1"
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1.name" equals "Nested Span 2"
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.2.name" equals "Nested Span 3"

  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.3.name" equals "Parent Span"
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.3.spanId" is stored as the value "parent_span_id"

  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.parentSpanId" equals the stored value "parent_span_id"
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1.parentSpanId" equals the stored value "parent_span_id"
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.2.parentSpanId" equals the stored value "parent_span_id"

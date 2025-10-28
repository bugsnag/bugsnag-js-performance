@native_integration
Feature: React native span access

Scenario: Native spans can be modified and ended from JS
  When I run 'NativeSpansPluginScenario'
  And I wait to receive 2 sampling requests
  And I wait to receive 2 traces

  # JS trace
  And the trace payload field "resourceSpans.0.resource" string attribute "service.name" equals "com.bugsnag.fixtures.reactnative.performance"
  And the trace payload field "resourceSpans.0.resource" string attribute "telemetry.sdk.name" equals "bugsnag.performance.reactnative"
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "NativeSpansPluginScenarioChild"
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" double attribute "bugsnag.sampling.p" equals 1.0
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "bugsnag.span.category" equals "custom"

  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.parentSpanId" is stored as the value "parentSpanId"
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.traceId" is stored as the value "traceId"

  Then I discard the oldest trace

  # Native trace
  And the trace payload field "resourceSpans.0.resource" string attribute "service.name" equals "com.bugsnag.fixtures.reactnative.performance"
  And the trace payload field "resourceSpans.0.resource" string attribute "telemetry.sdk.name" equals the platform-dependent string:
      | ios     | bugsnag.performance.cocoa   |
      | android | bugsnag.performance.android |

  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "NativeSpansPluginScenarioParent"
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.spanId" equals the stored value "parentSpanId"
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.traceId" equals the stored value "traceId"

  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" double attribute "bugsnag.sampling.p" equals 1.0
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "bugsnag.span.category" equals "custom"
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" boolean attribute "bugsnag.span.first_class" is true

  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "custom.string.attribute" equals "test"
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" integer attribute "custom.int.attribute" equals 12345
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" double attribute "custom.double.attribute" equals 123.45
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" boolean attribute "custom.boolean.attribute" is true
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string array attribute "custom.stringarray.attribute" equals the array:
      | a |
      | b |
      | c |
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" integer array attribute "custom.intarray.attribute" equals the array:
      | 1 |
      | 2 |
      | 3 |
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" double array attribute "custom.doublearray.attribute" equals the array:
      | 1.1 |
      | 2.2 |
      | 3.3 |

Scenario: Javascript spans can be modified and ended from native
  When I run 'JavascriptSpansPluginScenario'
  And I wait to receive 1 span

  Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "JavascriptSpansPluginScenario"
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "bugsnag.span.category" equals "custom"
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "custom.string.attribute" equals "test"
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" integer attribute "custom.int.attribute" equals 12345
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" double attribute "custom.double.attribute" equals 123.45
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" boolean attribute "custom.boolean.attribute" is true
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string array attribute "custom.stringarray.attribute" equals the array:
      | a |
      | b |
      | c |
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" integer array attribute "custom.intarray.attribute" equals the array:
      | 1 |
      | 2 |
      | 3 |
  And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" double array attribute "custom.doublearray.attribute" equals the array:
      | 1.1 |
      | 2.2 |
      | 3.3 |

Scenario: Native spans can be started with a JS parent
  When I run 'JavascriptSpansContextScenario'
  And I wait to receive 2 spans
  Then a span named 'Native Child Span' has a parent named 'JavascriptSpansContextScenario'

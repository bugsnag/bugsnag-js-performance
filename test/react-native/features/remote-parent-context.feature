@native_integration
Feature: Remote Parent Context

  Scenario: JS spans can be encoded as traceparent strings
    When I run 'RemoteParentContextJSScenario'
    And I wait to receive 2 sampling requests
    And I wait to receive 2 traces

    # JS trace
    And the trace payload field "resourceSpans.0.resource" string attribute "service.name" equals "com.bugsnag.fixtures.reactnative.performance"
    And the trace payload field "resourceSpans.0.resource" string attribute "telemetry.sdk.name" equals "bugsnag.performance.reactnative"
    
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "JS parent span"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" double attribute "bugsnag.sampling.p" equals 1.0
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "bugsnag.span.category" equals "custom"

    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.spanId" is stored as the value "parentSpanId"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.traceId" is stored as the value "traceId"

    Then I discard the oldest trace

    # Native trace
    And the trace payload field "resourceSpans.0.resource" string attribute "service.name" equals "com.bugsnag.fixtures.reactnative.performance"
    And the trace payload field "resourceSpans.0.resource" string attribute "telemetry.sdk.name" equals the platform-dependent string:
        | ios     | bugsnag.performance.cocoa   |
        | android | bugsnag.performance.android |

    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "Native child span"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.parentSpanId" equals the stored value "parentSpanId"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.traceId" equals the stored value "traceId"

  Scenario: Native spans can be encoded as traceparent strings
    When I run 'RemoteParentContextNativeScenario'
    And I wait to receive 2 sampling requests
    And I wait to receive 2 traces

    # JS trace
    And the trace payload field "resourceSpans.0.resource" string attribute "service.name" equals "com.bugsnag.fixtures.reactnative.performance"
    And the trace payload field "resourceSpans.0.resource" string attribute "telemetry.sdk.name" equals "bugsnag.performance.reactnative"
    
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "JS child span"
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

    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "Native parent span"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.spanId" equals the stored value "parentSpanId"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.traceId" equals the stored value "traceId"



@native_integration
Feature: Rendering Metrics

  Scenario: Rendering metrics are reported
    When I run 'RenderingMetricsScenario'
    And I wait to receive 1 trace

    # Native trace
    Then the trace payload field "resourceSpans.0.resource" string attribute "service.name" equals "com.bugsnag.fixtures.reactnative.performance"
    And the trace payload field "resourceSpans.0.resource" string attribute "telemetry.sdk.name" equals the platform-dependent string:
        | ios     | bugsnag.performance.cocoa   |
        | android | bugsnag.performance.android |

    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "RenderingMetricsScenario"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" integer attribute "bugsnag.rendering.total_frames" is greater than 0
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" integer attribute "bugsnag.rendering.slow_frames" is greater than 0

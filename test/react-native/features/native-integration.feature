@native_integration
Feature: Native Integration

  Scenario: First class custom spans are delegated to the native SDK
    When I run 'NativeIntegrationScenario'
    And I wait to receive 2 traces
    Then a span named "Native child span" has a parent named "JS parent span"
    And a span named "Native child span" contains the attributes:
        | attribute                         | type             | value                    |
        | bugsnag.span.category             | stringValue      | custom                   |
        | bugsnag.span.first_class          | boolValue        | true                     |
        | custom.native.attribute           | stringValue      | Native span attribute    |
    And a span named "JS parent span" contains the attributes:
        | attribute                         | type             | value                    |
        | bugsnag.span.category             | stringValue      | custom                   |
        | custom.js.attribute               | stringValue      | JS span attribute        |

    And the trace payload field "resourceSpans.0.resource" string attribute "telemetry.sdk.name" equals "bugsnag.performance.reactnative"

    Then I discard the oldest trace
    And the trace payload field "resourceSpans.0.resource" string attribute "telemetry.sdk.name" equals the platform-dependent string:
        | ios     | bugsnag.performance.cocoa   |
        | android | bugsnag.performance.android |

  Scenario: App start spans are delegated to the native SDK
    When I run 'NativeIntegrationAppStartScenario'
    And I relaunch the app after shutdown
    And I wait for 1 span
    Then a span named "[AppStart/ReactNativeInit]" contains the attributes:
        | attribute                         | type             | value              |
        | bugsnag.span.category             | stringValue      | app_start          |
        | bugsnag.app_start.type            | stringValue      | ReactNativeInit    |
        | bugsnag.span.first_class          | boolValue        | true               |
    And the trace payload field "resourceSpans.0.resource" string attribute "telemetry.sdk.name" equals the platform-dependent string:
        | ios     | bugsnag.performance.cocoa   |
        | android | bugsnag.performance.android |
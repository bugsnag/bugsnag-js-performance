Feature: Manual spans

  Scenario: Manual Spans can be logged
    When I run 'ManualSpanScenario'
    And I wait to receive a sampling request
    And I wait for 1 span

    # Check the initial probability request
    Then the sampling request "Bugsnag-Span-Sampling" header equals "1.0:0"

    And the trace "Bugsnag-Span-Sampling" header equals "1:1"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "ManualSpanScenario"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.kind" equals 3
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.spanId" matches the regex "^[A-Fa-f0-9]{16}$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.traceId" matches the regex "^[A-Fa-f0-9]{32}$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.startTimeUnixNano" matches the regex "^[0-9]+$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.endTimeUnixNano" matches the regex "^[0-9]+$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "bugsnag.span.category" equals "custom"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" bool attribute "bugsnag.app.in_foreground" is true
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "net.host.connection.type" equals "wifi"

    And the trace payload field "resourceSpans.0.resource" string attribute "telemetry.sdk.name" equals "bugsnag.performance.reactnative"
    And the trace payload field "resourceSpans.0.resource" string attribute "deployment.environment" equals "production"
    And the trace payload field "resourceSpans.0.resource" string attribute "device.id" matches the regex "^c[a-z0-9]{20,32}$"
    And the trace payload field "resourceSpans.0.resource" string attribute "service.version" equals "1.2.3"
    And the trace payload field "resourceSpans.0.resource" string attribute "os.version" exists
    And the trace payload field "resourceSpans.0.resource" string attribute "os.type" equals the platform-dependent string:
      | ios     | darwin |
      | android | linux  |
    And the trace payload field "resourceSpans.0.resource" string attribute "os.name" equals the platform-dependent string:
      | ios     | ios     |
      | android | android |
    And the trace payload field "resourceSpans.0.resource" string attribute "bugsnag.app.platform" equals the platform-dependent string:
      | ios     | ios     |
      | android | android |
    And the trace payload field "resourceSpans.0.resource" string attribute "device.manufacturer" equals the platform-dependent string:
      | ios     | Apple     |
      | android | @not_null |
    And the trace payload field "resourceSpans.0.resource" string attribute "bugsnag.device.android_api_version" equals the platform-dependent string:
      | ios     | @skip     |
      | android | @not_null |

  Scenario: Spans can be logged from the background
    When I run 'BackgroundSpanScenario'
    And I wait to receive a sampling request
    And I send the app to the background
    And I wait for 1 span

    # Check the initial probability request
    Then the sampling request "Bugsnag-Span-Sampling" header equals "1.0:0"

    And the trace "Bugsnag-Span-Sampling" header equals "1:1"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "BackgroundSpan"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.kind" equals 3
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.spanId" matches the regex "^[A-Fa-f0-9]{16}$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.traceId" matches the regex "^[A-Fa-f0-9]{32}$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.startTimeUnixNano" matches the regex "^[0-9]+$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.endTimeUnixNano" matches the regex "^[0-9]+$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "bugsnag.span.category" equals "custom"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" bool attribute "bugsnag.app.in_foreground" is false

    And the trace payload field "resourceSpans.0.resource" string attribute "telemetry.sdk.name" equals "bugsnag.performance.reactnative"
    And the trace payload field "resourceSpans.0.resource" string attribute "deployment.environment" equals "production"
    And the trace payload field "resourceSpans.0.resource" string attribute "device.id" matches the regex "^c[a-z0-9]{20,32}$"
    And the trace payload field "resourceSpans.0.resource" string attribute "service.version" equals "1.2.3"
    And the trace payload field "resourceSpans.0.resource" string attribute "os.version" exists
    And the trace payload field "resourceSpans.0.resource" string attribute "os.type" equals the platform-dependent string:
      | ios     | darwin |
      | android | linux  |
    And the trace payload field "resourceSpans.0.resource" string attribute "os.name" equals the platform-dependent string:
      | ios     | ios     |
      | android | android |
    And the trace payload field "resourceSpans.0.resource" string attribute "bugsnag.app.platform" equals the platform-dependent string:
      | ios     | ios     |
      | android | android |
    And the trace payload field "resourceSpans.0.resource" string attribute "device.manufacturer" equals the platform-dependent string:
      | ios     | Apple     |
      | android | @not_null |
    And the trace payload field "resourceSpans.0.resource" string attribute "bugsnag.device.android_api_version" equals the platform-dependent string:
      | ios     | @skip     |
      | android | @not_null |

  @skip_ios_old_arch
  Scenario: Native resource attributes are recorded
    When I run 'ManualSpanScenario'
    And I wait to receive a sampling request
    And I wait for 1 span
    Then the trace payload field "resourceSpans.0.resource" string attribute "service.name" equals "com.bugsnag.fixtures.reactnative.performance"
    And the trace payload field "resourceSpans.0.resource" string attribute "host.arch" exists
    And the trace payload field "resourceSpans.0.resource" string attribute "device.model.identifier" exists
    And the trace payload field "resourceSpans.0.resource" string attribute "bugsnag.app.version_code" equals the platform-dependent string:
      | ios     | @skip |
      | android | 1     |
    And the trace payload field "resourceSpans.0.resource" string attribute "bugsnag.app.bundle_version" equals the platform-dependent string:
      | ios     | 1     |
      | android | @skip |
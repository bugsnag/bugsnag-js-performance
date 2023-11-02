Feature: App Start spans

Scenario: App starts are automatically instrumented
  When I run 'AppStartScenario'
  And I wait to receive a sampling request
  And I wait for 4 spans

  # Check the initial probability request
  Then the sampling request "Bugsnag-Span-Sampling" header equals "1.0:0"

  And the trace "Bugsnag-Span-Sampling" header equals "1:4"
  And every span field "spanId" matches the regex "^[A-Fa-f0-9]{16}$"
  And every span field "traceId" matches the regex "^[A-Fa-f0-9]{32}$"
  And every span field "startTimeUnixNano" matches the regex "^[0-9]+$"
  And every span field "endTimeUnixNano" matches the regex "^[0-9]+$"

  And a span named "[AppStart/ReactNativeInit]" contains the attributes:
    | attribute                 | type        | value           |
    | bugsnag.span.category     | stringValue | app_start       |
    | bugsnag.app_start.type    | stringValue | ReactNativeInit |
    | bugsnag.app.in_foreground | boolValue   | true            |

  And a span named "BugSnag client started" has a parent named "[AppStart/ReactNativeInit]"
  And a span named "AppStartWrapper (FC) rendered" has a parent named "[AppStart/ReactNativeInit]"
  And a span named "DiagnosticWrapper (CC) rendered" has a parent named "AppStartWrapper (FC) rendered"

Scenario: A wrapper component provider can be provided as a config option
  When I run 'WrapperComponentProviderScenario'
  Given the element "wrapper-component" is present within 60 seconds 
  And the element "app-component" is present within 60 seconds 

  And I wait to receive a sampling request
  And I wait for 4 spans

  # Check the initial probability request
  Then the sampling request "Bugsnag-Span-Sampling" header equals "1.0:0"
  
  And the trace "Bugsnag-Span-Sampling" header equals "1:4"
  And every span field "spanId" matches the regex "^[A-Fa-f0-9]{16}$"
  And every span field "traceId" matches the regex "^[A-Fa-f0-9]{32}$"
  And every span field "startTimeUnixNano" matches the regex "^[0-9]+$"
  And every span field "endTimeUnixNano" matches the regex "^[0-9]+$"

  And a span named "[AppStart/ReactNativeInit]" contains the attributes:
    | attribute                 | type        | value           |
    | bugsnag.span.category     | stringValue | app_start       |
    | bugsnag.app_start.type    | stringValue | ReactNativeInit |
    | bugsnag.app.in_foreground | boolValue   | true            |

  And a span named "BugSnag client started" has a parent named "[AppStart/ReactNativeInit]"
  And a span named "AppStartWrapper (FC) rendered" has a parent named "[AppStart/ReactNativeInit]"
  And a span named "DiagnosticWrapper (CC) rendered" has a parent named "AppStartWrapper (FC) rendered"


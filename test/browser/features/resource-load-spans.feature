Feature: Resource Load Spans
  @skip_on_cdn_build
  @requires_resource_load_spans
  Scenario: Resource load spans are automatically instrumented (NPM build)
    Given I set the sampling probability to "0.999999"
    And I navigate to the test URL "/docs/resource-load-spans"
    And I wait to receive a sampling request

    When I click the element "end-span"
    And I wait to receive 1 trace

    # Custom span (parent)
    Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.2.name" equals "[Custom]/resource-load-spans"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.2.spanId" is stored as the value "parent_span_id"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.2" double attribute "bugsnag.sampling.p" equals 0.999999

    # App bundle
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" matches the regex "^\[ResourceLoad\]https:\/\/.*:[0-9]{4}\/docs\/resource-load-spans\/dist\/bundle\.js$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.parentSpanId" equals the stored value "parent_span_id"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "bugsnag.span.category" equals "resource_load"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "http.flavor" equals "1.1"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" double attribute "bugsnag.sampling.p" equals 0.999999

    # Image
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1.name" matches the regex "^\[ResourceLoad\]https:\/\/.*:[0-9]{4}\/docs\/favicon.png$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1.parentSpanId" equals the stored value "parent_span_id"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1" string attribute "bugsnag.span.category" equals "resource_load"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1" string attribute "http.url" matches the regex "^http(s)?:\/\/.*:[0-9]{4}\/docs\/favicon\.png\?height=100&width=100$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1" string attribute "http.flavor" equals "1.1"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1" double attribute "bugsnag.sampling.p" equals 0.999999

  @skip_on_npm_build
  @requires_resource_load_spans
  Scenario: Resource load spans are automatically instrumented (CDN build)
    Given I set the sampling probability to "0.999999"
    And I navigate to the test URL "/docs/resource-load-spans"
    And I wait to receive a sampling request

    When I click the element "end-span"
    And I wait to receive 1 trace

    # Custom span (parent)
    Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.3.name" equals "[Custom]/resource-load-spans"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.3.spanId" is stored as the value "parent_span_id"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.3" double attribute "bugsnag.sampling.p" equals 0.999999

    # App bundle
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" matches the regex "^\[ResourceLoad\]https:\/\/.*:[0-9]{4}\/docs\/resource-load-spans\/dist\/bundle\.js$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.parentSpanId" equals the stored value "parent_span_id"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "bugsnag.span.category" equals "resource_load"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "http.flavor" equals "1.1"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" double attribute "bugsnag.sampling.p" equals 0.999999

    # CDN bundle
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1.name" matches the regex "^\[ResourceLoad\]https:\/\/.*:[0-9]{4}\/docs\/bugsnag-performance(?:\.min)?\.js$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1.parentSpanId" equals the stored value "parent_span_id"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1" string attribute "bugsnag.span.category" equals "resource_load"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1" double attribute "bugsnag.sampling.p" equals 0.999999

    # Image
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.2.name" matches the regex "^\[ResourceLoad\]https:\/\/.*:[0-9]{4}\/docs\/favicon.png$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.2.parentSpanId" equals the stored value "parent_span_id"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.2" string attribute "bugsnag.span.category" equals "resource_load"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.2" string attribute "http.url" matches the regex "^http(s)?:\/\/.*:[0-9]{4}\/docs\/favicon\.png\?height=100&width=100$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.2" string attribute "http.flavor" equals "1.1"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.2" double attribute "bugsnag.sampling.p" equals 0.999999

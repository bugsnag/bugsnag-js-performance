Feature: Resource Load Spans
  @skip_on_cdn_build
  @requires_resource_load_spans
  Scenario: Resource load spans are automatically instrumented (NPM build)
    Given I navigate to the test URL "/resource-load-spans"
    And I wait to receive a sampling request

    When I click the element "end-span"
    And I wait to receive 1 trace

    # Custom span (parent)
    Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.2.name" equals "[Custom]/resource-load-spans"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.2.spanId" is stored as the value "parent_span_id"

    # App bundle resource load
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" matches the regex "^\[ResourceLoad\]http:\/\/.*:[0-9]{4}\/resource-load-spans\/dist\/bundle\.js$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.parentSpanId" equals the stored value "parent_span_id"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "bugsnag.span.category" equals "resource_load"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "http.flavor" equals "1.1"

    # Image resource load 
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1.name" matches the regex "^\[ResourceLoad\]http:\/\/.*:[0-9]{4}\/favicon.png$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1.parentSpanId" equals the stored value "parent_span_id"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1" string attribute "bugsnag.span.category" equals "resource_load"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1" string attribute "http.url" matches the regex "^http:\/\/.*:[0-9]{4}\/favicon\.png\?height=100&width=100$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1" string attribute "http.flavor" equals "1.1"

    # Image status code and body size have very patchy browser coverage
    And if present, the trace payload field "resourceSpans.0.scopeSpans.0.spans.1" integer attribute "http.status_code" equals 200
    And if present, the trace payload field "resourceSpans.0.scopeSpans.0.spans.1" integer attribute "http.response_content_length" equals 2202
    And if present, the trace payload field "resourceSpans.0.scopeSpans.0.spans.1" integer attribute "http.response_content_length_uncompressed" equals 2202

  @skip_on_npm_build
  @requires_resource_load_spans
  Scenario: Resource load spans are automatically instrumented (CDN build)
    Given I navigate to the test URL "/resource-load-spans"
    And I wait to receive a sampling request

    When I click the element "end-span"
    And I wait to receive 1 trace

    # Custom span (parent)
    Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.3.name" equals "[Custom]/resource-load-spans"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.3.spanId" is stored as the value "parent_span_id"

    # App bundle
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" matches the regex "^\[ResourceLoad\]http:\/\/.*:[0-9]{4}\/resource-load-spans\/dist\/bundle\.js$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.parentSpanId" equals the stored value "parent_span_id"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "bugsnag.span.category" equals "resource_load"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "http.flavor" equals "1.1"

    # CDN bundle
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1.name" matches the regex "^\[ResourceLoad\]http:\/\/.*:[0-9]{4}\/bugsnag-performance(?:\.min)?\.js$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1.parentSpanId" equals the stored value "parent_span_id"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1" string attribute "bugsnag.span.category" equals "resource_load"

    # Image
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.2.name" matches the regex "^\[ResourceLoad\]http:\/\/.*:[0-9]{4}\/favicon.png$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.2.parentSpanId" equals the stored value "parent_span_id"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.2" string attribute "bugsnag.span.category" equals "resource_load"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.2" string attribute "http.url" matches the regex "^http:\/\/.*:[0-9]{4}\/favicon\.png\?height=100&width=100$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.2" string attribute "http.flavor" equals "1.1"
        
    # Image status code and body size have patchy browser coverage
    And on the browser Chrome 109: the trace payload field "resourceSpans.0.scopeSpans.0.spans.1" integer attribute "http.status_code" equals 200

    And on the browsers Chrome 73, Safari 13, Firefox 67: the trace payload field "resourceSpans.0.scopeSpans.0.spans.1" integer attribute "http.response_content_length" equals 2202
    And on the browsers Chrome 73, Safari 13, Firefox 67: the trace payload field "resourceSpans.0.scopeSpans.0.spans.1" integer attribute "http.response_content_length_uncompressed" equals 2202

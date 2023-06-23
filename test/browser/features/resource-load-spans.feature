Feature: Resource Load Spans

  Scenario: Resource load spans are automatically instrumented
    Given I navigate to the test URL "/resource-load-spans"
    And I wait to receive a sampling request

    When I click the element "end-span"
    And I wait to receive 1 trace

    # Custom span (parent)
    Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.2.name" equals "[Custom]/resource-load-spans"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.2.spanId" is stored as the value "parent_span_id"

    # App bundle
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" matches the regex "^\[ResourceLoad\]http:\/\/.*:[0-9]{4}\/resource-load-spans\/dist\/bundle\.js$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.parentSpanId" equals the stored value "parent_span_id"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "bugsnag.span.category" equals "resource_load"
    # And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" integer attribute "http.status_code" equals 200
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "http.flavor" equals "1.1"

    # Image on page
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1.name" matches the regex "^\[ResourceLoad\]http:\/\/.*:[0-9]{4}\/favicon.png$"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1.parentSpanId" equals the stored value "parent_span_id"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1" string attribute "bugsnag.span.category" equals "resource_load"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1" string attribute "http.url" matches the regex "^http:\/\/.*:[0-9]{4}\/favicon\.png\?height=100&width=100$"
    # And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1" integer attribute "http.status_code" equals 200
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1" integer attribute "http.response_content_length_uncompressed" equals 2202
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1" integer attribute "http.response_content_length" equals 2202
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.1" string attribute "http.flavor" equals "1.1"
    
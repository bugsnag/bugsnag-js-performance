Feature: Resource Load Spans
  @skip_on_cdn_build
  @requires_resource_load_spans
  Scenario: Resource load spans are automatically instrumented (NPM build)
    Given I navigate to the test URL "/resource-load-spans"
    And I wait to receive a sampling request

    When I click the element "end-span"
    And I wait for 3 spans

    # App bundle
    And a span matching the regex "^\[ResourceLoad\]http:\/\/.*:[0-9]{4}\/resource-load-spans\/dist\/bundle\.js$" has a parent named "[Custom]/resource-load-spans"
    And a span matching the regex "^\[ResourceLoad\]http:\/\/.*:[0-9]{4}\/resource-load-spans\/dist\/bundle\.js$" contains the attributes:
        | attribute             | type        | value         | 
        | bugsnag.span.category | stringValue | resource_load |
        | http.flavor           | stringValue | 1.1           |

    # Image
    And a span matching the regex "^\[ResourceLoad\]http:\/\/.*:[0-9]{4}\/favicon.png$" has a parent named "[Custom]/resource-load-spans"
    And a span matching the regex "^\[ResourceLoad\]http:\/\/.*:[0-9]{4}\/favicon.png$" contains the attributes:
        | attribute             | type        | value                                                      | 
        | bugsnag.span.category | stringValue | resource_load                                              |
        | http.flavor           | stringValue | 1.1                                                        |
        | http.url              | stringValue | ^http:\/\/.*:[0-9]{4}\/favicon\.png\?height=100&width=100$ |

  @skip_on_npm_build
  @requires_resource_load_spans
  Scenario: Resource load spans are automatically instrumented (CDN build)
    Given I navigate to the test URL "/resource-load-spans"
    And I wait to receive a sampling request

    When I click the element "end-span"
    And I wait for 4 spans

    # Custom span (parent)
    Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.3.name" equals "[Custom]/resource-load-spans"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.3.spanId" is stored as the value "parent_span_id"

    # App bundle
    And a span matching the regex "^\[ResourceLoad\]http:\/\/.*:[0-9]{4}\/resource-load-spans\/dist\/bundle\.js$" has a parent named "[Custom]/resource-load-spans"
    And a span matching the regex "^\[ResourceLoad\]http:\/\/.*:[0-9]{4}\/resource-load-spans\/dist\/bundle\.js$" contains the attributes:
        | attribute             | type        | value         | 
        | bugsnag.span.category | stringValue | resource_load |
        | http.flavor           | stringValue | 1.1           |

    # CDN bundle
    And a span matching the regex "^\[ResourceLoad\]http:\/\/.*:[0-9]{4}\/bugsnag-performance(?:\.min)?\.js$" has a parent named "[Custom]/resource-load-spans"
    And a span matching the regex "^\[ResourceLoad\]http:\/\/.*:[0-9]{4}\/bugsnag-performance(?:\.min)?\.js$" contains the attributes:
        | attribute             | type        | value         | 
        | bugsnag.span.category | stringValue | resource_load |

    # Image
    And a span matching the regex "^\[ResourceLoad\]http:\/\/.*:[0-9]{4}\/favicon.png$" has a parent named "[Custom]/resource-load-spans"
    And a span matching the regex "^\[ResourceLoad\]http:\/\/.*:[0-9]{4}\/favicon.png$" contains the attributes:
        | attribute             | type        | value                                                      | 
        | bugsnag.span.category | stringValue | resource_load                                              |
        | http.url              | stringValue | ^http:\/\/.*:[0-9]{4}\/favicon\.png\?height=100&width=100$ |
        | http.flavor           | stringValue | 1.1                                                        |

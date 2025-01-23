Feature: Trace propagation headers

    Scenario: traceparent and tracestate header is added to xhr requests
        Given I navigate to the test URL "/docs/trace-propagation"
        When I click the element "xhr"

        And I wait to receive a reflection
        Then the reflection request method equals "GET"
        And the reflection "X-Test-Header" header equals "test"
        And the reflection "traceparent" header matches the regex "^00-[A-Fa-f0-9]{32}-[A-Fa-f0-9]{16}-01"
        And the reflection "tracestate" header matches the regex "^sb=v:1;r32:[0-9]{1,32}"

        And I wait to receive 1 trace

        Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "[HTTP/GET]"

    Scenario: traceparent and tracestate header is added to fetch requests (simple headers in fetch options)
        Given I navigate to the test URL "/docs/trace-propagation"
        When I click the element "fetch-simple-headers-in-options"

        And I wait to receive a reflection
        Then the reflection request method equals "GET"
        And the reflection "X-Test-Header" header equals "test"
        And the reflection "traceparent" header matches the regex "^00-[A-Fa-f0-9]{32}-[A-Fa-f0-9]{16}-01"
        And the reflection "tracestate" header matches the regex "^sb=v:1;r32:[0-9]{1,32}"

        And I wait to receive 1 trace

        Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "[HTTP/GET]"

    Scenario: traceparent and tracestate header is added to fetch requests (Headers class in fetch options)   
        Given I navigate to the test URL "/docs/trace-propagation"
        When I click the element "fetch-headers-class-in-options"

        And I wait to receive a reflection
        Then the reflection request method equals "GET"
        And the reflection "X-Test-Header" header equals "test"
        And the reflection "traceparent" header matches the regex "^00-[A-Fa-f0-9]{32}-[A-Fa-f0-9]{16}-01"
        And the reflection "tracestate" header matches the regex "^sb=v:1;r32:[0-9]{1,32}"

        And I wait to receive 1 trace

        Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "[HTTP/GET]"

    Scenario: traceparent and tracestate header is added to fetch requests (simple headers in Request object)   
        Given I navigate to the test URL "/docs/trace-propagation"
        When I click the element "fetch-simple-headers-in-request"

        And I wait to receive a reflection
        Then the reflection request method equals "GET"
        And the reflection "X-Test-Header" header equals "test"
        And the reflection "traceparent" header matches the regex "^00-[A-Fa-f0-9]{32}-[A-Fa-f0-9]{16}-01"
        And the reflection "tracestate" header matches the regex "^sb=v:1;r32:[0-9]{1,32}"

        And I wait to receive 1 trace

        Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "[HTTP/GET]"

    Scenario: traceparent and tracestate header is added to fetch requests (Headers class in Request object)
        Given I navigate to the test URL "/docs/trace-propagation"
        When I click the element "fetch-headers-class-in-request"

        And I wait to receive a reflection
        Then the reflection request method equals "GET"
        And the reflection "X-Test-Header" header equals "test"
        And the reflection "traceparent" header matches the regex "^00-[A-Fa-f0-9]{32}-[A-Fa-f0-9]{16}-01"
        And the reflection "tracestate" header matches the regex "^sb=v:1;r32:[0-9]{1,32}"

        And I wait to receive 1 trace

        Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "[HTTP/GET]"

    Scenario: traceparent header is added to fetch requests (headers in both request and options)
        Given I navigate to the test URL "/docs/trace-propagation"
        When I click the element "fetch-headers-in-request-and-options"

        And I wait to receive a reflection
        Then the reflection request method equals "GET"
        And the reflection "X-Test-Header" header equals "test"
        And the reflection "traceparent" header matches the regex "^00-[A-Fa-f0-9]{32}-[A-Fa-f0-9]{16}-01"
        And the reflection "tracestate" header matches the regex "^sb=v:1;r32:[0-9]{1,32}"

        And I wait to receive 1 trace
        
        Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "[HTTP/GET]"

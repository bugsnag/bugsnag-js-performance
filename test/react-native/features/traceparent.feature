Feature: Trace propagation headers

    Scenario: traceparent headers are added to requests
        When I run 'TracePropagationScenario'

        And I wait to receive 5 reflections
        And I wait to receive 5 traces

        Then the reflection request method equals "GET"
        And the reflection "X-Test-Header" header equals "test"
        And the reflection "traceparent" header matches the regex "^00-[A-Fa-f0-9]{32}-[A-Fa-f0-9]{16}-01"

        Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "[HTTP]/GET"

        And I discard the oldest reflection
        And I discard the oldest trace

        Then the reflection request method equals "GET"
        And the reflection "X-Test-Header" header equals "test"
        And the reflection "traceparent" header matches the regex "^00-[A-Fa-f0-9]{32}-[A-Fa-f0-9]{16}-01"

        Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "[HTTP]/GET"

        And I discard the oldest reflection
        And I discard the oldest trace

        Then the reflection request method equals "GET"
        And the reflection "X-Test-Header" header equals "test"
        And the reflection "traceparent" header matches the regex "^00-[A-Fa-f0-9]{32}-[A-Fa-f0-9]{16}-01"

        Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "[HTTP]/GET"

        And I discard the oldest reflection
        And I discard the oldest trace

        Then the reflection request method equals "GET"
        And the reflection "X-Test-Header" header equals "test"
        And the reflection "traceparent" header matches the regex "^00-[A-Fa-f0-9]{32}-[A-Fa-f0-9]{16}-01"

        Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "[HTTP]/GET"

        And I discard the oldest reflection
        And I discard the oldest trace

        Then the reflection request method equals "GET"
        And the reflection "X-Test-Header" header equals "test"
        And the reflection "traceparent" header matches the regex "^00-[A-Fa-f0-9]{32}-[A-Fa-f0-9]{16}-01"

        Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "[HTTP]/GET"
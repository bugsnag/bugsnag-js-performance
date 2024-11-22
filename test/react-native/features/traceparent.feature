Feature: Trace propagation headers

    Scenario: traceparent headers are added to requests
        When I run 'TracePropagationScenario'

        And I wait to receive 5 reflections
        
        And I wait for 5 spans
        Then every span string attribute "http.url" matches the regex "^https:\/\/.+:\d{4}\/reflect$"

        And the reflection request method equals "GET"
        And the reflection "X-Test-Header" header equals "test"
        And the reflection "traceparent" header matches the regex "^00-[A-Fa-f0-9]{32}-[A-Fa-f0-9]{16}-01"

        And I discard the oldest reflection

        Then the reflection request method equals "GET"
        And the reflection "X-Test-Header" header equals "test"
        And the reflection "traceparent" header matches the regex "^00-[A-Fa-f0-9]{32}-[A-Fa-f0-9]{16}-01"

        And I discard the oldest reflection

        Then the reflection request method equals "GET"
        And the reflection "X-Test-Header" header equals "test"
        And the reflection "traceparent" header matches the regex "^00-[A-Fa-f0-9]{32}-[A-Fa-f0-9]{16}-01"

        And I discard the oldest reflection

        Then the reflection request method equals "GET"
        And the reflection "X-Test-Header" header equals "test"
        And the reflection "traceparent" header matches the regex "^00-[A-Fa-f0-9]{32}-[A-Fa-f0-9]{16}-01"

        And I discard the oldest reflection

        Then the reflection request method equals "GET"
        And the reflection "X-Test-Header" header equals "test"
        And the reflection "traceparent" header matches the regex "^00-[A-Fa-f0-9]{32}-[A-Fa-f0-9]{16}-01"

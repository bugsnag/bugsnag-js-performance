Feature: Network spans

    Scenario: traceparent header is added to xhr requests
        Given I navigate to the test URL "/traceparent"
        When I click the element "xhr"

        And I wait to receive a reflection
        Then the reflection request method equals "GET"
        And the reflection "X-Test-Header" header equals "test"
        And the reflection "traceparent" header matches the regex "^00-[A-Fa-f0-9]{32}-[A-Fa-f0-9]{16}-01"

        And I wait to receive 1 trace

        Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "[HTTP]/GET"

    Scenario: traceparent header is added to fetch requests
        Given I navigate to the test URL "/traceparent"
        When I click the element "fetch"

        And I wait to receive a reflection
        Then the reflection request method equals "GET"
        And the reflection "X-Test-Header" header equals "test"
        And the reflection "traceparent" header matches the regex "^00-[A-Fa-f0-9]{32}-[A-Fa-f0-9]{16}-01"

        And I wait to receive 1 trace

        Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "[HTTP]/GET"

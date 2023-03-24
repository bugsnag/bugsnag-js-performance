Feature: Retries

    Scenario: OPTIONS workaround
        Given I navigate to the test URL "/retry-scenario"
        Then I wait to receive 2 traces

    Scenario Outline: Batch is retried with specified status codes
        Given I set the HTTP status code for the next request to <status>
        And I navigate to the test URL "/retry-scenario"
        And I wait to receive 3 traces

        # 500 - First payload (rejected, but will still be recorded by maze-runner)
        Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "Custom/Span 1"
        Then I discard the oldest trace

        # 200 - Second payload (delivered)
        Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "Custom/Span 2"
        Then I discard the oldest trace

        # 200 - First payload (retried after successful delivery)
        Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "Custom/Span 1"

        Examples:
            | status | definition                    |
            | 402    | Payment Required              |
            | 407    | Proxy Authentication Required |
            | 408    | Request Timeout               |
            | 429    | Too Many Requests             |
            | 500    | Connection Error              |

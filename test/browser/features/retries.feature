Feature: Retries

    # TODO Remove this Scenario after updates to OPTIONS request handling in maze-runner
    Scenario: OPTIONS workaround
        Given I navigate to the test URL "/retry-scenario"
        Then I wait to receive 2 traces

    Scenario Outline: Batch is retried with specified status codes
        Given I set the HTTP status code for the next request to <status>
        And I navigate to the test URL "/retry-scenario"
        And I wait to receive at least 2 traces

        # 500 - First payload (rejected, but will still be recorded by maze-runner)
        # Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "Custom/Span 1"
        Then a span name equals "Custom/Span 1"
        # Then I discard the oldest trace

        # 200 - Second payload (delivered)
        # Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "Custom/Span 2"
        And a span name equals "Custom/Span 2"
        # Then I discard the oldest trace

        # 200 - First payload (retried after successful delivery)
        # Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "Custom/Span 1"

        Examples:
            | status | definition                    |
            | 402    | Payment Required              |
            | 407    | Proxy Authentication Required |
            | 408    | Request Timeout               |
            | 429    | Too Many Requests             |
            | 500    | Connection Error              |

    Scenario: Oldest batch is removed when max retry queue size is exceeded
        Given I set the HTTP status code for the next requests to "500,500,500,500,500,500,500,500,500,500,500"
        And I navigate to the test URL "/oldest-batch-removed"

        And I wait to receive 22 traces

        # 11 failed requests
        And I discard the oldest trace
        And I discard the oldest trace
        And I discard the oldest trace
        And I discard the oldest trace
        And I discard the oldest trace
        And I discard the oldest trace
        And I discard the oldest trace
        And I discard the oldest trace
        And I discard the oldest trace
        And I discard the oldest trace
        And I discard the oldest trace

        # One successful request
        # + 10 re-deliveries
        Then every span field "name" matches the regex "^((?!Span to discard).)*$"

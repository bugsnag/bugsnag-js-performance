Feature: Retries

    Scenario Outline: Batch is retried with specified status codes
        Given I set the HTTP status code for the next "POST" request to <status>
        And I navigate to the test URL "/retry-scenario"

        # We need to wait for 2 traces, but maze-runner will log the rejected payload as well
        And I wait to receive 3 traces

        # 500 - First payload (rejected, then retried)
        Then a span name equals "Custom/Span 1"

        # 200 - Second payload (delivered)
        And a span name equals "Custom/Span 2"

        Examples:
            | status | definition                    |
            | 402    | Payment Required              |
            | 407    | Proxy Authentication Required |
            | 408    | Request Timeout               |
            | 429    | Too Many Requests             |
            | 500    | Connection Error              |

    @skip
    Scenario: Oldest batch is removed when max retry queue size is exceeded
        Given I set the HTTP status code for the next requests to "500,500,500,500"
        And I navigate to the test URL "/oldest-batch-removed"
        And I wait to receive 8 traces

        # Remove failed requests
        And I discard the oldest trace

        # One successful request
        # + 3 re-deliveries
        Then every span field "name" matches the regex "^((?!Span to discard).)*$"

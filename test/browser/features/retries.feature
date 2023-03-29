Feature: Retries

    Scenario Outline: Batch is retried with specified status codes
        Given I set the HTTP status code for the next "POST" request to <status>
        And I navigate to the test URL "/retry-scenario"
        And I wait to receive 1 trace
        And I discard the oldest trace

        Then I click the DOM element "send-span"
        And I wait to receive 2 traces

        #  First payload (rejected, then retried)
        Then a span name equals "Custom/Reject"

        # Second payload (delivered)
        And a span name equals "Custom/Deliver"

        # Status code 408 cannot be tested on certain browsers as it
        # is automatically retried and does not behave as expected
        Examples:
            | status | definition                    |
            | 402    | Payment Required              |
            | 407    | Proxy Authentication Required |
            | 429    | Too Many Requests             |
            | 500    | Connection Error              |

    # Status code 408 cannot be tested on certain browsers as it
    # is automatically retried and does not behave as expected
    Scenario Outline: Oldest batch is removed when max retry queue size is exceeded
        Given I set the HTTP status code for the next 4 "POST" requests to <status>
        And I navigate to the test URL "/oldest-batch-removed"
        And I wait to receive 1 trace
        And I discard the oldest trace

        Then I click the DOM element "send-spans"
        And I wait to receive 3 traces

        # Remove failed requests
        And I discard the oldest trace
        And I discard the oldest trace
        And I discard the oldest trace

        Then I click the DOM element "send-final-span"
        And I wait to receive 4 traces

        # First successful batch
        Then a span name equals "Custom/Span to deliver"

        # Retried batches
        And a span name equals "Custom/Span to retry 1"
        And a span name equals "Custom/Span to retry 2"
        And a span name equals "Custom/Span to retry 3"

        Examples:
            | status | definition                    |
            | 402    | Payment Required              |
            | 407    | Proxy Authentication Required |
            | 429    | Too Many Requests             |
            | 500    | Connection Error              |

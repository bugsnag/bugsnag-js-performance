Feature: Retries

    Scenario Outline: Batch is retried with specified status codes
        Given I navigate to the test URL "/docs/retry-scenario"
        And I wait to receive a sampling request
        And I set the HTTP status code for the next "POST" request to <status>

        When I click the element "send-first-span"
        And I wait to receive 1 trace
        And I discard the oldest trace

        Then I click the element "send-second-span"

        # First payload (rejected, then retried)
        Then I wait to receive a span named "Custom/Reject"

        # Second payload (delivered)
        And I wait to receive a span named "Custom/Deliver"

        # Status code 408 cannot be tested on certain browsers as it
        # is automatically retried and does not behave as expected
        Examples:
            | status | definition                    |
            | 301    | Moved Permanently             |
            | 402    | Payment Required              |
            | 407    | Proxy Authentication Required |
            | 429    | Too Many Requests             |
            | 500    | Connection Error              |

    Scenario: Batch is retried with connection failure
        Given I navigate to the test URL "/docs/connection-failure"

        When I click the element "send-span"
        And I wait for 10 seconds
        Then I wait to receive 0 traces

        When I click the element "send-span"

        Then I wait to receive a span named "Custom/Span 1"
        And I wait to receive a span named "Custom/Span 2"

    Scenario Outline: Batch is not retried with specified status codes
        Given I navigate to the test URL "/docs/retry-scenario"
        And I wait to receive a sampling request
        And I set the HTTP status code for the next "POST" request to <status>

        Then I click the element "send-first-span"
        And I wait to receive 1 trace
        And I discard the oldest trace

        Given I click the element "send-second-span"
        Then I wait to receive a span named "Custom/Deliver"

        Examples:
            | status | definition                    |
            | 200    | OK                            |
            | 400    | Bad Request                   |
            | 401    | Unauthorized                  |
            | 410    | Gone                          |
            | 418    | I'm a teapot                  |

    # Status code 408 cannot be tested on certain browsers as it
    # is automatically retried and does not behave as expected
    Scenario Outline: Oldest batch is removed when max retry queue size is exceeded
        Given I navigate to the test URL "/docs/oldest-batch-removed"
        And I wait to receive a sampling request
        And I set the HTTP status code for the next 2 "POST" requests to <status>

        When I click the element "send-first-span"
        And I wait to receive 1 trace
        And I discard the oldest trace

        Then I click the element "send-retry-spans"
        And I wait to receive 1 trace

        # Remove failed requests
        And I discard the oldest trace

        Then I click the element "send-final-span"

        # First successful batch
        Then I wait to receive a span named "Custom/Span to deliver"

        # Retried batch
        And I wait to receive a span named "Custom/Span to retry"

        Examples:
            | status | definition                    |
            | 301    | Moved Permanently             |
            | 402    | Payment Required              |
            | 407    | Proxy Authentication Required |
            | 429    | Too Many Requests             |
            | 500    | Connection Error              |

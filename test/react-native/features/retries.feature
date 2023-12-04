Feature: Retries
  Scenario Outline: Batch is retried with specified status codes
    Given I run "SpanTriggeredByCommandScenario"
    And I wait to receive a sampling request
    And I set the HTTP status code for the next "POST" request to <status>

    When I execute the command "start-span"
    And I wait to receive 1 trace
    And I discard the oldest trace
    And I execute the command "start-span"
    And I wait to receive 2 traces

    # First payload (rejected, then retried)
    Then a span name equals "SpanTriggeredByCommandScenario 1"
    # Second payload (delivered)
    And a span name equals "SpanTriggeredByCommandScenario 2"

    Examples:
      | status | definition                    |
      |    301 | Moved Permanently             |
      |    402 | Payment Required              |
      |    407 | Proxy Authentication Required |
      |    429 | Too Many Requests             |
      |    500 | Connection Error              |

  Scenario Outline: Batch is not retried with specified status codes
    Given I run "SpanTriggeredByCommandScenario"
    And I wait to receive a sampling request
    And I set the HTTP status code for the next "POST" request to <status>

    Then I execute the command "start-span"
    And I wait to receive 1 trace
    And I discard the oldest trace

    Given I execute the command "start-span"
    And I wait for 5 seconds
    And I wait to receive 1 trace
    Then a span name equals "SpanTriggeredByCommandScenario 2"

    Examples:
      | status | definition   |
      |    200 | OK           |
      |    400 | Bad Request  |
      |    401 | Unauthorized |
      |    410 | Gone         |
      |    418 | I'm a teapot |

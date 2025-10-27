@requires_fetch_keepalive
Feature: Navigation changes
    @skip_span_time_validation
    Scenario: Batch is sent when navigating to a new page by clicking an anchor tag
        Given I navigate to the test URL "/docs/navigation-changes"
        When I click the element "add-span-to-batch"
        And I click the element "add-span-to-batch"

        And I wait for 5 seconds
        Then I wait to receive 0 traces

        When I click the element "go-to-another-page"
        Then I wait to receive 1 trace
        Then I wait to receive at least 2 spans

        And a span name equals "Span 1"
        And a span name equals "Span 2"

    @skip_span_time_validation
    Scenario: Batch is sent when navigating to a new page by entering a new URL
        Given I navigate to the test URL "/docs/navigation-changes"
        When I click the element "add-span-to-batch"
        And I click the element "add-span-to-batch"
        And I click the element "add-span-to-batch"

        And I wait for 5 seconds
        Then I wait to receive 0 traces

        When I navigate to the test URL "/"
        Then I wait to receive 1 trace
        Then I wait to receive at least 3 spans

        And a span name equals "Span 1"
        And a span name equals "Span 2"
        And a span name equals "Span 3"

    @minimises_window
    Scenario: Batch is sent when the window is minimised
        Given I navigate to the test URL "/docs/navigation-changes"
        When I click the element "add-span-to-batch"
        And I click the element "add-span-to-batch"
        And I click the element "add-span-to-batch"
        And I click the element "add-span-to-batch"

        And I wait for 5 seconds
        Then I wait to receive 0 traces

        When I minimise the browser window
        Then I wait to receive 1 trace
        Then I wait to receive at least 4 spans

        And a span name equals "Span 1"
        And a span name equals "Span 2"
        And a span name equals "Span 3"
        And a span name equals "Span 4"

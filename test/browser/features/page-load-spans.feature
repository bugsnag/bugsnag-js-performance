Feature: Page Load spans

    Scenario: Page load spans are automatically instrumented
        Given I navigate to the test URL "/page-load-spans"
        And I wait to receive 1 traces
        Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "[FullPageLoad]/page-load-spans/"

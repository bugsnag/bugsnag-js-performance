Feature: Page Load spans

    Scenario: Page load spans are automatically instrumented
        Given I navigate to the test URL "/page-load-spans"
        # click a button to record a first input delay metric
        And I click the element "stop-clock"
        And I wait to receive 1 traces

        Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "[FullPageLoad]/page-load-spans/"
        And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "bugsnag.span.category" equals "full_page_load"
        And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "bugsnag.browser.page.title" equals "Page load spans"
        And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "bugsnag.browser.page.url" equals the stored value "bugsnag.browser.page.url"
        And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "bugsnag.browser.page.route" equals "/page-load-spans/"
        And the span named "[FullPageLoad]/page-load-spans/" is a valid full page load span

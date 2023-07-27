Feature: Network spans

    Scenario: Network spans are automatically instrumented for completed XHR requests
        Given I navigate to the test URL "/network-spans"
        When I click the element "xhr-success"
        And I wait to receive 1 traces

        Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "[HTTP]/GET"
        And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "bugsnag.span.category" equals "network"
        And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "bugsnag.browser.page.title" equals "Network spans"
        And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "bugsnag.browser.page.url" equals the stored value "bugsnag.browser.page.url"
        And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "http.method" equals "GET"
        And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "http.url" matches the regex "^http:\/\/.+:\d{4}\/reflect\?status=200\&delay_ms=0$"
        And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" integer attribute "http.status_code" equals 200

    Scenario: Network spans are automatically instrumented for completed fetch requests
        Given I navigate to the test URL "/network-spans"
        When I click the element "fetch-success"
        And I wait to receive 1 traces

        Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "[HTTP]/GET"
        And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "bugsnag.span.category" equals "network"
        And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "bugsnag.browser.page.title" equals "Network spans"
        And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "bugsnag.browser.page.url" equals the stored value "bugsnag.browser.page.url"
        And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "http.method" equals "GET"
        And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "http.url" matches the regex "^http:\/\/.+:\d{4}\/reflect\?status=200\&delay_ms=0$"
        And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" integer attribute "http.status_code" equals 200

    Scenario: Network spans are not instrumented for failed requests
        Given I navigate to the test URL "/network-spans"
        When I click the element "failed-requests"
        Then I should have received no spans

    Scenario: Attributes can be modified by networkRequestCallback
        Given I navigate to the test URL "/network-span-control"
        When I click the element "fetch-modified-url"
        And I wait to receive 1 traces
        
        Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "[HTTP]/GET"
        And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "http.method" equals "GET"
        And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "http.url" matches the regex "^http:\/\/.+:\d{4}\/reflect\?status=200\&delay_ms=0&not-your-ordinary-url=true$"
        And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" integer attribute "http.status_code" equals 200

        Given I navigate to the test URL "/network-span-control"
        When I click the element "xhr-modified-url"
        And I wait to receive 1 traces
        
        Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "[HTTP]/GET"
        And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "http.method" equals "GET"
        And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" string attribute "http.url" matches the regex "^http:\/\/.+:\d{4}\/reflect\?status=200\&delay_ms=0&not-your-ordinary-url=true$"
        And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" integer attribute "http.status_code" equals 200

    Scenario: Delivery of spans can be prevented by networkRequestCallback
        Given I navigate to the test URL "/network-span-control"
        When I click the element "fetch-prevented"
        Then I should have received no spans

        Given I navigate to the test URL "/network-span-control"
        When I click the element "xhr-prevented"
        Then I should have received no spans

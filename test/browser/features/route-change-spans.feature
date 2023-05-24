Feature: Route change spans

    Scenario: Route change spans are automatically instrumented
        Given I navigate to the test URL "/route-change-spans"
        And I click the element "change-route"
        When I wait to receive 1 traces

        Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "[RouteChange]/new-route"
        Then a span named "[RouteChange]/new-route" contains the attributes: 
            | attribute                           | type         | value              | 
            | bugsnag.span.category               | stringValue  | route_change       |
            | bugsnag.span.first_class            | boolValue    | true               |
            | bugsnag.browser.page.route          | stringValue  | /new-route         |
            | bugsnag.browser.page.title          | stringValue  | Route change spans |
            # | bugsnag.browser.page.previous_route | stringValue  | /                  |
            # | bugsnag.browser.page.url            | stringValue  | /new-route         |
 
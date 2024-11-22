Feature: Route change spans

    Scenario: Route change spans are automatically instrumented
        Given I navigate to the test URL "/route-change-spans"
        And I click the element "change-route"
        When I wait to receive 1 trace

        Then every span string attribute "bugsnag.browser.page.url" matches the regex "^http(s)?:\/\/.*:[0-9]{4}\/docs\/route-change-spans/new-route$"
        And a span named "[RouteChange]/new-route" contains the attributes: 
            | attribute                                 | type         | value                                        | 
            | bugsnag.span.category                     | stringValue  | route_change                                 |
            | bugsnag.browser.page.title                | stringValue  | New Route                                    |
            | bugsnag.browser.page.route                | stringValue  | /docs/route-change-spans/new-route           |
            | bugsnag.browser.page.previous_route       | stringValue  | /docs/route-change-spans/                    |
            | bugsnag.browser.page.route_change.trigger | stringValue  | pushState                                    |

    Scenario: Hyperlinks within a page
        Given I navigate to the test URL "/route-change-spans"
        And I click the element "go-to-anchor"
        When I wait to receive 1 trace

        Then every span string attribute "bugsnag.browser.page.url" matches the regex "^http(s)?:\/\/.*:[0-9]{4}\/docs\/route-change-spans(\/)?\?endpoint=.*\&logs=.*\&api_key=.*#anchor-link$"
        Then a span named "[RouteChange]/route-change-spans/" contains the attributes: 
            | attribute                                 | type         | value                     | 
            | bugsnag.span.category                     | stringValue  | route_change              |
            | bugsnag.browser.page.title                | stringValue  | Route change spans        |
            | bugsnag.browser.page.route                | stringValue  | /docs/route-change-spans/ |
            | bugsnag.browser.page.previous_route       | stringValue  | /docs/route-change-spans/ |
            | bugsnag.browser.page.route_change.trigger | stringValue  | popstate                  |

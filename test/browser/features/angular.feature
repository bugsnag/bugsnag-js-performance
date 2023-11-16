Feature: Vue router

    Scenario: Route change spans are automatically instrumented
        Given I navigate to the test URL "/angular/dist"
        And I click the element "customers"
        When I wait to receive 1 trace

        Then a span named "[FullPageLoad]/" contains the attributes:
            | attribute                         | type             | value                    |
            | bugsnag.span.category             | stringValue      | full_page_load           |
            | bugsnag.browser.page.title        | stringValue      | Angular                  |
            | bugsnag.browser.page.route        | stringValue      | /                        |

        And a span named "[RouteChange]/contacts/:contactId" contains the attributes: 
            | attribute                                 | type         | value                | 
            | bugsnag.span.category                     | stringValue  | route_change         |
            | bugsnag.browser.page.title                | stringValue  | Customers            |
            | bugsnag.browser.page.route                | stringValue  | /customers           |
            | bugsnag.browser.page.previous_route       | stringValue  | /                    |
            | bugsnag.browser.page.route_change.trigger | stringValue  | beforeResolve        |

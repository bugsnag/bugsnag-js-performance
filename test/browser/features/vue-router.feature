Feature: Vue router

    Scenario: Route change spans are automatically instrumented
        Given I navigate to the test URL "/vue-router"
        And I click the element "change-route"
        When I wait to receive 1 traces

        Then a span named "[FullPageLoad]/" contains the attributes:
            | attribute                         | type             | value                    |
            | bugsnag.span.category             | stringValue      | full_page_load           |
            | bugsnag.browser.page.title        | stringValue      | Vue router             |
            | bugsnag.browser.page.route        | stringValue      | /                        |

        And a span named "[RouteChange]/contacts/:contactId" contains the attributes: 
            | attribute                                 | type         | value                | 
            | bugsnag.span.category                     | stringValue  | route_change         |
            | bugsnag.browser.page.title                | stringValue  | Contact 1            |
            | bugsnag.browser.page.route                | stringValue  | /contacts/:contactId |
            | bugsnag.browser.page.previous_route       | stringValue  | /                    |
            | bugsnag.browser.page.route_change.trigger | stringValue  | pushState            |

Feature: Vue router

    Scenario: Vue route change spans are automatically instrumented
        Given I navigate to the test URL "/vue-router"
        And I click the element "contact"
        And I click the element "profile"
        When I wait to receive 2 spans

        Then a span named "[RouteChange]/contacts/:contactId()" contains the attributes: 
            | attribute                                 | type         | value                          | 
            | bugsnag.span.category                     | stringValue  | route_change                   |
            | bugsnag.browser.page.title                | stringValue  | Contact 1                      |
            | bugsnag.browser.page.route                | stringValue  | /contacts/:contactId()         |
            | bugsnag.browser.page.previous_route       | stringValue  | /                              |
            | bugsnag.browser.page.route_change.trigger | stringValue  | beforeResolve                  |

        And a span named "[RouteChange]/contacts/:contactId()/profile" contains the attributes: 
            | attribute                                 | type         | value                          | 
            | bugsnag.span.category                     | stringValue  | route_change                   |
            | bugsnag.browser.page.title                | stringValue  | Contact Profile                |
            | bugsnag.browser.page.route                | stringValue  | /contacts/:contactId()/profile |
            | bugsnag.browser.page.previous_route       | stringValue  | /contacts/:contactId()         |
            | bugsnag.browser.page.route_change.trigger | stringValue  | beforeResolve                  |

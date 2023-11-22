@skip_chrome_61
@skip_firefox_60
@skip_safari_11
Feature: Angular

    Scenario: Route change spans are automatically instrumented
        Given I navigate to the test URL "/angular/dist"
        And I click the element "customers"
        When I wait to receive 2 traces

        Then a span named "[FullPageLoad]/" contains the attributes:
            | attribute                         | type             | value                    |
            | bugsnag.span.category             | stringValue      | full_page_load           |
            | bugsnag.browser.page.title        | stringValue      | Angular                  |
            | bugsnag.browser.page.route        | stringValue      | /                        |

        And a span named "[RouteChange]/customers/:customerId" contains the attributes: 
            | attribute                                 | type         | value                  | 
            | bugsnag.span.category                     | stringValue  | route_change           |
            | bugsnag.browser.page.title                | stringValue  | Customer 1             |
            | bugsnag.browser.page.route                | stringValue  | /customers/:customerId |
            | bugsnag.browser.page.previous_route       | stringValue  | /                      |
            | bugsnag.browser.page.route_change.trigger | stringValue  | imperative             |

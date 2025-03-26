@skip_chrome_61
@skip_firefox_60
@skip_safari_11
@skip_on_cdn_build
@skip # Skipped pending PLAT-14002
Feature: Angular

    Scenario: Angular route change spans are automatically instrumented
        Given I navigate to the test URL "/docs/angular/dist"
        And the element "customers" is present
        And I click the element "customers"
        When I wait to receive 1 trace

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

    Scenario: Route with a custom URL matcher
        Given I navigate to the test URL "/docs/angular/dist"
        And the element "customMatching" is present
        And I click the element "customMatching"
        When I wait to receive 1 trace

        And a span named "[RouteChange]/<custom URL matcher>" contains the attributes: 
            | attribute                                 | type         | value                  | 
            | bugsnag.span.category                     | stringValue  | route_change           |
            | bugsnag.browser.page.title                | stringValue  | Angular                |
            | bugsnag.browser.page.route                | stringValue  | /<custom URL matcher>  |
            | bugsnag.browser.page.previous_route       | stringValue  | /                      |
            | bugsnag.browser.page.route_change.trigger | stringValue  | imperative             |
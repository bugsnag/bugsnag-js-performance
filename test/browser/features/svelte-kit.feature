@skip_chrome_61 @skip_safari_11 @skip_edge_80 @firefox_60
Feature: SvelteKit router
    Scenario: SvelteKit route change spans are automatically instrumented
        Given I navigate to the test URL "/docs/svelte-kit/build"
        And I click the element "contact"
        And I click the element "profile"
        And I wait to receive 2 spans

        Then a span named "[RouteChange]/contact/[contactId]" contains the attributes: 
            | attribute                                 | type         | value                          | 
            | bugsnag.span.category                     | stringValue  | route_change                   |
            | bugsnag.browser.page.route                | stringValue  | /contact/[contactId]           |
            | bugsnag.browser.page.previous_route       | stringValue  | /                              |
            | bugsnag.browser.page.route_change.trigger | stringValue  | link                           |
            | bugsnag.browser.page.title                | stringValue  | Contact 1                      |
            | bugsnag.sampling.p                        | doubleValue  | 1                              |

        And a span named "[RouteChange]/contact/[contactId]/profile" contains the attributes: 
            | attribute                                 | type         | value                          | 
            | bugsnag.span.category                     | stringValue  | route_change                   |
            | bugsnag.browser.page.route                | stringValue  | /contact/[contactId]/profile   |
            | bugsnag.browser.page.previous_route       | stringValue  | /contact/[contactId]           |
            | bugsnag.browser.page.route_change.trigger | stringValue  | link                           |
            | bugsnag.browser.page.title                | stringValue  | Profile                        |
            | bugsnag.sampling.p                        | doubleValue  | 1                              |

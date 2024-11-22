# react router doesn't work in Chrome 61 as AbortController does not exist
@skip_chrome_61
@skip_on_cdn_build
Feature: React router

    Scenario: React route change spans are automatically instrumented
        Given I navigate to the test URL "/react-router"
        And I click the element "change-route"
        When I wait to receive 1 span
        Then a span named "[RouteChange]/contacts/:contactId" contains the attributes: 
            | attribute                                 | type         | value                | 
            | bugsnag.span.category                     | stringValue  | route_change         |
            | bugsnag.browser.page.title                | stringValue  | Contact 1            |
            | bugsnag.browser.page.route                | stringValue  | /contacts/:contactId |
            | bugsnag.browser.page.previous_route       | stringValue  | /                    |
            | bugsnag.browser.page.route_change.trigger | stringValue  | pushState            |

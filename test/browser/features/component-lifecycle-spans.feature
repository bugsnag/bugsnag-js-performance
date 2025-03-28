@skip_on_cdn_build @skip_safari_11
Feature: Component lifecycle spans
    Scenario: Component lifecycle spans are automatically instrumented
        Given I navigate to the test URL "/docs/react"
        And I click the element "update-props"
        And I click the element "hide-component"
        And I click the element "stop-clock"
        When I wait to receive 1 trace
        Then a span name equals "[ViewLoad/Component]Component"
        And a span name equals "[ViewLoadPhase/Mount]Component"
        And a span name equals "[ViewLoadPhase/Unmount]Component"
        And a span named "[ViewLoadPhase/Update]Component" contains the string array attribute "bugsnag.component.update.props":
            | count |

    # react router doesn't work in Chrome 61 as AbortController does not exist
    @skip_chrome_61
    Scenario: Component lifecycle spans are automatically instrumented with React Router
        Given I navigate to the test URL "/docs/react-router"
        And I click the element "change-route-component-spans"
        And I click the element "update-props"
        And I click the element "hide-component"
        And I click the element "stop-clock"
        When I wait to receive 1 trace
        Then a span name equals "[ViewLoad/Component]Component"
        And a span name equals "[ViewLoadPhase/Mount]Component"
        And a span name equals "[ViewLoadPhase/Unmount]Component"
        And a span named "[ViewLoadPhase/Update]Component" contains the string array attribute "bugsnag.component.update.props":
            | count |

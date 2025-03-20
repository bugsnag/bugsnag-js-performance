@skip_on_cdn_build
Feature: Component lifecycle spans
    Scenario: Component lifecycle spans are automatically instrumented
        Given I navigate to the test URL "/docs/react"
        When I wait to receive 1 trace
        Then a span name equals "[ViewLoad/Component]Component"
        And a span name equals "[ViewLoadPhase/Mount]Component"
        And a span name equals "[ViewLoadPhase/Unmount]Component"
        And a span named "[ViewLoadPhase/Update]Component" contains the string array attribute "bugsnag.component.update.props":
            | count |

    @skip
    Scenario: Component lifecycle spans are instrumented with React Router
        Given I navigate to the test URL "/docs/react-router"
        And I click the element "change-route-nested-component"
        And I wait to receive 1 trace
        Then a span name equals "[ViewLoad/Component]Component"
        And a span name equals "[ViewLoadPhase/Mount]Component"
        Then I click the element "update-component"
        And I wait to receive 1 span
        Then a span name equals "[ViewLoadPhase/Update]ComponentName"
        Then I click the element "unmount-component"
        And I wait to receive 1 span
        Then a span name equals "[ViewLoadPhase/Unmount]ComponentName"

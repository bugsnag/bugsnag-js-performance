@skip_on_cdn_build
Feature: Component lifecycle spans
    Scenario: Component lifecycle spans are automatically instrumented
        Given I navigate to the test URL "/docs/react"
        When I wait to receive 1 trace
        Then a span name equals "[ViewLoad/Component]Component"
        And a span name equals "[ViewLoadPhase/Mount]Component"
        And a span name equals "[ViewLoadPhase/Update]Component"
        And a span name equals "[ViewLoadPhase/Unmount]Component"
        # [ViewLoadPhase/Update]Component attributes
        And the trace payload field "resourceSpans.0.scopeSpans.0.spans.2" string array attribute "bugsnag.component.update.props" equals the array:
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

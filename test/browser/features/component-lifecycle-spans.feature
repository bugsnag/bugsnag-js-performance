@skip_on_cdn_build @skip_safari_11 @skip_firefox_60 @skip_chrome_61
Feature: Component lifecycle spans
    Scenario: Component lifecycle spans are automatically instrumented
        Given I navigate to the test URL "/docs/react"
        When I wait to receive 1 trace
        Then a span name equals "[ViewLoad/Component]Component"
        And a span name equals "[ViewLoadPhase/Mount]Component"
        And a span name equals "[ViewLoadPhase/Unmount]Component"
        And a span named "[ViewLoadPhase/Update]Component" contains the string array attribute "bugsnag.component.update.props":
            | count |

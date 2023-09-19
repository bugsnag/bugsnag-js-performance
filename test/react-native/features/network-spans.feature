Feature: Network spans

    Scenario: Network spans are automatically instrumented for completed fetch and xhr requests
        When I run 'NetworkRequestScenario'
        And I wait to receive a sampling request
        And I wait for 2 spans

        Then a span named "[HTTP]/GET" contains the attributes:
            | attribute             | type             | value                                   |
            | bugsnag.span.category | stringValue      | network                                 |
            | http.method           | stringValue      | GET                                     |
            | http.url              | regexStringValue | ^https?:\/\/.*(:[0-9]+)?\/reflect\?fetch=true |
            | http.status_code      | intValue         | 200                                     |
        And a span named "[HTTP]/GET" contains the attributes:
            | attribute             | type             | value                                 |
            | bugsnag.span.category | stringValue      | network                               |
            | http.method           | stringValue      | GET                                   |
            | http.url              | regexStringValue | ^https?:\/\/.*(:[0-9]+)?\/reflect\?xhr=true |
            | http.status_code      | intValue         | 200                                   |

    Scenario: Network spans are not instrumented for failed requests
        When I run 'NetworkRequestFailedScenario'
        Then I should have received no spans

    # Should receive a span with a modified url from the fetch request, but not the xhr request
    Scenario: Network request callbacks are applied
        When I run 'NetworkRequestCallbackScenario'
        And I wait to receive a sampling request
        And I wait to receive 1 span

        Then a span named "[HTTP]/GET" contains the attributes:
            | attribute             | type             | value                                                              |
            | bugsnag.span.category | stringValue      | network                                                            |
            | http.method           | stringValue      | GET                                                                |
            | http.url              | regexStringValue | ^https?:\/\/.*(:[0-9]+)?\/reflect\?fetch=true&not-your-ordinary-url=true |
            | http.status_code      | intValue         | 200                                                                |

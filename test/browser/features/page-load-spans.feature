@requires_performance_navigation_timing
Feature: Page Load spans
    Scenario: Page load spans are automatically instrumented
        Given I navigate to the test URL "/page-load-spans"
        # click a button to record a first input delay metric
        And I click the element "stop-clock"
        And I wait to receive 1 traces

        Then a span named "[FullPageLoad]/page-load-spans/" contains the attributes:
            | attribute                         | type             | value                     |
            | bugsnag.span.category             | stringValue      | full_page_load            |
            | bugsnag.browser.page.title        | stringValue      | New title                 |
            | bugsnag.browser.page.route        | stringValue      | /page-load-spans/         |

        # Validate all web vitals events and attributes are present, depending on browser support (browser-steps.rb)  
        And the span named "[FullPageLoad]/page-load-spans/" is a valid full page load span

        # All spans should have a page url attribute
        And every span string attribute "bugsnag.browser.page.url" matches the regex "^http(s)?:\/\/.*:[0-9]{4}\/page-load-spans\/\?endpoint=.*\&logs=.*\&api_key=.*$"

        # We expect the following spans to always be present
        And a span named "[PageLoadPhase/HTTPRequest]/page-load-spans/" has a parent named "[FullPageLoad]/page-load-spans/"
        And a span named "[PageLoadPhase/HTTPRequest]/page-load-spans/" contains the attributes:
            | attribute                                 | type         | value                 | 
            | bugsnag.span.category                     | stringValue  | page_load_phase       |
            | bugsnag.browser.page.title                | stringValue  | New title       |
            | bugsnag.phase                             | stringValue  | HTTPRequest           |

        And a span named "[PageLoadPhase/HTTPResponse]/page-load-spans/" has a parent named "[FullPageLoad]/page-load-spans/"
        And a span named "[PageLoadPhase/HTTPResponse]/page-load-spans/" contains the attributes:
            | attribute                                 | type         | value                 | 
            | bugsnag.span.category                     | stringValue  | page_load_phase       |
            | bugsnag.browser.page.title                | stringValue  | New title       |
            | bugsnag.phase                             | stringValue  | HTTPResponse          |

        And a span named "[PageLoadPhase/DomContentLoadedEvent]/page-load-spans/" has a parent named "[FullPageLoad]/page-load-spans/"
        And a span named "[PageLoadPhase/DomContentLoadedEvent]/page-load-spans/" contains the attributes:
            | attribute                                 | type         | value                 | 
            | bugsnag.span.category                     | stringValue  | page_load_phase       |
            | bugsnag.browser.page.title                | stringValue  | New title       |
            | bugsnag.phase                             | stringValue  | DomContentLoadedEvent |

        And a span named "[PageLoadPhase/LoadEvent]/page-load-spans/" has a parent named "[FullPageLoad]/page-load-spans/"
        And a span named "[PageLoadPhase/LoadEvent]/page-load-spans/" contains the attributes:
            | attribute                                 | type         | value                 | 
            | bugsnag.span.category                     | stringValue  | page_load_phase       |
            | bugsnag.browser.page.title                | stringValue  | New title       |
            | bugsnag.phase                             | stringValue  | LoadEvent             |

        # The following spans may or may not be present in the trace. In most cases this is
        # because page load phase spans are not sent if the start and end times of the
        # performance entry are 0, but may also be down to differences in browser behaviour (e.g. Redirect)

        # Redirect may have 0 start and end times
        And if a span named "[PageLoadPhase/Redirect]/page-load-spans/" exists, it has a parent named "[FullPageLoad]/page-load-spans/"
        And if a span named "[PageLoadPhase/Redirect]/page-load-spans/" exists, it contains the attributes:
            | attribute                                 | type         | value                 |
            | bugsnag.span.category                     | stringValue  | page_load_phase       |
            | bugsnag.browser.page.title                | stringValue  | New title       |
            | bugsnag.phase                             | stringValue  | Redirect              |

        # Unload may have 0 start and end times
        And if a span named "[PageLoadPhase/Unload]/page-load-spans/" exists, it has a parent named "[FullPageLoad]/page-load-spans/"
        And if a span named "[PageLoadPhase/Unload]/page-load-spans/" exists, it contains the attributes:
            | attribute                                 | type         | value                 |
            | bugsnag.span.category                     | stringValue  | page_load_phase       |
            | bugsnag.browser.page.title                | stringValue  | New title       |
            | bugsnag.phase                             | stringValue  | Unload                |

        # LoadFromCache may have 0 start and end times 
        And if a span named "[PageLoadPhase/LoadFromCache]/page-load-spans/" exists, it has a parent named "[FullPageLoad]/page-load-spans/"
        And if a span named "[PageLoadPhase/LoadFromCache]/page-load-spans/" exists, it contains the attributes:
            | attribute                                 | type         | value                 | 
            | bugsnag.span.category                     | stringValue  | page_load_phase       |
            | bugsnag.browser.page.title                | stringValue  | New title       |
            | bugsnag.phase                             | stringValue  | LoadFromCache         |

        # DNSLookup may have 0 start and end times
        And if a span named "[PageLoadPhase/DNSLookup]/page-load-spans/" exists, it has a parent named "[FullPageLoad]/page-load-spans/"
        And if a span named "[PageLoadPhase/DNSLookup]/page-load-spans/" exists, it contains the attributes:
            | attribute                                 | type         | value                 | 
            | bugsnag.span.category                     | stringValue  | page_load_phase       |
            | bugsnag.browser.page.title                | stringValue  | New title       |
            | bugsnag.phase                             | stringValue  | DNSLookup             |

        # TCPHandshake may have 0 start and end times 
        And if a span named "[PageLoadPhase/TCPHandshake]/page-load-spans/" exists, it has a parent named "[FullPageLoad]/page-load-spans/"
        And if a span named "[PageLoadPhase/TCPHandshake]/page-load-spans/" exists, it contains the attributes:
            | attribute                                 | type         | value                 | 
            | bugsnag.span.category                     | stringValue  | page_load_phase       |
            | bugsnag.browser.page.title                | stringValue  | New title       |
            | bugsnag.phase                             | stringValue  | TCPHandshake          |

        # TLS may have 0 start and end times
        And if a span named "[PageLoadPhase/TLS]/page-load-spans/" exists, it has a parent named "[FullPageLoad]/page-load-spans/"
        And if a span named "[PageLoadPhase/TLS]/page-load-spans/" exists, it contains the attributes:
            | attribute                                 | type         | value                 | 
            | bugsnag.span.category                     | stringValue  | page_load_phase       |
            | bugsnag.browser.page.title                | stringValue  | New title       |
            | bugsnag.phase                             | stringValue  | TLS                   |

    Scenario: Page load spans can have attributes dropped by sendPageAttributes config
        Given I navigate to the test URL "/network-span-control"
        When I click the element "page-load-no-attributes"
        And I wait to receive 1 traces

        Then a span named "[FullPageLoad]/network-span-control/" does not contain the attribute "bugsnag.browser.page.title"
        And a span named "[FullPageLoad]/network-span-control/" does not contain the attribute "bugsnag.browser.page.url"
        And a span named "[FullPageLoad]/network-span-control/" does not contain the attribute "bugsnag.browser.page.referrer"

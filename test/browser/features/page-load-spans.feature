@requires_performance_navigation_timing
Feature: Page Load spans
    Scenario: Page load spans are automatically instrumented
        Given I navigate to the test URL "/page-load-spans"
        # click a button to record a first input delay metric
        And I click the element "stop-clock"
        And I wait to receive 1 traces

        Then a span named "[FullPageLoad]/page-load-spans/" contains the attributes:
            | attribute                         | type             | value                    |
            | bugsnag.span.category             | stringValue      | full_page_load           |
            | bugsnag.browser.page.title        | stringValue      | Page load spans          |
            | bugsnag.browser.page.route        | stringValue      | /page-load-spans/        |
        # Skipping until the referrer handling is implemented for mobile devices [PLAT-10176]
           #| bugsnag.browser.page.referrer     | stringValue      | /                        |
        
        # Validate all web vitals events and attributes are present, depending on browser support (browser-steps.rb)  
        And the span named "[FullPageLoad]/page-load-spans/" is a valid full page load span

        # All spans should have a page url attribute
        And every span string attribute "bugsnag.browser.page.url" matches the regex "^http:\/\/.*:[0-9]{4}\/page-load-spans\/.*\/?endpoint=.*\&logs=.*\&api_key=.*$"

        # We expect the following spans to always be present
        And a span named "[PageLoadPhase/HTTPRequest]/page-load-spans/" contains the attributes:
            | attribute                                 | type         | value           | 
            | bugsnag.span.category                     | stringValue  | custom          |
            | bugsnag.browser.page.title                | stringValue  | Page load spans |

        And a span named "[PageLoadPhase/HTTPResponse]/page-load-spans/" contains the attributes:
            | attribute                                 | type         | value           | 
            | bugsnag.span.category                     | stringValue  | custom          |
            | bugsnag.browser.page.title                | stringValue  | Page load spans |

        And a span named "[PageLoadPhase/DomContentLoadedEvent]/page-load-spans/" contains the attributes:
            | attribute                                 | type         | value           | 
            | bugsnag.span.category                     | stringValue  | custom          |
            | bugsnag.browser.page.title                | stringValue  | Page load spans |

        And a span named "[PageLoadPhase/LoadEvent]/page-load-spans/" contains the attributes:
            | attribute                                 | type         | value           | 
            | bugsnag.span.category                     | stringValue  | custom          |
            | bugsnag.browser.page.title                | stringValue  | Page load spans |

        # The following spans may or may not be present in the trace. In most cases this is
        # because page load phase spans are not sent if the start and end times of the
        # performance entry are 0, but may also be down to differences in browser behaviour (e.g. Redirect)

        # Redirect doesn't seem to happen on Firefox
        And if a span named "[PageLoadPhase/Redirect]/page-load-spans/" exists, it contains the attributes:
            | attribute                                 | type         | value           |
            | bugsnag.span.category                     | stringValue  | custom          |
            | bugsnag.browser.page.title                | stringValue  | Page load spans |

        # Unload may have 0 start and end times 
        And if a span named "[PageLoadPhase/Unload]/page-load-spans/" exists, it contains the attributes:
            | attribute                                 | type         | value           |
            | bugsnag.span.category                     | stringValue  | custom          |
            | bugsnag.browser.page.title                | stringValue  | Page load spans |

        # LoadFromCache may have 0 start and end times 
        And if a span named "[PageLoadPhase/LoadFromCache]/page-load-spans/" exists, it contains the attributes:
            | attribute                                 | type         | value           | 
            | bugsnag.span.category                     | stringValue  | custom          |
            | bugsnag.browser.page.title                | stringValue  | Page load spans |

        # DNSLookup may have 0 start and end times
        And if a span named "[PageLoadPhase/DNSLookup]/page-load-spans/" exists, it contains the attributes:
            | attribute                                 | type         | value           | 
            | bugsnag.span.category                     | stringValue  | custom          |
            | bugsnag.browser.page.title                | stringValue  | Page load spans |

        # TCPHandshake may have 0 start and end times    
        And a span named "[PageLoadPhase/TCPHandshake]/page-load-spans/" contains the attributes:
            | attribute                                 | type         | value           | 
            | bugsnag.span.category                     | stringValue  | custom          |
            | bugsnag.browser.page.title                | stringValue  | Page load spans |

        # TLS may have 0 start and end times
        And if a span named "[PageLoadPhase/TLS]/page-load-spans/" exists, it contains the attributes:
            | attribute                                 | type         | value           | 
            | bugsnag.span.category                     | stringValue  | custom          |
            | bugsnag.browser.page.title                | stringValue  | Page load spans |



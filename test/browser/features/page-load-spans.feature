@requires_performance_navigation_timing
Feature: Page Load spans
    Scenario: Page load spans are automatically instrumented
        Given I navigate to the test URL "/page-load-spans"
        # click a button to record a first input delay metric
        Given the element "stop-clock" is present
        And I click the element "stop-clock"
        And I wait to receive 1 traces

        Then a span named "[FullPageLoad]/page-load-spans/redirect.html" contains the attributes:
            | attribute                         | type             | value                                                                                 |
            | bugsnag.span.category             | stringValue      | full_page_load                                                                        |
            | bugsnag.span.first_class          | boolValue        | true                                                                                  |
            | bugsnag.browser.page.title        | stringValue      | Page load spans                                                                       |
            | bugsnag.browser.page.route        | stringValue      | /page-load-spans/redirect.html                                                                     |
        # Skipping until the referrer handling is implemented for mobile devices [PLAT-10176]
           #| bugsnag.browser.page.referrer     | stringValue      | /                                                                                     |
        
        # Validate all web vitals events and attributes are present, depending on browser support (browser-steps.rb)  
        And the span named "[FullPageLoad]/page-load-spans/redirect.html" is a valid full page load span

        # All spans should have a page url attribute
        And every span string attribute "bugsnag.browser.page.url" matches the regex "^http:\/\/.*:[0-9]{4}\/page-load-spans\/.*\/?endpoint=.*\&logs=.*\&api_key=.*$"

        And a span named "[PageLoadPhase/Unload]/page-load-spans/redirect.html" contains the attributes:
            | attribute                                 | type         | value           |
            | bugsnag.span.category                     | stringValue  | custom          |
            | bugsnag.span.first_class                  | boolValue    | true            |
            | bugsnag.browser.page.title                | stringValue  | Page load spans |

        # TODO: add a separate scenario to test the redirect event (it looks like redirect and unload are mutually exclusive)
        # And a span named "[PageLoadPhase/Redirect]/page-load-spans/redirect.html" exists contains the attributes:
        #     | attribute                                 | type         | value           |
        #     | bugsnag.span.category                     | stringValue  | custom          |
        #     | bugsnag.span.first_class                  | boolValue    | true            |
        #     | bugsnag.browser.page.title                | stringValue  | Page load spans |

        And a span named "[PageLoadPhase/LoadFromCache]/page-load-spans/redirect.html" contains the attributes:
            | attribute                                 | type         | value           | 
            | bugsnag.span.category                     | stringValue  | custom          |
            | bugsnag.span.first_class                  | boolValue    | true            |
            | bugsnag.browser.page.title                | stringValue  | Page load spans |

        And a span named "[PageLoadPhase/DNSLookup]/page-load-spans/redirect.html" contains the attributes:
            | attribute                                 | type         | value           | 
            | bugsnag.span.category                     | stringValue  | custom          |
            | bugsnag.span.first_class                  | boolValue    | true            |
            | bugsnag.browser.page.title                | stringValue  | Page load spans |
            
        And a span named "[PageLoadPhase/TCPHandshake]/page-load-spans/redirect.html" contains the attributes:
            | attribute                                 | type         | value           | 
            | bugsnag.span.category                     | stringValue  | custom          |
            | bugsnag.span.first_class                  | boolValue    | true            |
            | bugsnag.browser.page.title                | stringValue  | Page load spans |

        And a span named "[PageLoadPhase/TLS]/page-load-spans/redirect.html" contains the attributes:
            | attribute                                 | type         | value           | 
            | bugsnag.span.category                     | stringValue  | custom          |
            | bugsnag.span.first_class                  | boolValue    | true            |
            | bugsnag.browser.page.title                | stringValue  | Page load spans |

        And a span named "[PageLoadPhase/HTTPRequest]/page-load-spans/redirect.html" contains the attributes:
            | attribute                                 | type         | value           | 
            | bugsnag.span.category                     | stringValue  | custom          |
            | bugsnag.span.first_class                  | boolValue    | true            |
            | bugsnag.browser.page.title                | stringValue  | Page load spans |

        And a span named "[PageLoadPhase/HTTPResponse]/page-load-spans/redirect.html" contains the attributes:
            | attribute                                 | type         | value           | 
            | bugsnag.span.category                     | stringValue  | custom          |
            | bugsnag.span.first_class                  | boolValue    | true            |
            | bugsnag.browser.page.title                | stringValue  | Page load spans |

        And a span named "[PageLoadPhase/DomContentLoadedEvent]/page-load-spans/redirect.html" contains the attributes:
            | attribute                                 | type         | value           | 
            | bugsnag.span.category                     | stringValue  | custom          |
            | bugsnag.span.first_class                  | boolValue    | true            |
            | bugsnag.browser.page.title                | stringValue  | Page load spans |

        And a span named "[PageLoadPhase/LoadEvent]/page-load-spans/redirect.html" contains the attributes:
            | attribute                                 | type         | value           | 
            | bugsnag.span.category                     | stringValue  | custom          |
            | bugsnag.span.first_class                  | boolValue    | true            |
            | bugsnag.browser.page.title                | stringValue  | Page load spans |

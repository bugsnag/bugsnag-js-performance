Feature: Page Load spans

    Scenario: Page load spans are automatically instrumented
        Given I navigate to the test URL "/page-load-spans"
        # click a button to record a first input delay metric
        And I click the element "stop-clock"
        And I wait to receive 1 traces

        Then a span named "[FullPageLoad]/page-load-spans/" contains the attributes:
            | attribute                                 | type         | value             |
            | bugsnag.span.category                     | stringValue  | full_page_load    |
            | bugsnag.span.first_class                  | boolValue    | true              |
            | bugsnag.browser.page.title                | stringValue  | Page load spans   |
            | bugsnag.browser.page.route                | stringValue  | /page-load-spans/ |
            # | bugsnag.browser.page.referrer           | stringValue  | / |
            # | bugsnag.browser.page.url                | stringValue  | ??? |

        # Skipping until the referrer handling is implemented for mobile devices [PLAT-10176]
        # And the trace payload field "resourceSpans.0.scopeSpans.0.spans.9" string attribute "bugsnag.browser.page.referrer" equals ""
        
        # Validate all web vitals events and attributes are present, depending on browser support (browser-steps.rb)  
        And the span named "[FullPageLoad]/page-load-spans/" is a valid full page load span

        # Validate auto instrumented page load phase spans
        # How can we make these optional?
        # And a span named "[PageLoadPhase/Unload]/page-load-spans/" contains the attributes:
        #     | attribute                                 | type         | value           |
        #     | bugsnag.span.category                     | stringValue  | custom          |
        #     | bugsnag.span.first_class                  | boolValue    | true            |
        #     | bugsnag.browser.page.title                | stringValue  | Page load spans |

        # And a span named "[PageLoadPhase/Redirect]/page-load-spans/" contains the attributes:
        #     | attribute                                 | type         | value           |
        #     | bugsnag.span.category                     | stringValue  | custom          |
        #     | bugsnag.span.first_class                  | boolValue    | true            |
        #     | bugsnag.browser.page.title                | stringValue  | Page load spans |

        And a span named "[PageLoadPhase/LoadFromCache]/page-load-spans/" contains the attributes:
            | attribute                                 | type         | value           | 
            | bugsnag.span.category                     | stringValue  | custom          |
            | bugsnag.span.first_class                  | boolValue    | true            |
            | bugsnag.browser.page.title                | stringValue  | Page load spans |

        And a span named "[PageLoadPhase/DNSLookup]/page-load-spans/" contains the attributes:
            | attribute                                 | type         | value           | 
            | bugsnag.span.category                     | stringValue  | custom          |
            | bugsnag.span.first_class                  | boolValue    | true            |
            | bugsnag.browser.page.title                | stringValue  | Page load spans |
            
        And a span named "[PageLoadPhase/TCPHandshake]/page-load-spans/" contains the attributes:
            | attribute                                 | type         | value           | 
            | bugsnag.span.category                     | stringValue  | custom          |
            | bugsnag.span.first_class                  | boolValue    | true            |
            | bugsnag.browser.page.title                | stringValue  | Page load spans |

        And a span named "[PageLoadPhase/TLS]/page-load-spans/" contains the attributes:
            | attribute                                 | type         | value           | 
            | bugsnag.span.category                     | stringValue  | custom          |
            | bugsnag.span.first_class                  | boolValue    | true            |
            | bugsnag.browser.page.title                | stringValue  | Page load spans |

        And a span named "[PageLoadPhase/HTTPRequest]/page-load-spans/" contains the attributes:
            | attribute                                 | type         | value           | 
            | bugsnag.span.category                     | stringValue  | custom          |
            | bugsnag.span.first_class                  | boolValue    | true            |
            | bugsnag.browser.page.title                | stringValue  | Page load spans |

        And a span named "[PageLoadPhase/HTTPResponse]/page-load-spans/" contains the attributes:
            | attribute                                 | type         | value           | 
            | bugsnag.span.category                     | stringValue  | custom          |
            | bugsnag.span.first_class                  | boolValue    | true            |
            | bugsnag.browser.page.title                | stringValue  | Page load spans |

        And a span named "[PageLoadPhase/DomContentLoadedEvent]/page-load-spans/" contains the attributes:
            | attribute                                 | type         | value           | 
            | bugsnag.span.category                     | stringValue  | custom          |
            | bugsnag.span.first_class                  | boolValue    | true            |
            | bugsnag.browser.page.title                | stringValue  | Page load spans |

        And a span named "[PageLoadPhase/LoadEvent]/page-load-spans/" contains the attributes:
            | attribute                                 | type         | value           | 
            | bugsnag.span.category                     | stringValue  | custom          |
            | bugsnag.span.first_class                  | boolValue    | true            |
            | bugsnag.browser.page.title                | stringValue  | Page load spans |

Feature: Fixed Sampling Probability

  Scenario: Uses configured sampling probability
    When I run 'FixedSamplingProbabilityScenario'
    And I wait to receive 1 trace
    Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "Span 1"
    And the trace payload field "resourceSpans.0.scopeSpans.0.spans.0" double attribute "bugsnag.sampling.p" equals 1.0
    Then the trace "Bugsnag-Span-Sampling" header is not present

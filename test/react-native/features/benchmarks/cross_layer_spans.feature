Feature: Cross-Layer Spans

  Scenario Outline:
    When I run benchmark "NativeNamedSpanBenchmark" configured as <options>
    And I wait for 30 seconds
    And I wait to receive at least 1 metrics
    And I discard the oldest metric

    Examples:
      | options                                    |
      | "nativeSpans"                              |
      | "nativeSpans jsSpans"                      |
      | "nativeSpans rendering"                    |
      | "nativeSpans cpu"                          |
      | "nativeSpans memory"                       |
      | "nativeSpans rendering cpu memory"         |
      | "nativeSpans rendering cpu memory jsSpans" |

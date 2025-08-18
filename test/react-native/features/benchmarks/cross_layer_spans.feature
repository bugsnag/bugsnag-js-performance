Feature: Cross-Layer Spans

  Scenario Outline:
    When I run benchmark "NativeNamedSpanBenchmark" configured as <options>
    And I wait for 30 seconds
    And I wait to receive at least 1 metrics
    And I discard the oldest metric

    Examples:
      | options                                           |
      | "native nativeSpans"                              |
      | "native nativeSpans jsSpans"                      |
      | "native nativeSpans rendering"                    |
      | "native nativeSpans cpu"                          |
      | "native nativeSpans memory"                       |
      | "native nativeSpans rendering cpu memory"         |
      | "native nativeSpans rendering cpu memory jsSpans" |

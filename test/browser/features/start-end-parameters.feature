Feature: Date sanitisation

    Scenario Outline: Check start and end with different combinations
        Given I navigate to the test URL "/start-end-parameters"
        And I click the element <start>
        Then I wait for 1 second
        And I click the element <end>

        # Trace payload is validated by maze-runner
        Then I wait to receive 1 trace

        Examples:
            | start    | end      |
            | "date"   | "date"   |
            | "date"   | "number" |
            | "date"   | "null"   |
            | "number" | "date"   |
            | "number" | "number" |
            | "number" | "null"   |
            | "null"   | "date"   |
            | "null"   | "number" |
            | "null"   | "null"   |

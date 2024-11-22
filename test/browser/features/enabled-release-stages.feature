Feature: Configuration

  Scenario: Delivery is prevented when releaseStage is not in enabledReleaseStages
    Given I navigate to the test URL "/enabled-release-stages-disabled"
    Then I should receive no traces

  Scenario: Delivery is allowed when releaseStage is present in enabledReleaseStages
    Given I navigate to the test URL "/enabled-release-stages"
    And I wait to receive at least 1 trace
    Then the trace payload field "resourceSpans.0.scopeSpans.0.spans.0.name" equals "Custom/Should send"
    And the trace payload field "resourceSpans.0.resource" string attribute "deployment.environment" equals "test"

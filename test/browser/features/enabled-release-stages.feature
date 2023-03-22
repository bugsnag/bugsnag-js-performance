Feature: Configuration

  Scenario: Delivery is prevented when releaseStage is not in enabledReleaseStages
    Given I navigate to the test URL "/enabled-release-stages-disabled"
    Then I should receive no traces

  Scenario: Delivery is allowed when releaseStage is present in enabledReleaseStages
    Given I navigate to the test URL "/enabled-release-stages"
    Then I wait to receive at least 1 trace

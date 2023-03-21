Feature: Configuration

  Scenario: Delivery is prevented when releaseStage is not in enabledReleaseStages
    Given I navigate to the test URL "/enabled-release-stages"
    Then I should receive no traces

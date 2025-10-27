Feature: Device ID persistence

  Scenario: persisted device ID is used if present
    # load the page and persist an ID
    Given I navigate to the test URL "/docs/retry-scenario"
    And I wait to receive a sampling request
    And I store the device ID "c1234567890abcdefghijklmnop"

    # reload the page to prove the ID was persisted and not just available in
    # memory somehow
    When I navigate to the test URL "/docs/retry-scenario"
    And I wait to receive a sampling request
    And I click the element "send-first-span"
    And I wait to receive at least 1 span
    Then the trace payload field "resourceSpans.0.resource" string attribute "device.id" equals "c1234567890abcdefghijklmnop"

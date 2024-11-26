Feature: Integrity header

Scenario: Integrity headers are set when setPayloadChecksums is true
  Given I navigate to the test URL "/docs/integrity"
  And I wait to receive a sampling request
  Then I click the element "send-span"
  And I wait for 1 span

  Then the sampling request "bugsnag-integrity" header matches the regex "^sha1 (\d|[abcdef]){40}$"
  Then the trace "bugsnag-integrity" header matches the regex "^sha1 (\d|[abcdef]){40}$"

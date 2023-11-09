Feature: Persistent state

# Scenario: Sampling value of 0 is read on app launch
#   Given I execute the command "set-sampling-probability-to-0"
#   When I run "SpanTriggeredByCommandScenario"
#   And I execute the command "start-span"
#   Then I should receive no traces

# Scenario: Device ID is read on app launch
#   Given I execute the command "set-device-id"
#   When I run "SpanTriggeredByCommandScenario"
#   And I execute the command "start-span"
#   And I wait to receive 1 trace
#   Then the trace payload field "resourceSpans.0.resource" string attribute "device.id" equals "c1234567890abcdefghijklmnop"

# Scenario: Invalid sampling value is ignored on app launch
#   Given I execute the command "set-invalid-sampling-probability"
#   When I run "SpanTriggeredByCommandScenario"
#   And I execute the command "start-span"
#   Then I wait to receive 1 trace

Scenario: Expired sampling value is ignored on app launch
  Given I execute the command "set-expired-sampling-probability"
  When I run "SpanTriggeredByCommandScenario"
  And I wait to receive a sampling request
  And I execute the command "start-span"
  Then I wait to receive 1 trace

# Scenario: Invalid device ID is ignored on app launch
#   Given I execute the command "set-invalid-device-id"
#   When I run "SpanTriggeredByCommandScenario"
#   And I execute the command "start-span"
#   And I wait to receive 1 trace
#   Then the trace payload field "resourceSpans.0.resource" string attribute "device.id" matches the regex "^c[a-z0-9]{20,32}$"

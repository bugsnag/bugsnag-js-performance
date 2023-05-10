# Checks that a span with a given name includes all the specified events
# and validates that their value is between the start and end time of the span 
#
# @step_input span_name [String] The name of the span to check
# @step_input table [Cucumber::MultilineArgument::DataTable] Table of expected event names
Then("a span named {string} contains the events:") do |span_name, table|
  spans = spans_from_request_list(Maze::Server.list_for("traces"))
  named_spans = spans.find_all { |span| span["name"] == span_name }
  raise Test::Unit::AssertionFailedError.new "No spans were found with the name #{span_name}" if named_spans.empty?

  expected_events = table.hashes

  match = named_spans.find_all do |span|
    matches = expected_events.flat_map do |expected_event|
      event_name = expected_event["name"]
      span["events"].find_all { |event| event["name"] == event_name }
    end

    matches.size == expected_events.size
  end
  
  raise Test::Unit::AssertionFailedError.new "No spans were found containing all of the given events" unless match.size == 1
  
  all_valid = match.each do |span|
    startTime = span["startTimeUnixNano"].to_i
    endTime = span["endTimeUnixNano"].to_i

    matches = expected_events.flat_map do |expected_event|
      event_name = expected_event["name"]
      span["events"].find_all { |event| event["name"] == event_name }
    end

    matches.all? { |event| event["timeUnixNano"].to_i > startTime && event["timeUnixNano"].to_i < endTime }
  end

  raise Test::Unit::AssertionFailedError.new "Not all events were within the expected time range" unless all_valid

end

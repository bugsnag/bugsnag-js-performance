# Checks that a span with a given name includes all the specified events
# and validates that their value is between the start and end time of the span 
#
# TODO: Throw error if time is not valid
#
# @step_input span_name [String] The name of the span to check
# @step_input table [Cucumber::MultilineArgument::DataTable] Table of expected event names
Then('a span named {string} contains the events:') do |span_name, table|
    spans = spans_from_request_list(Maze::Server.list_for('traces'))
    named_spans = spans.find_all { |span| span['name'].eql?(span_name) }
    raise Test::Unit::AssertionFailedError.new "No spans were found with the name #{span_name}" if named_spans.empty?
  
    expected_events = table.hashes
  
    match = false
    named_spans.each do |span|
      matches = expected_events.map do |expected_event|
        span['events'].find_all { |event| event['name'].eql?(expected_event['name']) }
          .any? { |event| event['timeUnixNano'] > span['startTimeUnixNano'] && event['timeUnixNano'] < span['endTimeUnixNano'] }
      end
      if matches.all? && !matches.empty?
        match = true
        break
      end
    end
  
    unless match
      raise Test::Unit::AssertionFailedError.new "No spans were found containing all of the given events"
    end
end

When('I run {string}') do |scenario_name|
  execute_command 'run-scenario', scenario_name
end

When('I execute the command {string}') do |command|
  execute_command(command)
end

When('I clear all persistent data') do
  execute_command 'clear-all-persistent-data'
end

When('I navigate to {string}') do |screen|
  execute_command 'navigate', screen
end

Then('the trace payload field {string} string attribute {string} equals the platform-dependent string:') do |field, attribute, platform_values|
  expected_value = get_expected_platform_value(platform_values)
  if !expected_value.eql?('@skip')
    check_attribute_equal_with_nullability field, attribute, 'stringValue', expected_value
  end
end

When("I relaunch the app after shutdown") do
  max_attempts = 20
  attempts = 0
  manager = Maze::Api::Appium::AppManager.new
  state = manager.state
  until (attempts >= max_attempts) || state == :not_running
    attempts += 1
    state = manager.state
    sleep 0.5
  end
  $logger.warn "App state #{state} instead of not_running after 10s" unless state == :not_running

  manager.activate
end

When("the span named {string} was delivered approximately {int} seconds after ending") do |span_name, expected_seconds|
  # Get all spans to find the target span
  spans = spans_from_request_list(Maze::Server.list_for('traces'))
  target_span = spans.find { |span| span['name'].eql?(span_name) }
  
  raise Test::Unit::AssertionFailedError.new "No spans were found with the name #{span_name}" if target_span.nil?
  
  # Find the request that contains the span by iterating through remaining requests
  target_request = nil
  Maze::Server.list_for('traces').remaining.each do |request|
    # Check if this request contains spans with the target name by examining the request body
    request_body = request[:body]
    if request_body && request_body['resourceSpans']
      has_target_span = request_body['resourceSpans'].any? do |resource_span|
        resource_span['scopeSpans']&.any? do |scope_span|
          scope_span['spans']&.any? { |span| span['name'].eql?(span_name) }
        end
      end
      
      if has_target_span
        target_request = request
        break
      end
    end
  end
  
  raise Test::Unit::AssertionFailedError.new "No requests found containing span #{span_name}" if target_request.nil?
  
  # Get the bugsnag-sent-at header from the request
  sent_at_header = target_request[:request]['bugsnag-sent-at']
  raise Test::Unit::AssertionFailedError.new "bugsnag-sent-at header not found in request" if sent_at_header.nil?
  
  # Parse the sent-at time (ISO format) and convert to nanoseconds
  delivery_time = Time.parse(sent_at_header)
  delivery_time_ns = (delivery_time.to_f * 1_000_000_000).to_i
  
  # Get the span's end time
  span_end_time = Integer(target_span["endTimeUnixNano"])
  
  # Calculate the time difference between sent-at and span end
  time_difference_ns = delivery_time_ns - span_end_time
  time_difference_seconds = time_difference_ns / 1_000_000_000.0
  
  # Check if the difference is approximately the expected number of seconds (±1 second tolerance)
  tolerance = 1.0
  expected_min = expected_seconds - tolerance
  expected_max = expected_seconds + tolerance
  
  Maze.check.operator(
    time_difference_seconds,
    :>=,
    expected_min,
    "Span '#{span_name}' was delivered #{time_difference_seconds.round(2)} seconds after its end time (based on bugsnag-sent-at), expected at least #{expected_min} seconds"
  )
  
  Maze.check.operator(
    time_difference_seconds,
    :<=,
    expected_max,
    "Span '#{span_name}' was delivered #{time_difference_seconds.round(2)} seconds after its end time (based on bugsnag-sent-at), expected at most #{expected_max} seconds"
  )
end

def execute_command(action, scenario_name = '')
  address = if Maze.config.farm == :bb
              if Maze.config.aws_public_ip
                Maze.public_address
              else
                'local:9339'
              end
            else
              case Maze::Helper.get_current_platform
                when 'android'
                  'localhost:9339'
                else
                  'bs-local.com:9339'
              end
            end

  command = {
    action: action,
    scenario_name: scenario_name,
    payload: scenario_name,
    endpoint: "http://#{address}/traces",
    api_key: $api_key,
  }

  $logger.debug("Queuing command: #{command}")
  Maze::Server.commands.add command
end

def get_expected_platform_value(platform_values)
  os = Maze::Helper.get_current_platform
  expected_value = Hash[platform_values.raw][os.downcase]
  raise("There is no expected value for the current platform \"#{os}\"") if expected_value.nil?

  expected_value
end

def get_attribute_value(field, attribute, attr_type)
  list = Maze::Server.list_for 'trace'
  attributes = Maze::Helper.read_key_path list.current[:body], "#{field}.attributes"
  attribute = attributes.find { |a| a['key'] == attribute }
  return nil if attribute.nil?

  value = attribute&.dig 'value', attr_type
  attr_type == 'intValue' && value.is_a?(String) ? value.to_i : value
end

def check_attribute_equal_with_nullability(field, attribute, attr_type, expected)
  actual = get_attribute_value field, attribute, attr_type

  case expected
  when '@null'
    Maze.check.nil(actual)
  when '@not_null'
    Maze.check.not_nil(actual)
  else
    Maze.check.equal(expected, actual)
  end
end

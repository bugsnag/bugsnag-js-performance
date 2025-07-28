SDK_VERSION = File.read("#{__dir__}/../fixtures/.bugsnag-browser-version")

When("I navigate to the test URL {string}") do |test_path|
  path = $url_generator.for_path(test_path)
  step("I navigate to the URL \"#{path}\"")

  # store environment based on hostname
  driver = Maze.driver.instance_variable_get(:@driver)
  hostname = driver.execute_script("return window.location.hostname")
  url = driver.execute_script("return window.location.href")
  environment = hostname == "localhost" ? "development" : "production"
  Maze::Store.values["environment"] = environment
  Maze::Store.values["bugsnag.browser.page.url"] = url

  # store package version that we stashed away in build-packages.rb
  Maze::Store.values["telemetry.sdk.version"] = SDK_VERSION
end

When("I set the HTTP status code for the next {int} {string} requests to {int}") do |count, http_verb, status_code|
  raise("Invalid HTTP verb: #{http_verb}") unless Maze::Server::ALLOWED_HTTP_VERBS.include?(http_verb)

  codes = [status_code] * count

  generator = Maze::Generator.new(
    Enumerator.new do |yielder|
      codes.each do |code|
        yielder.yield code
      end

      loop do
        yielder.yield 200
      end
    end
  )

  Maze::Server.set_status_code_generator(generator, http_verb)
end

Then("I discard the oldest {int} {word}") do |number_to_discard, request_type|
  raise "No #{request_type} to discard" if Maze::Server.list_for(request_type).current.nil?

  number_to_discard.times do
    Maze::Server.list_for(request_type).next
  end
end

When("I minimise the browser window") do
  driver = Maze.driver.instance_variable_get(:@driver)
  driver.manage.window.minimize
end

# Checks that a span with a given name is a valid page load span:
#
#   1. its name starts with "[FullPageLoad]"
#   2. it has the expected events for a page load ("ttfb" & friends)
#   3. each event's "timeUnixNano" is between the span's start & end time
#
# This step also checks that there is only one full page load span across all
# received traces as they play by highlander rules (there can only be one)
#
# @step_input span_name [String] The name of the span to check
Then("the span named {string} is a valid full page load span") do |span_name|
  supported_web_vitals = $browser.supported_web_vitals

  # "cls" (cumulative layout shift) is an attribute, not an event
  supports_cumulative_layout_shift = supported_web_vitals.include?("cls")
  expected_event_names = supported_web_vitals.select { |vital| vital != "cls" }

  page_load_span_prefix = "[FullPageLoad]"

  Maze.check.true(
    span_name.start_with?(page_load_span_prefix),
    "A page load span's name should start with '#{page_load_span_prefix}'"
  )

  spans = spans_from_request_list(Maze::Server.list_for("traces"))

  # grab all the span names so the error is more useful if no span is found as
  # this will output all of the span names when it fails
  span_names = spans.map { |span| span["name"] }
  Maze.check.includes(span_names, span_name, "No spans were found with the name '#{span_name}'")

  page_load_spans = spans.select { |span| span["name"].start_with?(page_load_span_prefix) }
  Maze.check.true(
    page_load_spans.length == 1,
    <<~MESSAGE
      Expected only one page load span but found #{page_load_spans.length}:
        - #{page_load_spans.map { |span| span["name"] }.join("\n  - ") }
    MESSAGE
  )

  span = page_load_spans.first
  Maze.check.equal(span_name, span["name"])

  span_event_names = span["events"].map { |event| event["name"] }.sort

  Maze.check.equal(
    expected_event_names.sort,
    span_event_names,
    "The span's events do not match the expected events"
  )

  start_time = Integer(span["startTimeUnixNano"])

  span["events"].each do |event|
    event_time = Integer(event["timeUnixNano"])

    Maze.check.operator(
      start_time,
      :<=,
      event_time,
      "The '#{event["name"]}' event happened before the span's start time (#{start_time - event_time}ns difference)"
    )
  end

  # Check the string attribute "referrer" is equal to document.referrer
  referrer = get_attribute_value_from_span(span, "bugsnag.browser.page.referrer", "stringValue")

  driver = Maze.driver.instance_variable_get(:@driver)
  scenario_referrer = driver.execute_script("return document.referrer")

  Maze.check.true(
    referrer == scenario_referrer,
    "Referrer attribute does not match, expected #{scenario_referrer}, got #{referrer}"
  )

  if supports_cumulative_layout_shift
    cumulative_layout_shift_attributes = span["attributes"].find_all do |attribute|
      attribute["key"] == "bugsnag.metrics.cls"
    end

    Maze.check.true(
      cumulative_layout_shift_attributes.length == 1,
      "Expected 1 'bugsnag.metrics.cls' attribute, found: #{cumulative_layout_shift_attributes.length}"
    )

    cumulative_layout_shift_attribute = cumulative_layout_shift_attributes.first

    Maze.check.true(
      cumulative_layout_shift_attribute["value"].key?("doubleValue"),
      "Expected an doubleValue attribute, got: #{cumulative_layout_shift_attribute}"
    )
  end
end

Given("I store the device ID {string}") do |device_id|
  driver = Maze.driver.instance_variable_get(:@driver)
  driver.execute_script("localStorage.setItem('bugsnag-anonymous-id', '#{device_id}')")
end


Then('if a span named {string} exists, it contains the attributes:') do |span_name, table|
  spans = spans_from_request_list(Maze::Server.list_for('traces'))
  named_spans = spans.find_all { |span| span['name'].eql?(span_name) }
  if !named_spans.empty?
    expected_attributes = table.hashes

    match = false
    named_spans.each do |span|
      matches = expected_attributes.map do |expected_attribute|
        span['attributes'].find_all { |attribute| attribute['key'].eql?(expected_attribute['attribute']) }
          .any? { |attribute| attribute_value_matches?(attribute['value'], expected_attribute['type'], expected_attribute['value']) }
      end
      if matches.all? && !matches.empty?
        match = true
        break
      end
    end
  
    unless match
      raise Test::Unit::AssertionFailedError.new "No spans were found containing all of the given attributes"
    end
  else
    $logger.info("No spans were found matching the name '#{span_name}'")
  end
end

Then('if a span named {string} exists, it has a parent named {string}') do |child_name, parent_name|
  spans = spans_from_request_list(Maze::Server.list_for('traces'))
  child_spans = spans.find_all { |span| span['name'].eql?(child_name) }

  if !child_spans.empty?
    parent_spans = spans.find_all { |span| span['name'].eql?(parent_name) }
    raise Test::Unit::AssertionFailedError.new "No spans were found with the name #{parent_name}" if parent_spans.empty?
  
    expected_parent_ids = child_spans.map { |span| span['parentSpanId'] }
    parent_ids = parent_spans.map { |span| span['spanId'] }
    match = expected_parent_ids.any? { |expected_id| parent_ids.include?(expected_id) }
  
    unless match
      raise Test::Unit::AssertionFailedError.new "No child span named #{child_name} was found with a parent named #{parent_name}"
    end
  else
    $logger.info("No spans were found matching the name '#{child_name}'")
  end
end

Then('a span named {string} contains the string array attribute {string}:') do |span_name, attribute, table|
  spans = spans_from_request_list(Maze::Server.list_for('traces'))
  named_spans = spans.find_all { |span| span['name'].eql?(span_name) }
  raise Test::Unit::AssertionFailedError.new "No spans were found with the name #{span_name}" if named_spans.empty?

  expected_values = table.raw.flatten

  named_spans.each do |span|
    attribute_values = span['attributes'].find { |attr| attr['key'].eql?(attribute) }&.dig('value', 'arrayValue', 'values')&.map { |v| v['stringValue'] }
    if attribute_values.nil?
      raise Test::Unit::AssertionFailedError.new "Attribute #{attribute} was not found on span #{span_name}"
    end

    missing_values = expected_values - attribute_values
    unless missing_values.empty?
      raise Test::Unit::AssertionFailedError.new "Attribute #{attribute} on span #{span_name} is missing values: #{missing_values.join(', ')}"
    end
  end
end

Then('a span named {string} does not contain the attribute {string}') do |span_name, expected_attribute|
  spans = spans_from_request_list(Maze::Server.list_for('traces'))
  named_spans = spans.find_all { |span| span['name'].eql?(span_name) }
  raise Test::Unit::AssertionFailedError.new "No spans were found with the name #{span_name}" if named_spans.empty?

  named_spans.each do |span|    
    if span['attributes'].any? { |attribute| attribute['key'].eql?(expected_attribute) }
      raise Test::Unit::AssertionFailedError.new "Attribute #{expected_attribute} was present on span #{span_name}"
    end
  end
end

def get_attribute_value_from_span(span, attribute, attr_type)
  attributes = span['attributes']
  attribute = attributes.find { |a| a['key'] == attribute }
  value = attribute&.dig 'value', attr_type
  attr_type == 'intValue' && value.is_a?(String) ? value.to_i : value
end

Then("the span named {string} was delivered approximately {int} seconds after ending") do |span_name, expected_seconds|
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

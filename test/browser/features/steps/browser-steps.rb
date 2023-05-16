When("I navigate to the test URL {string}") do |test_path|
  path = $browser.url_for(test_path)
  step("I navigate to the URL \"#{path}\"")

  # store environment based on hostname
  driver = Maze.driver.instance_variable_get(:@driver)
  hostname = driver.execute_script("return window.location.hostname")
  url = driver.execute_script("return window.location.href")
  environment = hostname == "localhost" ? "development" : "production"
  Maze::Store.values["environment"] = environment
  Maze::Store.values["bugsnag.browser.page.url"] = url

  # store app version from package.json
  package = JSON.parse(File.read("./features/fixtures/node_modules/@bugsnag/js-performance-browser/package.json"))
  Maze::Store.values["telemetry.sdk.version"] = package["version"]
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
  expected_event_names = []
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
    expected_event_names,
    span_event_names,
    "The span's events do not match the expected events"
  )

  start_time = Integer(span["startTimeUnixNano"])
  end_time = Integer(span["endTimeUnixNano"])

  span["events"].each do |event|
    event_time = Integer(event["timeUnixNano"])

    Maze.check.operator(
      start_time,
      :<=,
      event_time,
      "The '#{event["name"]}' event happened before the span's start time (#{start_time - event_time}ns difference)"
    )

    Maze.check.operator(
      end_time,
      :>=,
      event_time,
      "The '#{event["name"]}' event happened after the span's end time (#{event_time - end_time}ns difference)"
    )
  end
end

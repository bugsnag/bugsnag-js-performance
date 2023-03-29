When("I navigate to the test URL {string}") do |test_path|
  path = $browser.url_for(test_path)
  step("I navigate to the URL \"#{path}\"")

  # store environment based on hostname
  driver = Maze.driver.instance_variable_get(:@driver)
  hostname = driver.execute_script("return window.location.hostname")
  environment = hostname == "localhost" ? "development" : "production"
  Maze::Store.values["environment"] = environment
end

When('I set the HTTP status code for the next {int} {string} requests to {int}') do |count, http_verb, status_code|
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

# Clicks a given element
# Requires a running Selenium driver
#
# @step_input element_id [String] The locator id
When('I click the DOM element {string}') do |element_id|
  Maze.driver.find_element(id: element_id).click
end

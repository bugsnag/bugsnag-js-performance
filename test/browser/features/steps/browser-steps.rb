When("I navigate to the test URL {string}") do |test_path|
  path = $browser.url_for(test_path)
  step("I navigate to the URL \"#{path}\"")

  # store environment based on hostname
  driver = Maze.driver.instance_variable_get(:@driver)
  hostname = driver.execute_script("return window.location.hostname")
  environment = hostname == "localhost" ? "development" : "production"
  Maze::Store.values["environment"] = environment

  # store app version from package.json
  package = JSON.parse(File.read("./features/fixtures/node_modules/@bugsnag/js-performance-browser/package.json"))
  Maze::Store.values["app_version"] = package["version"]
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

module Maze
  module Driver
    class Browser
      def wait_for_element(id)
        @driver.find_element(id: id)
      end
      def click_element(id)
        element = @driver.find_element(id: id)
        @driver.action.move_to(element).click.perform
      end
    end
  end
end

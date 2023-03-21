When("I navigate to the test URL {string}") do |test_path|
  path = $browser.url_for(test_path)
  step("I navigate to the URL \"#{path}\"")

  # store environment based on hostname
  driver = Maze.driver.instance_variable_get(:@driver)
  hostname = driver.execute_script("return window.location.hostname")
  environment = hostname == "localhost" ? "development" : "production"
  Maze::Store.values["environment"] = environment
end

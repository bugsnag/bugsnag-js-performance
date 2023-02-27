When('I navigate to the test URL {string}') do |test_path|
  path = $browser.url_for(test_path)
  step("I navigate to the URL \"#{path}\"")
end

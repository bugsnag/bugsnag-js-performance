Before('@skip') do
  skip_this_scenario("Skipping scenario")
end

Before ('@skip_on_device') do
  skip_this_scenario("Skipping scenario: Not suitable for mobile devices") if $browser.mobile?
end

Before ('@skip_firefox_60') do
  skip_this_scenario("Skipping scenario on Firefox 60") if Maze.config.browser == "firefox_60"
end

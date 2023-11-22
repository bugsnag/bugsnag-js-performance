Before('@skip') do
  skip_this_scenario("Skipping scenario")
end

Before('@skip_on_device') do
  skip_this_scenario("Skipping scenario: Not suitable for mobile devices") if $browser.mobile?
end

Before("@skip_on_cdn_build") do
  skip_this_scenario("Skipping scenario: Not suitable for CDN build") if $build_mode.cdn?
end

Before("@skip_on_npm_build") do
  skip_this_scenario("Skipping scenario: Not suitable for NPM build") if $build_mode.npm?
end

Before("@skip_chrome_61") do
  skip_this_scenario("Skipping scenario: Not supported") if Maze.config.browser == "chrome_61"
end

Before("@skip_firefox_60") do
  skip_this_scenario("Skipping scenario: Not supported") if Maze.config.browser == "firefox_60"
end

Before("@skip_safari_11") do
  skip_this_scenario("Skipping scenario: Not supported") if Maze.config.browser == "safari_11"
end
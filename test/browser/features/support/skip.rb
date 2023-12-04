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

["chrome", "firefox", "safari", "edge"].each do |browser|
  1.upto(1_000) do |version|
    Before("@skip_#{browser}_#{version}") do
      skip_this_scenario("Skipping scenario: Not supported") if Maze.config.browser == "#{browser}_#{version}"
    end
  end
end
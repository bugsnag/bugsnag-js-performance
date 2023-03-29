CHROMIUM_BROWSERS = Set['chrome', 'edge']

Before('@chromium_only') do
  if CHROMIUM_BROWSERS.none? { |browser| Maze.config.browser.start_with?(browser) }
    skip_this_scenario
  end
end

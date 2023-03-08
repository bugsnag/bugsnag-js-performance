CHROMIUM_BROWSERS = Set['chrome', 'edge'] 

Before('@chromium_only') do 
    unless CHROMIUM_BROWSERS.any? { |browser| Maze.config.browser.start_with?(browser) } 
        skip_this_scenario 
    end 
end

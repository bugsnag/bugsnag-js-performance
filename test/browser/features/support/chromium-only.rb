browsers = [
    # bitbar
    'chrome_108',
    'chrome_107',
    'chrome_106',
    'chrome_105',
    'chrome_104',
    'chrome_103',
    'chrome_72',
    'chrome_43',
    'edge_106',
    'edge_105',
    'edge_104',
    'edge_103',
    'edge_102',
    'edge_101',
    # browserstack
    'chrome_latest',
    'chrome_72',
    'chrome_61',
    'chrome_53',
    'chrome_43',
    'chrome_42',
    'chrome_40',
    'chrome_38',
    'chrome_36',
    'chrome_34',
    'chrome_32',
    'chrome_30',
    # local testing (chromedriver)
    'chrome'
]

Before('@chromium_only') do |_scenario|    
    skip_this_scenario unless browsers.include? Maze.config.browser
end

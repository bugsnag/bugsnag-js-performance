Maze.hooks.after do
  path = $browser.url_for("/")

  begin
    $logger.debug "Navigating to: #{path}"
    Maze.driver.navigate.to path
  rescue => exception
    $logger.error("#{exception.class} occurred during navigation attempt with message: #{exception.message}")
    $logger.error("Restarting driver and retrying navigation to: #{path}")
    Maze.driver.restart_driver
    Maze.driver.navigate.to path
    # If a further error occurs it will get thrown as normal
  end
end

Maze.hooks.after do
  url = $url_generator.for_path("/")

  begin
    $logger.debug "Navigating to: #{url}"
    Maze.driver.navigate.to(url)
  rescue => exception
    $logger.error("#{exception.class} occurred during navigation attempt with message: #{exception.message}")
    $logger.error("Restarting driver and retrying navigation to: #{url}")
    Maze.driver.restart_driver
    Maze.driver.navigate.to(url)
    # If a further error occurs it will get thrown as normal
  end

  driver = Maze.driver.instance_variable_get(:@driver)
  hostname = driver.execute_script("window.localStorage.clear()")
end

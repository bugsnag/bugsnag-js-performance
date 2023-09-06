When('I relaunch the app') do
    # Maze.driver.close_app
    Maze.driver.terminate_app Maze.driver.app_id
    # Maze.driver.launch_app
    Maze.driver.activate_app Maze.driver.app_id
end

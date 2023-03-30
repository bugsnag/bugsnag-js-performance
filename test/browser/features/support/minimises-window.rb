# if a test minimises the browser, we must maximise it afterwards, otherwise
# selenium can get confused
After('@minimises_window') do
  driver = Maze.driver.instance_variable_get(:@driver)
  driver.manage.window.maximize
end

After('not @skip_span_time_validation') do
  driver = Maze.driver.instance_variable_get(:@driver)
  current_time = driver.execute_script("return Date.now() * 1000000")
  scenario_start_time = driver.execute_script("return (performance.timeOrigin || performance.timing.navigationStart) * 1000000")
  
  spans = spans_from_request_list(Maze::Server.list_for('traces'))
  spans.each do |span|
    Maze.check.operator(Integer(span["startTimeUnixNano"]), :>=, scenario_start_time)
    Maze.check.operator(current_time, :>=, Integer(span["endTimeUnixNano"]))
  end
end
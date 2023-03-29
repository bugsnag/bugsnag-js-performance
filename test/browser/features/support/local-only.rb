Before('@local_only') do
  skip_this_scenario if Maze.config.farm != :local
end

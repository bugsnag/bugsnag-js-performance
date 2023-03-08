Before('@local_only') do |_scenario|    
    skip_this_scenario unless Maze.config.farm == :local
end

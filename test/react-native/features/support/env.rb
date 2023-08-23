BeforeAll do
  if Maze.config.farm == :bb
    Maze.config.android_app_files_directory = '/data/local/tmp'
  end
  Maze.config.enforce_bugsnag_integrity = false
end

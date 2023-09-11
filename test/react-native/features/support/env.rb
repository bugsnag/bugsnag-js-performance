BeforeAll do
  if Maze.config.farm == :bb
    Maze.config.android_app_files_directory = '/data/local/tmp'
  end
  Maze.config.enforce_bugsnag_integrity = false
end

Before('@skip_ios_old_arch') do |scenario|
  skip_this_scenario("Skipping scenario") if Maze::Helper.get_current_platform == 'ios' && !ENV["RCT_NEW_ARCH_ENABLED"]
end
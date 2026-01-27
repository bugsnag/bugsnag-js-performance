BeforeAll do
  if Maze.config.farm == :bb
    Maze.config.android_app_files_directory = '/data/local/tmp'
  end
  Maze.config.enforce_bugsnag_integrity = false

  if ENV["NATIVE_INTEGRATION"]
    Maze.config.receive_requests_wait = 60
  end

  if ENV["BENCHMARKS"]
    Maze.config.receive_requests_wait = 180
  end

end

Before('@skip') do
  skip_this_scenario("Skipping scenario")
end

Before('@skip_ios_old_arch') do |scenario|
  skip_this_scenario("Skipping scenario") if Maze::Helper.get_current_platform == 'ios' && !ENV["RCT_NEW_ARCH_ENABLED"]
end

Before('@skip_new_arch') do |scenario|
  skip_this_scenario("Skipping scenario: Not supported with new architecture") if ENV["RCT_NEW_ARCH_ENABLED"]
end

Before('@skip_old_arch') do |scenario|
  skip_this_scenario("Skipping scenario: Not supported with new architecture") unless ENV["RCT_NEW_ARCH_ENABLED"]
end

Before('@react_native_navigation') do |scenario|
  skip_this_scenario("Skipping scenario: Not running react-native-navigation fixture") unless ENV["REACT_NATIVE_NAVIGATION"]
end

Before('@skip_react_native_navigation') do |scenario|
  skip_this_scenario("Skipping scenario") if ENV["REACT_NATIVE_NAVIGATION"]
end

Before('@native_integration') do |scenario|
  skip_this_scenario("Skipping scenario: Not running native integration fixture") unless ENV["NATIVE_INTEGRATION"]
end

Before('@skip_expo') do |scenario|
  skip_this_scenario("Skipping scenario: Not supported in Expo") if ENV["EXPO_VERSION"]
end

Before('@expo') do |scenario|
  skip_this_scenario("Skipping scenario: Not running Expo fixture") unless ENV["EXPO_VERSION"]
end

Before('@ios_only') do |scenario|
  skip_this_scenario("Skipping scenario: Not running iOS fixture") unless Maze::Helper.get_current_platform == 'ios'
end

Before('@android_only') do |scenario|
  skip_this_scenario("Skipping scenario: Not running Android fixture") unless Maze::Helper.get_current_platform == 'android'
end

# native app start tests are skipped on RN 0.72 iOS due to absence of the RCTAppDelegate methods we override to set a custom root view controller
Before('@native_app_starts') do |scenario|
  current_version = ENV['RN_VERSION'].nil? ? 0 : ENV['RN_VERSION'].to_f
  skip_this_scenario("Skipping scenario: Not running native integration fixture") unless ENV["NATIVE_INTEGRATION"]
  skip_this_scenario("Skipping scenario: Not supported in 0.72") if Maze::Helper.get_current_platform == 'ios' && current_version == 0.72
end

Before('@benchmark') do |scenario|
  skip_this_scenario("Skipping scenario: Not running benchmark tests") unless ENV["BENCHMARKS"]
end

Before('@react_navigation') do |scenario|
  skip_this_scenario("Skipping scenario: Not running react-navigation fixture") unless ENV["REACT_NAVIGATION"] == 'true'
end
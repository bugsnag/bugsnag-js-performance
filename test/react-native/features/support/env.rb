# Helper method to safely evaluate truthy environment variables
def env_truthy?(key)
  val = ENV[key]
  !val.nil? && val != '' && val != 'false' && val != '0'
end

BeforeAll do
  if Maze.config.farm == :bb
    Maze.config.android_app_files_directory = '/data/local/tmp'
  end
  Maze.config.enforce_bugsnag_integrity = false

  if env_truthy?('NATIVE_INTEGRATION')
    Maze.config.receive_requests_wait = 60
  end

  if env_truthy?('BENCHMARKS')
    Maze.config.receive_requests_wait = 180
  end
end

Before do
  # Fallback for BitBar / Appium 2.x when Maze Runner cannot infer app_id from the artifact
  if Maze.driver && Maze.driver.respond_to?(:app_id=)
    current_app_id = Maze.driver.respond_to?(:app_id) ? Maze.driver.app_id : nil
    if current_app_id.nil? || current_app_id.empty?
      Maze.driver.app_id = 'com.bugsnag.fixtures.reactnative.performance'
    end
  end
end

Before('@skip') do
  skip_this_scenario('Skipping scenario')
end

Before('@skip_ios_old_arch') do |_scenario|
  skip_this_scenario('Skipping scenario: Not supported on iOS old architecture') if Maze::Helper.get_current_platform == 'ios' && !env_truthy?('RCT_NEW_ARCH_ENABLED')
end

Before('@skip_new_arch') do |_scenario|
  skip_this_scenario('Skipping scenario: Not supported with new architecture') if env_truthy?('RCT_NEW_ARCH_ENABLED')
end

Before('@skip_old_arch') do |_scenario|
  skip_this_scenario('Skipping scenario: Not supported with old architecture') unless env_truthy?('RCT_NEW_ARCH_ENABLED')
end

Before('@react_native_navigation') do |_scenario|
  skip_this_scenario('Skipping scenario: Not running react-native-navigation fixture') unless env_truthy?('REACT_NATIVE_NAVIGATION')
end

Before('@skip_react_native_navigation') do |_scenario|
  skip_this_scenario('Skipping scenario: Not supported with react-native-navigation') if env_truthy?('REACT_NATIVE_NAVIGATION')
end

Before('@native_integration') do |_scenario|
  skip_this_scenario('Skipping scenario: Not running native integration fixture') unless env_truthy?('NATIVE_INTEGRATION')
end

Before('@skip_expo') do |_scenario|
  skip_this_scenario('Skipping scenario: Not supported in Expo') if env_truthy?('EXPO_VERSION')
end

Before('@expo') do |_scenario|
  skip_this_scenario('Skipping scenario: Not running Expo fixture') unless env_truthy?('EXPO_VERSION')
end

Before('@ios_only') do |_scenario|
  skip_this_scenario('Skipping scenario: Not running iOS fixture') unless Maze::Helper.get_current_platform == 'ios'
end

Before('@android_only') do |_scenario|
  skip_this_scenario('Skipping scenario: Not running Android fixture') unless Maze::Helper.get_current_platform == 'android'
end

# Native app start tests are skipped on RN 0.72 iOS due to absence of the RCTAppDelegate methods overridden for custom root view controller
Before('@native_app_starts') do |_scenario|
  current_version = ENV['RN_VERSION'].nil? ? 0 : ENV['RN_VERSION'].to_f
  skip_this_scenario('Skipping scenario: Not running native integration fixture') unless env_truthy?('NATIVE_INTEGRATION')
  skip_this_scenario('Skipping scenario: Not supported in RN 0.72 iOS') if Maze::Helper.get_current_platform == 'ios' && current_version == 0.72
end

Before('@benchmark') do |_scenario|
  skip_this_scenario('Skipping scenario: Not running benchmark tests') unless env_truthy?('BENCHMARKS')
end

Before('@react_navigation') do |_scenario|
  skip_this_scenario('Skipping scenario: Not running react-navigation fixture') unless env_truthy?('REACT_NAVIGATION')
end
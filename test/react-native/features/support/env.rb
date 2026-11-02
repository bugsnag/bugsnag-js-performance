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

# Appium 2 launches the app when the session is created, before Maze Runner pushes
# fixture_config.json in its Before hook. With noReset, the app can read a stale
# config left on the device by a previous run and cache a dead Maze Runner address,
# so restart it once after the first config push
$app_restarted_after_config_push = false

Maze.hooks.before do
  next if $app_restarted_after_config_push || Maze.mode != :appium

  manager = Maze::Api::Appium::AppManager.new
  manager.terminate
  manager.activate
  $app_restarted_after_config_push = true
end

# Log the screen hierarchy when an Appium scenario fails, while the app is still in its
# failed state, so CI logs show what was on screen (e.g. for element lookup failures)
Maze.hooks.pre_complete do |scenario|
  next unless scenario.failed? && Maze.mode == :appium

  begin
    $logger.info "Page source at failure:\n#{Maze.driver.page_source}"
  rescue => error
    $logger.warn "Could not capture page source: #{error.message}"
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
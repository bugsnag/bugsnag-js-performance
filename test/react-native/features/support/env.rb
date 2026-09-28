FIXTURE_CONFIG_FILENAME = 'fixture_config.json'

# Where Maze Runner pushes fixture_config.json on Android devices in BitBar.
#
# Maze Runner's default is the app's own external files directory
# (/sdcard/Android/data/<app id>/files). On Android 15 devices that push is
# rejected by scoped storage - MediaProvider refuses to index the file and the
# fixture never sees it - so the fixture falls back to whatever is left in
# /data/local/tmp from an earlier session and polls a dead Maze Runner.
# /data/local/tmp can always be written with adb and is readable by the fixture
# on every Android version we test, so push there on every version instead.
ANDROID_FIXTURE_CONFIG_DIRECTORY = '/data/local/tmp'

# Runs a shell command on the Android device via Appium. This is best-effort:
# a failure is logged and swallowed so that it can never fail a test run.
# @return [Boolean] whether the command was run
def run_android_shell_command(command, args)
  return false unless Maze.mode == :appium && Maze::Helper.get_current_platform == 'android'
  return false if Maze.driver.nil? || Maze.driver.failed?
  return false if $android_shell_unavailable

  $logger.debug "Running on device: #{command} #{args.join(' ')}"
  Maze.driver.execute_script('mobile: shell', { command: command, args: args })
  true
rescue StandardError => e
  # Most likely the Appium server does not allow the adb_shell insecure feature.
  # Only warn once rather than on every scenario.
  $android_shell_unavailable = true
  $logger.warn "Unable to run '#{command} #{args.join(' ')}' on the device, skipping: #{e.message}"
  false
end

# Every location the fixture looks for its config file in on Android
def android_fixture_config_paths
  paths = ["#{ANDROID_FIXTURE_CONFIG_DIRECTORY}/#{FIXTURE_CONFIG_FILENAME}"]

  app_id = Maze.driver&.app_id
  paths << "/sdcard/Android/data/#{app_id}/files/#{FIXTURE_CONFIG_FILENAME}" unless app_id.nil?

  paths
end

# BitBar devices are shared between runs (and between projects) and
# /data/local/tmp is not cleared between sessions, so a fixture_config.json from
# an earlier session can be left behind pointing at a Maze Runner that no longer
# exists. Remove any leftover config before the first scenario pushes a fresh
# one. This runs once the Appium session exists but before the first scenario's
# push, so it can never delete the config for the current run.
Maze.hooks.before_all do
  if Maze.config.farm == :bb
    paths = android_fixture_config_paths
    $logger.info "Removing any stale fixture config from the device: #{paths.join(', ')}"
    run_android_shell_command('rm', ['-f'] + paths)
  end
end

# Maze Runner pushes the fixture config in its own Before hook, which runs just
# before this one. Make sure the file is readable by the fixture, which runs as
# an untrusted app rather than as the shell user that pushed it.
Maze.hooks.before do |_scenario|
  if Maze.config.farm == :bb
    run_android_shell_command('chmod', ['644', "#{ANDROID_FIXTURE_CONFIG_DIRECTORY}/#{FIXTURE_CONFIG_FILENAME}"])
  end
end

BeforeAll do
  if Maze.config.farm == :bb
    Maze.config.android_app_files_directory = ANDROID_FIXTURE_CONFIG_DIRECTORY
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
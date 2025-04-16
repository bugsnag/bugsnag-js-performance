BeforeAll do
  if Maze.config.farm == :bb
    Maze.config.android_app_files_directory = '/data/local/tmp'
  end
  Maze.config.enforce_bugsnag_integrity = false

  if ENV["NATIVE_INTEGRATION"]
    Maze.config.receive_requests_wait = 60
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

Before('@react_native_navigation') do |scenario|
  skip_this_scenario("Skipping scenario: Not running react-native-navigation fixture") unless ENV["REACT_NATIVE_NAVIGATION"]
end

Before('@skip_react_native_navigation') do |scenario|
  skip_this_scenario("Skipping scenario") if ENV["REACT_NATIVE_NAVIGATION"]
end

Before('@native_integration') do |scenario|
  skip_this_scenario("Skipping scenario: Not running native integration fixture") unless ENV["NATIVE_INTEGRATION"]
end

Before('@skip_android_old_arch_079') do |scenario|
  current_version = ENV['RN_VERSION'].nil? ? 0 : ENV['RN_VERSION'].to_f
  skip_this_scenario("Skipping scenario") if Maze::Helper.get_current_platform == 'android' && !ENV['RCT_NEW_ARCH_ENABLED'].eql?('1') && current_version == 0.79
end
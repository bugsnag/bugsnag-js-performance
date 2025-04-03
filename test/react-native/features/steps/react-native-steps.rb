When('I run {string}') do |scenario_name|
  execute_command 'run-scenario', scenario_name
end

When('I execute the command {string}') do |command|
  execute_command(command)
end

When('I clear all persistent data') do
  execute_command 'clear-all-persistent-data'
end

When('I navigate to {string}') do |screen|
  execute_command 'navigate', screen
end

Then('the trace payload field {string} string attribute {string} equals the platform-dependent string:') do |field, attribute, platform_values|
  expected_value = get_expected_platform_value(platform_values)
  if !expected_value.eql?('@skip')
    check_attribute_equal_with_nullability field, attribute, 'stringValue', expected_value
  end
end

Then('the {string} span has {word} attribute named {string}') do |span_name, attribute_type, attribute|
  spans = spans_from_request_list(Maze::Server.list_for('traces'))
  found_spans = spans.find_all { |span| span['name'].eql?(span_name) }
  raise Test::Unit::AssertionFailedError.new "No spans were found with the name #{span_name}" if found_spans.empty?
  raise Test::Unit::AssertionFailedError.new "found #{found_spans.size} spans named #{span_name}, expected exactly one" unless found_spans.size == 1

  attributes = found_spans.first['attributes']
  attribute = attributes.find { |a| a['key'] == attribute }

  value = attribute&.dig 'value', "#{attribute_type}Value"

  Maze.check.not_nil value
end

When("I relaunch the app after shutdown") do
  max_attempts = 20
  attempts = 0
  manager = Maze::Api::Appium::AppManager.new
  state = manager.state
  until (attempts >= max_attempts) || state == :not_running
    attempts += 1
    state = manager.state
    sleep 0.5
  end
  $logger.warn "App state #{state} instead of #{expected_state} after 10s" unless state == :not_running

  manager.activate
end

def execute_command(action, scenario_name = '')
  address = if Maze.config.farm == :bb
              if Maze.config.aws_public_ip
                Maze.public_address
              else
                'local:9339'
              end
            else
              case Maze::Helper.get_current_platform
                when 'android'
                  'localhost:9339'
                else
                  'bs-local.com:9339'
              end
            end

  command = {
    action: action,
    scenario_name: scenario_name,
    payload: scenario_name,
    endpoint: "http://#{address}/traces",
    api_key: $api_key,
  }

  $logger.debug("Queuing command: #{command}")
  Maze::Server.commands.add command
end

def get_expected_platform_value(platform_values)
  os = Maze::Helper.get_current_platform
  expected_value = Hash[platform_values.raw][os.downcase]
  raise("There is no expected value for the current platform \"#{os}\"") if expected_value.nil?

  expected_value
end

def get_attribute_value(field, attribute, attr_type)
  list = Maze::Server.list_for 'trace'
  attributes = Maze::Helper.read_key_path list.current[:body], "#{field}.attributes"
  attribute = attributes.find { |a| a['key'] == attribute }
  return nil if attribute.nil?

  value = attribute&.dig 'value', attr_type
  attr_type == 'intValue' && value.is_a?(String) ? value.to_i : value
end

def check_attribute_equal_with_nullability(field, attribute, attr_type, expected)
  actual = get_attribute_value field, attribute, attr_type

  case expected
  when '@null'
    Maze.check.nil(actual)
  when '@not_null'
    Maze.check.not_nil(actual)
  else
    Maze.check.equal(expected, actual)
  end
end

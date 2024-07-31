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

  # Ensure fixture has read the command
  count = 900
  sleep 0.1 until Maze::Server.commands.remaining.empty? || (count -= 1) < 1
  raise 'Test fixture did not GET /command' unless Maze::Server.commands.remaining.empty?
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

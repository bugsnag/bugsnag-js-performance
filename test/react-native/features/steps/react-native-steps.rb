def execute_command(action, scenario_name = '')

  address = if Maze.config.farm == :bb
              if Maze.config.aws_public_ip
                Maze.public_address
              else
                'local:9339'
              end
            else
              'bs-local.com:9339'
            end

  command = {
    action: action,
    scenario_name: scenario_name,
    endpoint: "http://#{address}/traces",
    api_key: $api_key,
  }
  Maze::Server.commands.add command

  # Ensure fixture has read the command
  count = 600
  sleep 0.1 until Maze::Server.commands.remaining.empty? || (count -= 1) < 1
  raise 'Test fixture did not GET /command' unless Maze::Server.commands.remaining.empty?
end

When('I run {string}') do |scenario_name|
  execute_command 'run_scenario', scenario_name
end
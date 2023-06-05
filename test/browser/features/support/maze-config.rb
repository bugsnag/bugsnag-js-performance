require_relative '../lib/browser'

# this can't be in a 'before all' hook because we need to set
# 'Maze.config.document_server_root' before Maze Runner's before all hook runs,
# otherwise the document server won't be started automatically

Maze.config.enforce_bugsnag_integrity = false

if Maze.config.aws_public_ip
  maze_address = Maze.public_address
  document_address = Maze.public_document_server_address
else
  host = ENV.fetch('HOST', 'localhost')
  maze_address = "#{host}:#{Maze.config.port}"
  document_address = "#{host}:#{Maze.config.document_server_port}"
end

Maze.config.document_server_root = File.realpath("#{__dir__}/../fixtures/packages")

$browser = Browser.new(
  Maze.config.browser,
  URI("http://#{maze_address}"),
  URI("http://#{document_address}")
)

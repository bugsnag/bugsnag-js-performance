require_relative '../lib/browser'

# this can't be in a 'before all' hook because we need to set
# 'Maze.config.document_server_root' before Maze Runner's before all hook runs,
# otherwise the document server won't be started automatically

Maze.config.enforce_bugsnag_integrity = false

Maze.config.bind_address = ENV.fetch('API_HOST', 'localhost')
Maze.config.document_server_bind_address = ENV.fetch('HOST', 'localhost')
Maze.config.document_server_root = File.realpath("#{__dir__}/../fixtures/packages")

$browser = Browser.new(
  Maze.config.browser,
  URI("http://#{Maze.config.bind_address}:#{Maze.config.port}"),
  URI("http://#{Maze.config.document_server_bind_address}:#{Maze.config.document_server_port}")
)

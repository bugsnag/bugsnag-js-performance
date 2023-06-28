require_relative '../lib/browser'
require_relative '../lib/url-generator'

$browser = Browser.new(Maze.config.browser)

Maze.hooks.before_all do
  Maze.config.document_server_root = File.realpath("#{__dir__}/../fixtures/packages")
  Maze.config.enforce_bugsnag_integrity = false
end

Maze.hooks.before do
  # Only needs running once, but the before_all hook gets invoked
  # before the public addresses are determined.
  if Maze.config.aws_public_ip
    maze_address = Maze.public_address
    document_address = Maze.public_document_server_address
  else
    host = ENV.fetch('HOST', 'localhost')
    maze_address = "#{host}:#{Maze.config.port}"
    document_address = "#{host}:#{Maze.config.document_server_port}"
  end

  $url_generator = UrlGenerator.new(
    URI("http://#{maze_address}"),
    URI("http://#{document_address}")
  )
end

require_relative '../lib/browser'
require_relative '../lib/build-mode'
require_relative '../lib/url-generator'

$build_mode = BuildMode.new
$browser = Browser.new(Maze.config.browser)

Maze.config.document_server_root = File.realpath("#{__dir__}/../fixtures/packages")
Maze.config.enforce_bugsnag_integrity = false

def get_test_url()
  if Maze.config.aws_public_ip
    maze_address = Maze.public_address
  else
    host = ENV.fetch('HOST', 'localhost')
    maze_address = "#{host}:9339"
  end

  protocol = Maze.config.https ? 'https' : 'http'

  UrlGenerator.new(
    URI("#{protocol}://#{maze_address}"),
    URI("#{protocol}://#{maze_address}")
  )
end

Maze.hooks.before_all do
  $logger.info("Running in #{$build_mode.mode_name} mode")
end

Maze.hooks.before do
  # Only needs running once, but the before_all hook gets invoked
  # before the public addresses are determined.
  $url_generator = get_test_url()
end

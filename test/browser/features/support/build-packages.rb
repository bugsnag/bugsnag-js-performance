# set the SKIP_BUILD_PACKAGES environment variable to disable building
return if ENV.key?("SKIP_BUILD_PACKAGES")

require 'open3'
require 'logger'

# this file is run by Maze Runner automatically (where $logger is defined) and
# by the browser dockerfile when building for CI (where $logger is NOT defined)
$logger = Logger.new(STDOUT) unless $logger

ROOT = "#{__dir__}/../../../.."
FIXTURES_DIRECTORY = "#{__dir__}/../fixtures"

PACKAGE_NAMES = [
  "@bugsnag/js-performance-core",
  "@bugsnag/browser-performance",
]

PACKAGE_DIRECTORIES = [
  "#{ROOT}/packages/core",
  "#{ROOT}/packages/platforms/browser",
]

def run(command)
  $logger.info("Running '#{command}'")

  status = Open3.popen3(command) do |stdin, stdout, stderr, wait_thread|
    stdin.close

    stdout_reader = Thread.new do
      stdout.each_line do |line|
        $logger.debug(line.chomp)
      end
    end

    stderr_reader = Thread.new do
      stderr.each_line do |line|
        $logger.debug(line.chomp)
      end
    end

    wait_thread.value
  end

  if status.success?
    $logger.info("Success!")
  else
    $logger.error("Command failed!")

    exit status.exitstatus
  end
end

begin
  Dir.chdir(ROOT) do
    run("ENABLE_TEST_CONFIGURATION=1 npm run build -- --scope #{PACKAGE_NAMES.join(" --scope ")}")

    PACKAGE_DIRECTORIES.each do |package|
      run("npm pack #{package} --pack-destination #{FIXTURES_DIRECTORY}")
    end
  end

  Dir.chdir(FIXTURES_DIRECTORY) do
    run("npm install --no-package-lock --no-save *.tgz")
    run("npm run build --workspaces")
  end
ensure
  run("rm -f #{FIXTURES_DIRECTORY}/*.tgz")
end

# this at_exit is after the above commands on purpose - if they fail then we
# DON'T want these cleanup commands to run so it's easier to debug
unless ENV.key?("SKIP_FIXTURE_CLEANUP") || ENV.key?("DEBUG")
  at_exit do
    Dir.chdir(FIXTURES_DIRECTORY) do
      run("rm -rf node_modules")
      run("npm run clean --workspaces")
    end
  end
end

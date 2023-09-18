def environment_variable_enabled?(name)
  value = ENV[name]

  value == "1" || value == "true"
end

# set the SKIP_BUILD_PACKAGES environment variable to disable building
return if environment_variable_enabled?("SKIP_BUILD_PACKAGES")

require "json"
require "open3"
require "logger"

# this file is run by Maze Runner automatically (where $logger is defined) and
# by the browser dockerfile when building for CI (where $logger is NOT defined)
$logger ||= Logger.new(STDOUT)

ROOT = "#{__dir__}/../../../.."
FIXTURES_DIRECTORY = "#{__dir__}/../fixtures"
BUILD_MODE = environment_variable_enabled?("USE_CDN_BUILD") ? :cdn : :npm

$logger.info("Building in #{BUILD_MODE} mode")

PACKAGE_NAMES = [
  "@bugsnag/core-performance",
  "@bugsnag/browser-performance",
  "@bugsnag/react-router-performance",
  "@bugsnag/vue-router-performance",
]

PACKAGE_DIRECTORIES = [
  "#{ROOT}/packages/core",
  "#{ROOT}/packages/platforms/browser",
  "#{ROOT}/packages/react-router",
  "#{ROOT}/packages/vue-router",
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

    if BUILD_MODE == :npm
      # in NPM mode pack each package into the fixture directory
      PACKAGE_DIRECTORIES.each do |package|
        run("npm pack #{package} --pack-destination #{FIXTURES_DIRECTORY}")
      end
    else
      # in CDN mode copy the bundles & sourcemaps (for debugging) into the
      # fixture directory
      run("cp build/bugsnag-performance*.js* #{FIXTURES_DIRECTORY}/packages/")
    end
  end

  Dir.chdir(FIXTURES_DIRECTORY) do
    # backup the package json so we can undo the changes we're about to make
    run("cp package.json package.json.backup")

    install_command = "npm install --no-package-lock"
    build_command = "npm run build --workspaces"

    if BUILD_MODE == :npm
      # in NPM mode we need to also install the tarballs from 'npm pack'
      install_command += " *.tgz"
    else
      # in CDN mode we need to tell the JS build to also use CDN mode
      build_command = "USE_CDN_BUILD=1 " + build_command
    end

    run(install_command)
    run(build_command)

    # store the browser package version in a file for the cucumber steps to use
    package = JSON.parse(File.read("#{ROOT}/packages/platforms/browser/package.json"))
    bugsnag_browser_version = package["version"]

    File.open(".bugsnag-browser-version", "w") do |file|
      file.write(bugsnag_browser_version)
    end
  end
ensure
  run("rm -f #{FIXTURES_DIRECTORY}/*.tgz")
  run("mv #{FIXTURES_DIRECTORY}/package.json.backup #{FIXTURES_DIRECTORY}/package.json")
end

# this at_exit is after the above commands on purpose - if they fail then we
# DON'T want these cleanup commands to run so it's easier to debug
unless environment_variable_enabled?("SKIP_FIXTURE_CLEANUP") || environment_variable_enabled?("DEBUG")
  at_exit do
    Dir.chdir(FIXTURES_DIRECTORY) do
      run("rm -f #{FIXTURES_DIRECTORY}/packages/bugsnag-performance*.js*")
      run("rm -rf node_modules")
      run("npm run clean --workspaces")
    end
  end
end

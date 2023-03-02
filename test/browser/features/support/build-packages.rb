# set the SKIP_BUILD_PACKAGES environment variable to disable building
return if ENV.key?("SKIP_BUILD_PACKAGES")

require 'open3'
require 'logger'

$logger = Logger.new(STDOUT) unless $logger

ROOT = "#{__dir__}/../../../.."
FIXTURES_DIRECTORY = "#{__dir__}/../fixtures"

PACKAGE_NAMES = [
  "@bugsnag/js-performance-core",
  "@bugsnag/js-performance-browser",
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
    run("npm run build -- --scope #{PACKAGE_NAMES.join(" --scope ")}")

    PACKAGE_DIRECTORIES.each do |package|
      run("npm pack #{package} --pack-destination #{FIXTURES_DIRECTORY}")
    end
  end

  Dir.chdir(FIXTURES_DIRECTORY) do
    run("rm -rf node_modules")
    run("npm install --no-package-lock --no-save *.tgz")
  end
ensure
  run("rm -f #{FIXTURES_DIRECTORY}/*.tgz")
end

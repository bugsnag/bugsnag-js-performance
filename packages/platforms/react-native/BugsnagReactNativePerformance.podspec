require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name            = "BugsnagReactNativePerformance"
  s.version         = package["version"]
  s.summary         = package["description"]
  s.description     = package["description"]
  s.homepage        = package["homepage"]
  s.license         = package["license"]
  s.platforms       = { :ios => "10.0" }
  s.author          = { "Bugsnag" => "platforms@bugsnag.com" }
  s.source          = { :git => "https://github.com/bugsnag/bugsnag-js-performance.git", :tag => "v#{s.version}" }

  s.source_files    = "ios/**/*.{h,m,mm,swift}"

  # Copies of BugsnagPerformance headers, and a header that imports them, used only by this pod.
  # As public headers of a framework (use_frameworks!) they clash with the real BugsnagPerformance
  # module.
  s.private_header_files = [
    "ios/BugsnagPerformanceConfiguration.h",
    "ios/BugsnagPerformanceSpan.h",
    "ios/BugsnagPerformanceSpanContext.h",
    "ios/BugsnagPerformanceSpanOptions.h",
    "ios/BugsnagReactNativePerformanceCrossTalkAPIClient.h",
  ]

  # install_modules_dependencies is provided by React Native 0.71+ and adds the correct
  # dependencies and compiler flags for both the old and new architecture. RN 0.82+ is
  # new-architecture only, so we must not rely on apps setting RCT_NEW_ARCH_ENABLED.
  if respond_to?(:install_modules_dependencies, true)
    install_modules_dependencies(s)
  else
    s.dependency "React-Core"
  end
end
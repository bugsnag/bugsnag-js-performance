require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name            = "BugsnagNativeSpans"
  s.version         = package["version"]
  s.summary         = package["description"]
  s.description     = package["description"]
  s.homepage        = package["homepage"]
  s.license         = package["license"]
  s.platforms       = { :ios => "10.0" }
  s.author          = { "Bugsnag" => "platforms@bugsnag.com" }
  s.source          = { :git => "https://github.com/bugsnag/bugsnag-js-performance.git", :tag => "v#{s.version}" }

  s.source_files    = "ios/**/*.{h,m,mm,swift}"

  # 1.14.0 added the span control and plugin APIs used by this plugin. The upper bound makes
  # CocoaPods report a clear version conflict, rather than a build error, if a BugsnagPerformance
  # major version is incompatible.
  #
  # BUGSNAG_PERFORMANCE_SPM=1 takes BugsnagPerformance from its Swift package instead, using React
  # Native's spm_dependency helper. The app must not also depend on the BugsnagPerformance pod,
  # directly or through another pod such as BugsnagPerformanceSwift, or it is linked twice.
  use_spm = ENV["BUGSNAG_PERFORMANCE_SPM"] == "1"
  if use_spm && defined?(spm_dependency)
    spm_dependency(s,
      url: "https://github.com/bugsnag/bugsnag-cocoa-performance.git",
      requirement: { kind: "versionRange", minimumVersion: "1.14.0", maximumVersion: "6.0.0" },
      products: ["BugsnagPerformance"])
  else
    Pod::UI.warn "BUGSNAG_PERFORMANCE_SPM is ignored because this version of React Native does not " \
      "support spm_dependency. BugsnagNativeSpans uses the BugsnagPerformance pod." if use_spm
    s.dependency 'BugsnagPerformance', '>= 1.14.0', '< 6.0'
  end
  s.dependency 'BugsnagReactNativePerformance'

  if ENV["RCT_NEW_ARCH_ENABLED"] == "1"
    install_modules_dependencies(s)
  else
    s.dependency "React-Core"
  end
end

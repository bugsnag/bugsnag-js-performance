Pod::Spec.new do |spec|
  spec.name         = "BugsnagTestUtils"
  spec.version      = "1.0.0"
  spec.summary      = "Native test utilities for React Native Performance test fixtures"
  spec.description  = "Native test utilities for React Native Performance test fixtures"

  spec.homepage     = "https://github.com/bugsnag/bugsnag-js-performance"
  spec.license      = { :type => "MIT" }
  spec.author       = { "Bugsnag" => "support@bugsnag.com" }

  spec.platform     = :ios, "15.1"
  spec.source       = { :git => "https://github.com/bugsnag/bugsnag-js-performance.git", :tag => "#{spec.version}" }

  spec.source_files = "*.{h,m,mm}"
  spec.public_header_files = "*.h"

  spec.pod_target_xcconfig = {
    "DEFINES_MODULE" => "YES",
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++20",
    "CLANG_CXX_LIBRARY" => "libc++",
    "CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES" => "YES",
    "HEADER_SEARCH_PATHS" => '$(inherited) "${PODS_TARGET_SRCROOT}/../../../../packages/react-native-performance/ios/**"'
  }

  if ENV["NATIVE_INTEGRATION"] == "1"
    spec.compiler_flags = "-DNATIVE_INTEGRATION=1"
    spec.dependency "BugsnagPerformance"
  end
end
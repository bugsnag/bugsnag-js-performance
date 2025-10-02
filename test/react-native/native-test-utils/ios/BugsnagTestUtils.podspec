Pod::Spec.new do |spec|
  spec.name         = "BugsnagTestUtils"
  spec.version      = "1.0.0"
  spec.summary      = "Native test utilities for React Native Performance test fixtures"
  spec.description  = "Native test utilities for React Native Performance test fixtures"

  spec.homepage     = "https://github.com/bugsnag/bugsnag-js-performance"
  spec.license      = { :type => "MIT", :file => "LICENSE" }
  spec.author       = { "Bugsnag" => "support@bugsnag.com" }

  spec.platform     = :ios, "12.0"
  spec.source       = { :git => "https://github.com/bugsnag/bugsnag-js-performance.git", :tag => "#{spec.version}" }

  spec.source_files = "*.{h,m,mm}"
  spec.public_header_files = "*.h"

  spec.pod_target_xcconfig = {
    "DEFINES_MODULE" => "YES"
  }

  if ENV["NATIVE_INTEGRATION"] == "1"
    spec.compiler_flags = "$(inherited)", "-DNATIVE_INTEGRATION=1"
  end
end


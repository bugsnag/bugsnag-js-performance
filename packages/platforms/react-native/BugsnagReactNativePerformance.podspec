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

  if ENV["RCT_NEW_ARCH_ENABLED"] == "1"
    install_modules_dependencies(s)
  else
    s.dependency "React-Core"
  end
end
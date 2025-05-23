require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name            = "ScenarioLauncher"
  s.version         = package["version"]
  s.summary         = package["description"]
  s.description     = package["description"]
  s.homepage        = "https://github.com/bugsnag/"
  s.license         = package["license"]
  s.platforms       = { :ios => "11.0" }
  s.author          = package["author"]
  s.source          = { :git => package["repository"], :tag => "#{s.version}" }

  s.source_files    = "ios/**/*.{h,m,mm}"
  s.dependency "BugsnagReactNative"
  
  if ENV["RCT_NEW_ARCH_ENABLED"] == "1"
    install_modules_dependencies(s)
  else
    s.dependency "React-Core"
  end

  if ENV["NATIVE_INTEGRATION"] == "1"
    s.compiler_flags = "$(inherited)", "-DNATIVE_INTEGRATION=1"
  end
end

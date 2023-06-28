Before("@requires_performance_navigation_timing") do
  skip_this_scenario unless $browser.supports_performance_navigation_timing?
end

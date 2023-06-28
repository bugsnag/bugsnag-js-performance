Before("@requires_performance_body_size") do
    skip_this_scenario unless $browser.supports_performance_body_size?
end
  
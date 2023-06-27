Before("@requires_performance_response_status") do
    skip_this_scenario unless $browser.supports_performance_response_status?
end
  
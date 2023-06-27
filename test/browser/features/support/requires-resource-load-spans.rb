Before("@requires_resource_load_spans") do
    skip_this_scenario unless $browser.supports_resource_load_spans?
  end
  
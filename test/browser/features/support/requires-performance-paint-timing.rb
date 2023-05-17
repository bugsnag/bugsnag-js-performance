Before("@requires_performance_paint_timing") do
    skip_this_scenario unless $browser.supports_performance_paint_timing?
end

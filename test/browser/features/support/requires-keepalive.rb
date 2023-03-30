Before("@requires_fetch_keepalive") do
  skip_this_scenario unless $browser.supports_fetch_keepalive?
end

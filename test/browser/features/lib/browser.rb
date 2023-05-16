require 'yaml'

class Browser
  def initialize(browser_spec, maze_uri, fixtures_uri)
    @maze_uri = maze_uri
    @fixtures_uri = fixtures_uri

    # e.g. "chrome_61", "edge_latest", "chrome"
    @name, version = browser_spec.split("_")

    # assume we're running the latest version if there is no version present
    # this should only happen locally where the browser will auto-update
    @version =
      if version.nil? || version == "latest"
        "latest"
      else
        Integer(version)
      end
  end

  def url_for(path)
    uri = URI.join(@fixtures_uri, path)
    config_query_string = "endpoint=#{@maze_uri}/traces&logs=#{@maze_uri}/logs&api_key=#{$api_key}"

    if uri.query
      uri.query += "&#{config_query_string}"
    else
      uri.query = config_query_string
    end

    uri.to_s
  end

  def supports_fetch_keepalive?
    case @name
    when "safari"
      # support added in Safari 13
      @version == "latest" || @version >= 13

    when "firefox"
      # firefox does not support keepalive on any version
      false

    when "chrome"
      # support added in Chrome 66
      @version == "latest" || @version >= 66

    when "edge"
      # support added in Edge 15
      @version == "latest" || @version >= 15

    else
      raise "Unable to determine fetch keepalive support for browser: #{@name}"
    end
  end

  def supports_performance_paint_timing?
    case @name
    when "chrome"
      # support added in Chrome 66
      @version == "latest" || @version >= 60
      
    when "edge"
      # support added in Edge 79
      @version == "latest" || @version >= 79
      
    when "firefox"
      # support added in Firefox 84
      @version == "latest" || @version >= 84

    when "safari"
      # support added in Safari 14.1
      @version == "latest" || @version >= 14.1

    else
      raise "Unable to determine PerformancePaintTiming support for browser: #{@name}"
    end
  end
end

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
        Float::INFINITY
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
      @version >= 13

    when "firefox"
      # firefox does not support keepalive on any version
      false

    when "chrome"
      # support added in Chrome 66
      @version >= 66

    when "edge"
      # support added in Edge 15
      @version >= 15

    else
      raise "Unable to determine fetch keepalive support for browser: #{@name}"
    end
  end

  def supported_web_vitals
    case @name
    when "chrome"
      chrome_supported_vitals
    when "edge"
      edge_supported_vitals
    when "firefox"
      firefox_supported_vitals
    when "safari"
      safari_supported_vitals
    else
      raise "Unable to determine web vitals support for browser: #{@name}"
    end
  end

  private

  def chrome_supported_vitals
    case @version
    when (77..)
      ["ttfb", "fcp"] # also ["fid", "lcp", "cls"]
    when (76..)
      ["ttfb", "fcp"] # also ["fid"]
    when (64..)
      ["ttfb", "fcp"]
    else 
      ["ttfb"]
    end
  end

  def edge_supported_vitals
    case @version
    when (79..)
      ["ttfb", "fcp"] # also ["fid", "lcp", "cls"]
    else 
      ["ttfb"]
    end
  end

  def firefox_supported_vitals
    case @version
    when (84..)
      ["ttfb", "fcp"] # also ["fid", "lcp", "cls"]
    else
      ["ttfb"]
    end
  end

  def safari_supported_vitals
    case @version
    when (14..) # technically 14.1, but our test fixtures never use 14.0
      ["ttfb", "fcp"] # also ["fid", "lcp", "cls"]
    else
      ["ttfb"]
    end
  end
end

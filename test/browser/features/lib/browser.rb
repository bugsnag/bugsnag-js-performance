require 'yaml'

class Browser
  def initialize(browser_spec)
    # e.g. "chrome_61", "edge_latest", "chrome"
    @name, version = browser_spec.split("_")

    # assume we're running the latest version if there is no version present
    # this should only happen locally where the browser will auto-update
    @version =
      if @name == "android" || version.nil? || version == "latest"
        Float::INFINITY
      else
        Integer(version)
      end
  end

  def name
    @name
  end

  def version
    @version
  end

  # is this a mobile device?
  # we assume that android devices are always using the latest version of chrome
  def mobile?
    @name == "android" || @name == "ios" || @name == "iphone"
  end

  def supports_fetch_keepalive?
    case @name
    when "safari"
      # support added in Safari 13
      @version >= 13

    when "firefox", "android", "ios", "iphone"
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
    when "android"
      chrome_supported_vitals
    when "ios"
      safari_supported_vitals
    else
      raise "Unable to determine web vitals support for browser: #{@name}"
    end
  end

  # | browser | version |
  # | chrome  | 54      |
  # | firefox | 45      |
  # | edge    | 17      |
  # | safari  | 16.4    |
  def supports_performance_encoded_body_size?
    case @name
    when "safari"
      @version >= 17 # we test on 16.3 - not sure what to do here?
    else 
      true
    end
  end

  def supports_performance_response_status?
    case @name
    when "chrome", "edge"
      @version >= 109
    else
      false
    end
  end

  def supports_resource_load_spans?
    case @name
    when "chrome"
      @version >= 73
    when "safari", "ios"
      @version >= 13
    when "firefox"
      @version >= 67
    else
      false
    end
  end

  def supports_performance_navigation_timing?
    case @name
    when "safari", "ios"
      # support added in Safari 15 (technically 15.1 for mobile)
      @version >= 15

    else
      true
    end
  end

  private

  def chrome_supported_vitals
    case @version
    when (77..)
      ["ttfb", "fcp", "fid_start", "fid_end", "lcp", "cls"]
    when (76..)
      ["ttfb", "fcp", "fid_start", "fid_end"]
    when (64..)
      ["ttfb", "fcp"]
    else 
      ["ttfb"]
    end
  end

  def edge_supported_vitals
    case @version
    when (79..)
      ["ttfb", "fcp", "fid_start", "fid_end", "lcp", "cls"]
    else 
      ["ttfb"]
    end
  end

  def firefox_supported_vitals
    case @version
    when (89..)
      ["ttfb", "fcp", "fid_start", "fid_end"]
    when (84..)
      ["ttfb", "fcp", "cls"]
    else
      ["ttfb"]
    end
  end

  def safari_supported_vitals
    case @version
    when (14..) # technically 14.1, but our test fixtures never use 14.0
      ["ttfb", "fcp"]
    else
      ["ttfb"]
    end
  end
end

class BuildMode
  def initialize
    if File.exist?("#{__dir__}/../fixtures/packages/bugsnag-performance.js")
      @mode = :cdn
    else
      @mode = :npm
    end
  end

  def mode_name
    @mode.to_s.upcase
  end

  def cdn?
    @mode == :cdn
  end

  def npm?
    @mode == :npm
  end
end

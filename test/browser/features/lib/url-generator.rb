class UrlGenerator
  def initialize(maze_uri, fixtures_uri)
    @maze_uri = maze_uri
    @fixtures_uri = fixtures_uri
  end

  def for_path(path)
    uri = URI.join(@fixtures_uri, path)
    config_query_string = "endpoint=#{@maze_uri}/traces&logs=#{@maze_uri}/logs&api_key=#{$api_key}&notify=#{@maze_uri}/notify&sessions=#{@maze_uri}/sessions"

    if uri.query
      uri.query += "&#{config_query_string}"
    else
      uri.query = config_query_string
    end

    uri.to_s
  end
end

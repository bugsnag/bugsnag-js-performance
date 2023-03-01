require 'yaml'

class Browser
  def initialize(maze_uri, fixtures_uri)
    @maze_uri = maze_uri
    @fixtures_uri = fixtures_uri
  end

  def url_for(path)
    uri = URI.join(@fixtures_uri, path)
    config_query_string = "ENDPOINT=#{@maze_uri}/traces&LOGS=#{@maze_uri}/logs&API_KEY=#{$api_key}"

    if uri.query
      uri.query += "&#{config_query_string}"
    else
      uri.query = config_query_string
    end

    uri.to_s
  end
end

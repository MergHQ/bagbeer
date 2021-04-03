defmodule Agro do
  use HTTPoison.Base

  def process_request_url(resource) do
    polyid = System.get_env "POLY_ID"
    appid = System.get_env "AGRO_API_TOKEN"
    "https://api.agromonitoring.com/agro/1.0/" <> resource <> "?polyid=" <> polyid <> "&appid=" <> appid
  end

  def process_response_body(body) do
    Jason.decode!(body)
  end
end

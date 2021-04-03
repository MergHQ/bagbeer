defmodule DarkSky do
  use HTTPoison.Base

  def process_request_url(_url) do
    darksky = System.get_env "DARKSKY_TOKEN"
    hki = "60.169940,24.938679"
    "https://api.darksky.net/forecast/" <> darksky <> "/" <> hki <> "?units=si"
  end

  def process_response_body(body) do
    Jason.decode!(body)
  end
end

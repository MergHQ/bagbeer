defmodule BagbeerStatusService do
  def get_soil_data() do
    IO.puts("getting soil data")
    %HTTPoison.Response{ body: body } = Agro.get!("soil")
    %{dt: body["dt"] * 1000, moisture: body["moisture"]}
  end

  def get_wind_speed() do
    %HTTPoison.Response{ body: body } = Agro.get!("weather")
    body["wind"]["speed"]
  end

  def get_darksky_temp() do
    %HTTPoison.Response{ body: body } = DarkSky.get!("")
    {:ok, t} = DateTime.from_unix(body["currently"]["time"] * 1000, :millisecond)
    %{updated: t, temp: body["currently"]["temperature"]}
  end

  @spec resolve_status(number, number, any) :: any
  def resolve_status(soil_moisture, wind, temp) do
    scale = ["great", "good", "average", "bad"]
    moisture_limit = 0.25
    wind_limit = 17.1
    moisture_factor_mult = 1.5

    moisture_factor = (soil_moisture / (moisture_limit / 2)) * moisture_factor_mult
    wind_factor = wind / (wind_limit / 2)
    temperature_factor = case temp do
      n when n < 5 -> 3
      n when n < 10 -> 2
      n when n < 15 -> 1.5
      n when n < 20 -> 1
      n when n < 25 -> 0
    end

    factor = round((moisture_factor + wind_factor + temperature_factor) - 1)
    Enum.at(scale, min(factor, length(scale) - 1))
  end

  def get_status() do
    soil_data = get_soil_data()
    wind_speed = get_wind_speed()
    temperature_data = get_darksky_temp()
    %{
      updated: temperature_data.updated,
      status: resolve_status(soil_data.moisture, wind_speed, temperature_data.temp),
      details: %{
        windSpeed: wind_speed,
        moisture: soil_data.moisture,
        temp: temperature_data.temp,
        groundMoistureUpdated: soil_data.dt
      }
    }
  end

  def get_status_async() do
    {:ok, cached} = Cachex.get(:status_cache, "status")
    case cached do
      nil ->
        status = get_status()
        Cachex.put(:status_cache, "status", status)
        Cachex.expire!(:status_cache, "status", :timer.minutes(15))
        Task.async(fn -> status end)
      cached_value ->
        Task.async(fn -> cached_value end)
    end
  end
end

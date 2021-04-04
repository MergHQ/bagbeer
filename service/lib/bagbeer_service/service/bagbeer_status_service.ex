defmodule BagbeerStatusService do
  defp get_soil_data() do
    %HTTPoison.Response{ body: body } = Agro.get!("soil")
    body
    |> Map.take(["dt", "moisture"])
    |> map_keys_to_atom
    |> Map.update!(:dt, &(&1 * 1000)) # convert to milliseconds
  end

  defp get_wind_speed() do
    %HTTPoison.Response{ body: body } = Agro.get!("weather")
    body
    |> Map.get("wind")
    |> Map.get("speed")
  end

  defp get_darksky_temp() do
    %HTTPoison.Response{ body: body } = DarkSky.get!("")

    {:ok, updated_ts} = body
    |> Map.get("currently")
    |> Map.get("time")
    |> DateTime.from_unix(:second)

    temperature = body
    |> Map.get("currently")
    |> Map.get("temperature")

    %{updated: updated_ts, temp: temperature}
  end

  defp resolve_status(soil_moisture, wind, temp) do
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

  def get_status_async(), do: Task.async(fn ->
    {:ok, cached} = Cachex.get(:status_cache, "status")
    case cached do
      nil ->
        status = get_status()
        Cachex.put(:status_cache, "status", status)
        Cachex.expire!(:status_cache, "status", :timer.minutes(15))
        status
      cached_value -> cached_value
    end
  end)

  defp map_keys_to_atom(map), do: map |> Map.new(fn {k, v} -> {String.to_atom(k), v} end)
end

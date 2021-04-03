defmodule BagbeerService.Application do
  use Application

  def application do
    [applications: [:cachex]]
  end

  @impl true
  def start(_type, _args) do
    {port, _binary} = System.get_env("PORT")
      |> Integer.parse

    children = [
      {Plug.Cowboy, scheme: :http, plug: AppRouter, options: [port: port]},
      {Cachex, name: :status_cache}
    ]

    IO.puts("Starting server on port " <> Integer.to_string(port))

    opts = [strategy: :one_for_one, name: BagbeerService.Supervisor]
    Supervisor.start_link(children, opts)
  end
end

defmodule AppRouter do
  use Plug.Router

  plug :match
  plug :dispatch

  get "/status" do
    status_task = BagbeerStatusService.get_status_async
    result = Jason.encode! Task.await(status_task)
    conn
    |> append_cors
    |> send_resp(200, result)
  end

  match _ do
    send_resp(conn, 404, "Not found")
  end

  def append_cors(conn), do: put_resp_header(conn, "Access-Control-Allow-Origin", "*")
end

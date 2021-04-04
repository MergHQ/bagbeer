FROM arm64v8/elixir:1.11.2-slim

WORKDIR /app
COPY . /app
ENV MIX_ENV=prod
RUN mix local.hex --force
RUN mix local.rebar --force
RUN mix deps.get
RUN mix release

CMD ["mix", "run", "--no-halt"]

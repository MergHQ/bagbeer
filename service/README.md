# Bagbeer service

### Installation

1. Install [deno](https://deno.land).
2. Run this with the correct credentials (PORT is optional and defaults to 3000):
```
export POLY_ID= // Polygon ID configured in agromonitoring
export AGRO_API_TOKEN= // API token from agromonitoring
```
2. Run `deno run --allow-net --allow-env ./src/app.ts`
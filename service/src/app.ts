import { Application } from 'https://deno.land/x/abc/mod.ts'
import { logger } from 'https://deno.land/x/abc/middleware/logger.ts'
import { cors } from 'https://deno.land/x/abc/middleware/cors.ts'
import maybe from 'https://raw.githubusercontent.com/MergHQ/denofun/maybe-get-or-else/lib/maybe.ts'
import { fetchCurrentData } from './service/agro.ts'
import { fetchCached } from './service/darksky.ts'
import resolveStatus from './resolvers/statusResolver.ts'

if (!Deno.env.get('POLY_ID') || !Deno.env.get('AGRO_API_TOKEN') || !Deno.env.get('DARKSKY_TOKEN')) {
  console.error('Missing env vars.')
  Deno.exit(1)
}

const app = new Application()

app
  .use(logger())
  .use(cors())
  .get('/api/status', ctx =>
    Promise.all([fetchCurrentData(), fetchCached()])
      .then(([{ updated, details }, { temp, updated: tempUpdated }]) => ({
        updated: tempUpdated,
        status: resolveStatus(details.groundMoisture, details.windSpeed, temp),
        details: {
          ...details,
          temp,
          groundMoistureUpdated: updated
        }
       }))
      .then(status => ctx.json(status))
      .catch(e => ctx.json(e, e.status)))
  .get('/health', ctx => ctx.json({ ok: true }))
  .start({
    port: maybe(Deno.env.get('PORT'))
      .map(Number)
      .getOrElse(3000)
  })

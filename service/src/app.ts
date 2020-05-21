import { Application } from 'https://deno.land/x/abc/mod.ts'
import { logger } from 'https://deno.land/x/abc/middleware/logger.ts'
import { CORSConfig, cors } from 'https://deno.land/x/abc/middleware/cors.ts'
import maybe from 'https://raw.githubusercontent.com/MergHQ/denofun/maybe-get-or-else/lib/maybe.ts'
import { fetchCurrentStatus } from './service/agro.ts'

const app = new Application()

app
  .use(logger())
  .use(cors())
  .get('/api/status', ctx =>
    fetchCurrentStatus()
      .then(status => ctx.json(status))
      .catch(e => ctx.json(e, e.status)))
  .get('/health', ctx => ctx.json({ ok: true }))
  .start({
    port: maybe(Deno.env.get('PORT'))
      .map(Number)
      .getOrElse(3000)
  })

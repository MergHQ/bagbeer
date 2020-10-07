import memoize from 'https://raw.githubusercontent.com/MergHQ/denofun/memoize-ttl/lib/memoize.ts'
import { checkError } from '../error.ts'

const hki = '60.169940,24.938679'
const chaceTTL = 120000
const url = `https://api.darksky.net/forecast/${Deno.env.get('DARKSKY_TOKEN')!}/${hki}?units=si`

interface DarkSkyResponse {
  currently: {
    time: number,
    temperature: number
  }
}

const fetchTemp = (): Promise<{ temp: number, updated: Date }> =>
  fetch(url)
    .then(checkError)
    .then((data: DarkSkyResponse) => ({
      updated: new Date(data.currently.time * 1000),
      temp: data.currently.temperature
    }))

const cached = memoize(fetchTemp, chaceTTL)

export const fetchCached = cached

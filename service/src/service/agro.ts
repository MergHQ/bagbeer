import maybe, { Maybe } from 'https://raw.githubusercontent.com/MergHQ/denofun/maybe-get-or-else/lib/maybe.ts'
import memoize from 'https://raw.githubusercontent.com/MergHQ/denofun/memoize-ttl/lib/memoize.ts'
import { checkError, ApiError } from '../error.ts'
import resolveStatus from '../resolvers/statusResolver.ts'

const baseUrl = 'http://api.agromonitoring.com/agro/1.0'
const buildUrlString = (polyId: Maybe<string> , appId: Maybe<string>) => (resource: string) => {
  const resolvedPolygonId =
    polyId
    .map(p => `polyid=${p}`)
    .getOrElse('')

  const resolvedAppId =
    appId
    .map(a => `appid=${a}`)
    .getOrElse('')

    return `${baseUrl}/${resource}?${resolvedPolygonId}&${resolvedAppId}`
}
const cacheTTL = 60000

const withIdentifiers = buildUrlString(maybe(Deno.env.get('POLY_ID')), maybe(Deno.env.get('AGRO_API_TOKEN')))

interface SoilApiResponse {
  dt: number,
  t10: number,
  moisture: number,
  t0: number
}

interface WeatherApiResponse {
  dt: number
  wind: {
    speed: number
    deg: number
  }
}

type SoilMoistureData = Pick<SoilApiResponse, 'dt' | 'moisture'>

const parseSoilResult = ({ dt, t10, moisture, t0 }: SoilApiResponse): SoilMoistureData => ({
  dt: dt * 1000,
  moisture,
})

const fetchSoilMoisture = () =>
  fetch(withIdentifiers('soil'))
    .then(checkError)
    .then((data: SoilApiResponse) => parseSoilResult(data))

const fetchWindSpeed = () =>
  fetch(withIdentifiers('weather'))
    .then(checkError)
    .then(({ wind }: WeatherApiResponse) => wind.speed)

const cachedSoilMoisture = memoize(fetchSoilMoisture, cacheTTL)
const cachedWindSpeed = memoize(fetchWindSpeed, cacheTTL)

export const fetchCurrentStatus = () =>
  Promise.all([cachedSoilMoisture(), cachedWindSpeed()])
    .then(([moistureData, windSpeed]) => ({
      updated: new Date(moistureData.dt),
      status: resolveStatus(moistureData.moisture, windSpeed)
    }))

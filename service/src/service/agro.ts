import memoize from 'https://raw.githubusercontent.com/MergHQ/denofun/memoize-ttl/lib/memoize.ts'
import { checkError } from '../error.ts'

const baseUrl = 'http://api.agromonitoring.com/agro/1.0'
const buildUrlString = (polyId: string , appId: string) => (resource: string) =>
  `${baseUrl}/${resource}?polyid=${polyId}&appid=${appId}`

const cacheTTL = 60000

const withResource = buildUrlString(Deno.env.get('POLY_ID')!, Deno.env.get('AGRO_API_TOKEN')!)

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
  fetch(withResource('soil'))
    .then(checkError)
    .then((data: SoilApiResponse) => parseSoilResult(data))

const fetchWindSpeed = () =>
  fetch(withResource('weather'))
    .then(checkError)
    .then(({ wind }: WeatherApiResponse) => wind.speed)

const cachedSoilMoisture = memoize(fetchSoilMoisture, cacheTTL)
const cachedWindSpeed = memoize(fetchWindSpeed, cacheTTL)

export const fetchCurrentData = () =>
  Promise.all([cachedSoilMoisture(), cachedWindSpeed()])
    .then(([moistureData, windSpeed]) => ({
      updated: new Date(moistureData.dt),
      details: {
        groundMoisture: moistureData.moisture,
        windSpeed
      }
    }))

import pipe from 'https://raw.githubusercontent.com/galkowskit/denofun/master/lib/pipe.ts'
import curry from 'https://raw.githubusercontent.com/galkowskit/denofun/master/lib/curry.ts'

const scale = ['great', 'good', 'average', 'bad']
const moistureLimit = 0.25
const windLimit = 17.1
const moistureFactorMultiplier = 1.5

const limitFactor = curry(Math.min)(scale.length - 1)

const resolveStatus = (soilMoisture: number, windSpeed: number, temp: number) => {
  const moistureFactor = (soilMoisture / (moistureLimit / 2)) * moistureFactorMultiplier
  const windFactor = windSpeed / (windLimit / 2)
  const temperaturFactor =
    temp < 5 ? 3 :
    temp < 10 ? 2 :
    temp < 15 ? 1.5 :
    temp < 20 ? 1 :
    temp < 25 ? 0 : 0

  const index = pipe(
    () => (moistureFactor + windFactor + temperaturFactor) - 1,
    Math.round, 
    limitFactor
  )
  return scale[index()]
}

export default resolveStatus

import { UTCDate } from '@date-fns/utc'
import { add } from 'date-fns/add'
import { formatISO } from 'date-fns/formatISO'
import { formatISODuration } from 'date-fns/formatISODuration'
import { intervalToDuration } from 'date-fns/intervalToDuration'
import { z } from 'zod'
import { ceilManHour } from './ceilManHour.mjs'
import { eachTaskTimeInterval } from './eachTaskTimeInterval.mjs'
import { timeWithOffsetSchema } from './types.mjs'

export const contextSchema = z.object({
  workStart: timeWithOffsetSchema,
  workEnd: timeWithOffsetSchema,
  workPeriod: timeWithOffsetSchema,
  breakStart: timeWithOffsetSchema,
  breakEnd: timeWithOffsetSchema,
  step: z.number().positive(),
  timezone: z.string(),
  locale: z.string(),
})
export type Context = z.infer<typeof contextSchema>

type Record = {
  interval: string
  hours: number
  isoInterval: string
  isoDuration: string
}

export function main(
  start: string,
  end: string,
  {
    workStart: workStart,
    workEnd: workEnd,
    workPeriod: workPeriod,
    breakStart: breakStart,
    breakEnd: breakEnd,
    step: step,
    timezone: timeZone,
    locale: locale,
  }: Context,
) {
  const intervals = eachTaskTimeInterval(new UTCDate(start), new UTCDate(end), {
    workStart,
    workEnd,
    workPeriod,
    breakStart,
    breakEnd,
  })

  const intervalFormatter = new Intl.DateTimeFormat(locale, {
    timeZone,
    dateStyle: 'full',
    timeStyle: 'medium',
  })

  const records = intervals.reduce((acc, interval) => {
    const duration = intervalToDuration(interval)

    acc.push({
      interval: intervalFormatter.formatRange(new Date(interval.start), new Date(interval.end)),
      hours: ceilManHour(add(new Date(0), duration).getTime() / 1000 / 60 / 60, step),
      isoInterval: `${formatISO(interval.start)}/${formatISO(interval.end)}`,
      isoDuration: formatISODuration(duration),
    })

    return acc
  }, [] as Record[])

  console.log(JSON.stringify(records, null, 2))
}

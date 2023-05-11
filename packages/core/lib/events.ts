import { type Clock } from './clock'

export interface Event {
  name: string
  time: number
}

export interface JsonEvent {
  name: string
  timeUnixNano: string
}

export class SpanEvents {
  private readonly events: Event[] = []

  add (name: string, time: number) {
    this.events.push({ name, time })
  }

  toJson (clock: Clock): JsonEvent[] {
    return this.events.map(({ name, time }) => ({ name, timeUnixNano: clock.toUnixTimestampNanoseconds(time) }))
  }
}

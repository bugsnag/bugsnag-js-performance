import { type Time } from './time'

export interface Event {
  name: string
  timeUnixNano: Time
}

export class SpanEvents {
  private readonly events: Event[] = []

  add (name: string, timeUnixNano: Time) {
    this.events.push({ name, timeUnixNano })
  }

  toJson () {
    return this.events
  }
}

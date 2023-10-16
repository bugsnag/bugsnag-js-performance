import {
  type Delivery,
  type DeliveryPayload,
  type DeliverySpan,
  type RetryQueue,
  type TracePayload
} from '@bugsnag/core-performance'
import type Directory from './directory'
import timestampFromFilename from './timestamp-from-filename'

function getLatestSpan (body: DeliveryPayload): DeliverySpan | undefined {
  let latestSpan: DeliverySpan | undefined
  let biggestTimestamp: bigint | undefined

  for (const resourceSpan of body.resourceSpans) {
    for (const scopeSpan of resourceSpan.scopeSpans) {
      for (const span of scopeSpan.spans) {
        if (biggestTimestamp === undefined || BigInt(span.endTimeUnixNano) > biggestTimestamp) {
          latestSpan = span

          // store the biggest timestamp separately as a bigint so we don't need
          // to parse it on every iteration
          biggestTimestamp = BigInt(latestSpan.endTimeUnixNano)
        }
      }
    }
  }

  return latestSpan
}

function isValidFilename (filename: string): boolean {
  // if the filename is too short then it can't be valid
  if (filename.length < MININUM_FILENAME_LENGTH) {
    return false
  }

  const timestamp = timestampFromFilename(filename)

  // if we can't parse a timestamp then the filename can't be valid
  if (!timestamp) {
    return false
  }

  const nowInNanoseconds = BigInt(Date.now()) * NANOSECONDS_IN_MILLISECONDS

  // files that are older than 24 hours are not valid as the data may not be
  // relevant anymore
  if (timestamp < nowInNanoseconds - NANOSECONDS_IN_DAY) {
    return false
  }

  // files that have a timestamp more than 24 hours in the future are not
  // valid as something may have gone wrong with the clock and this is
  // unlikely to be a timezone issue
  if (timestamp > nowInNanoseconds + NANOSECONDS_IN_DAY) {
    return false
  }

  return true
}

// the minimum possible length of a payload filename (i.e. a 1 character
// timestamp and span ID)
const MININUM_FILENAME_LENGTH = 'retry-0-0.json'.length
const NANOSECONDS_IN_MILLISECONDS = BigInt(1_000_000)
const NANOSECONDS_IN_DAY = BigInt(24 * 60 * 60_000) * NANOSECONDS_IN_MILLISECONDS

// the outcome of flushing a single file — either delete it (e.g. success or
// permanent failure) or leave it alone for the next flush (retryable failure)
const enum FlushOutcome { DeleteFile, LeaveFile }

export default class FileBasedRetryQueue implements RetryQueue {
  private readonly delivery: Delivery
  private readonly directory: Directory

  constructor (delivery: Delivery, directory: Directory) {
    this.delivery = delivery
    this.directory = directory
  }

  async add (payload: TracePayload, _time: number): Promise<void> {
    const span = getLatestSpan(payload.body)

    if (!span) {
      return
    }

    // we use the latest span's timestamp in the filename so we can decide
    // whether to keep or discard the span without parsing the payload
    // as we can't be sure of nanosecond precision in JS environments, we also
    // append the span ID so file names are unique across batches
    const filename = `retry-${span.endTimeUnixNano}-${span.spanId}.json`

    try {
      const json = JSON.stringify(payload)

      await this.directory.write(filename, json)
    } catch {
    }
  }

  async flush (): Promise<void> {
    const files = await this.directory.files()

    for (const filename of files) {
      try {
        const outcome = await this.flushFile(filename)

        if (outcome === FlushOutcome.DeleteFile) {
          await this.directory.delete(filename)
        }
      } catch {
      }
    }
  }

  private async flushFile (filename: string): Promise<FlushOutcome> {
    if (!isValidFilename(filename)) {
      return FlushOutcome.DeleteFile
    }

    const payload = await this.getPayloadFromFile(filename)

    if (!payload) {
      return FlushOutcome.DeleteFile
    }

    const response = await this.delivery.send(payload)

    switch (response.state) {
      case 'success':
      case 'failure-discard':
        return FlushOutcome.DeleteFile

      case 'failure-retryable':
        // this file will be retried by the next flush so we can leave it alone
        return FlushOutcome.LeaveFile
    }

    response.state satisfies never
  }

  private async getPayloadFromFile (name: string): Promise<TracePayload | undefined> {
    try {
      return JSON.parse(await this.directory.read(name))
    } catch {
    }
  }
}

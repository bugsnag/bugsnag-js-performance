import type {
  Delivery,
  DeliveryPayload,
  DeliverySpan,
  RetryQueue,
  TracePayload
} from '@bugsnag/core-performance'
import type Directory from './directory'
import timestampFromFilename from './timestamp-from-filename'

function getLastSpan (body: DeliveryPayload): DeliverySpan | undefined {
  for (let i = body.resourceSpans.length - 1; i >= 0; i--) {
    const resourceSpan = body.resourceSpans[i]
    for (let j = resourceSpan.scopeSpans.length - 1; j >= 0; j--) {
      const scopeSpan = resourceSpan.scopeSpans[j]
      if (scopeSpan.spans.length > 0) {
        return scopeSpan.spans[scopeSpan.spans.length - 1]
      }
    }
  }
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

  const now = Date.now()

  // files that are older than 24 hours are not valid as the data may not be
  // relevant anymore
  if (timestamp < now - MILLISECONDS_IN_DAY) {
    return false
  }

  // files that have a timestamp more than 24 hours in the future are not
  // valid as something may have gone wrong with the clock and this is
  // unlikely to be a timezone issue
  if (timestamp > now + MILLISECONDS_IN_DAY) {
    return false
  }

  return true
}

// the minimum possible length of a payload filename (i.e. a 1 character
// timestamp and span ID)
const MININUM_FILENAME_LENGTH = 'retry-0-0.json'.length
const MILLISECONDS_IN_DAY = 24 * 60 * 60_000

// the outcome of flushing a single file — either delete it (e.g. success or
// permanent failure) or leave it alone for the next flush (retryable failure)
const enum FlushOutcome { DeleteFile, LeaveFile }

export default class FileBasedRetryQueue implements RetryQueue {
  private readonly delivery: Delivery
  private readonly directory: Directory
  private requestQueue: Promise<void> = Promise.resolve()

  constructor (delivery: Delivery, directory: Directory) {
    this.delivery = delivery
    this.directory = directory
  }

  async add (payload: TracePayload, time: number): Promise<void> {
    const span = getLastSpan(payload.body)

    if (!span) {
      return
    }

    // we use the batch time in the filename so we can decide
    // whether to keep or discard the file without parsing the payload,
    // along with the last span's ID so file names are unique across batches
    const filename = `retry-${time}-${span.spanId}.json`

    try {
      const json = JSON.stringify(payload)

      await this.directory.write(filename, json)
    } catch {
    }
  }

  async flush (): Promise<void> {
    this.requestQueue = this.requestQueue.then(async () => {
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
    })

    await this.requestQueue
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

import {
  type Delivery,
  type RetryQueue,
  type RetryQueueFactory
} from '@bugsnag/core-performance'

import RetryQueueDirectory, { type MinimalFileSystem } from './directory'
import FileBasedRetryQueue from './file-based'
import { PERSISTENCE_DIRECTORY } from '../persistence'

export default function createRetryQueueFactory (fileSystem: MinimalFileSystem): RetryQueueFactory {
  return function fileBasedQueueFactory (delivery: Delivery, _retryQueueMaxSize: number): RetryQueue {
    const directory = new RetryQueueDirectory(fileSystem, `${PERSISTENCE_DIRECTORY}/retry-queue`)

    return new FileBasedRetryQueue(delivery, directory)
  }
}

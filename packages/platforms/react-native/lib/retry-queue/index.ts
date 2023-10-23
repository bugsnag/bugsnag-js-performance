import {
  type Delivery,
  type RetryQueue,
  type RetryQueueFactory
} from '@bugsnag/core-performance'
import { AppState, type AppStateStatus } from 'react-native'

import RetryQueueDirectory, { type MinimalFileSystem } from './directory'
import FileBasedRetryQueue from './file-based'
import { PERSISTENCE_DIRECTORY } from '../persistence'

export default function createRetryQueueFactory (fileSystem: MinimalFileSystem): RetryQueueFactory {
  return function fileBasedQueueFactory (delivery: Delivery, _retryQueueMaxSize: number): RetryQueue {
    const directory = new RetryQueueDirectory(fileSystem, `${PERSISTENCE_DIRECTORY}/retry-queue`)
    const retryQueue = new FileBasedRetryQueue(delivery, directory)

    // send any currently stored payloads from previous launches
    retryQueue.flush()

    // flush the retry queue when the app changes from background -> foreground
    // or vice versa
    AppState.addEventListener('change', (_status: AppStateStatus): void => {
      retryQueue.flush()
    })

    return retryQueue
  }
}

import type { Delivery, RetryQueueFactory } from '@bugsnag/core-performance'
import { InMemoryQueue } from '@bugsnag/core-performance'
import type { NetInfoState } from '@react-native-community/netinfo'
import NetInfo from '@react-native-community/netinfo'
import { AppState, Platform } from 'react-native'
import type { AppStateStatus } from 'react-native'

const createRetryQueueFactory: () => RetryQueueFactory = () => {
  return (delivery: Delivery, _retryQueueMaxSize: number) => {
    const retryQueue = new InMemoryQueue(delivery, _retryQueueMaxSize)

    // store the last known network state value so we can see if it has changed
    let lastNetworkState: NetInfoState | undefined

    // flush the retry queue when the app changes from background -> foreground
    // or vice versa
    AppState.addEventListener('change', (status: AppStateStatus): void => {
      retryQueue.flush()

      // on iOS the app doesn't get network information events when in the
      // background so we need to fetch it when returning to the foreground
      // to ensure 'lastNetworkState' doesn't get out of date
      if (status === 'active' && Platform.OS === 'ios') {
        NetInfo.fetch().then((newState: NetInfoState): void => {
          lastNetworkState = newState
        })
      }
    })

    // flush the retry queue when the app gains network connectivity
    NetInfo.addEventListener((newState: NetInfoState): void => {
      // only flush if we've gained network connectivity since the last time it
      // changed, e.g. we don't need to flush if going from a cellular
      // connection to wifi as both connections should allow us to send spans
      // we also don't flush the first time this is called (when
      // 'lastNetworkState' is undefined) as net info calls this callback soon
      // after registering it but we already flush the queue immediately
      if (newState.isConnected &&
        lastNetworkState !== undefined &&
        !lastNetworkState.isConnected
      ) {
        retryQueue.flush()
      }

      lastNetworkState = newState
    })

    return retryQueue
  }
}

export default createRetryQueueFactory

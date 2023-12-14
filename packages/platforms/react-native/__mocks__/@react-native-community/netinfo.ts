/* eslint-env jest */

import type NetInfo from '@react-native-community/netinfo'
import type {
  NetInfoChangeHandler,
  NetInfoState
} from '@react-native-community/netinfo'

export enum NetInfoCellularGeneration {
  '2g' = '2g',
  '3g' = '3g',
  '4g' = '4g',
  '5g' = '5g'
}

export enum NetInfoStateType {
  unknown = 'unknown',
  none = 'none',
  cellular = 'cellular',
  wifi = 'wifi',
  bluetooth = 'bluetooth',
  ethernet = 'ethernet',
  wimax = 'wimax',
  vpn = 'vpn',
  other = 'other',
}

const initialState: NetInfoState = {
  type: NetInfoStateType.cellular,
  isConnected: true,
  isInternetReachable: true,
  details: {
    isConnectionExpensive: false,
    cellularGeneration: NetInfoCellularGeneration['4g'],
    carrier: 'BugSnag'
  }
}

let listeners: NetInfoChangeHandler[] = []

const MockNetInfo: typeof NetInfo = {
  fetch: jest.fn(() => Promise.resolve(initialState)),
  refresh: jest.fn(),
  configure: jest.fn(),
  addEventListener: jest.fn((listener) => {
    listeners.push(listener)
    listener(initialState)
    return () => listeners
  }),
  useNetInfo: jest.fn()
}

export default MockNetInfo

export function resetEventListeners (): void {
  listeners = []
}

export function notifyNetworkStateChange (state?: NetInfoState): void {
  listeners.forEach((listener) => { listener(state || initialState) })
}

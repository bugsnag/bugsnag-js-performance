import type { NetInfoStateType } from '@react-native-community/netinfo'

export type NetworkConnectionType = 'wifi' | 'wired' | 'cell' | 'unavailable' | 'unknown'

export type CellularGeneration = '2g' | '3g' | '4g' | '5g'

function getNetworkConnectionType (state: NetInfoStateType): NetworkConnectionType {
  switch (state) {
    case 'none':
      return 'unavailable'
    case 'cellular':
      return 'cell'
    case 'ethernet':
      return 'wired'
    case 'wimax':
    case 'wifi':
      return 'wifi'
    case 'bluetooth':
    case 'other':
    case 'unknown':
    case 'vpn':
      return 'unknown'
    default:
      return 'unknown'
  }
}

export default getNetworkConnectionType

import { type SpanAttributesSource } from '@bugsnag/core-performance'
import NetInfo from '@react-native-community/netinfo'
import { type AppStateStatic } from 'react-native'
import { type ReactNativeConfiguration } from './config'
import getNetworkConnectionType, { type CellularGeneration, type NetworkConnectionType } from './get-network-connection-type'

export function createSpanAttributesSource (appState: AppStateStatic) {
  let connectionType: NetworkConnectionType = 'unknown'
  let cellularGeneration: CellularGeneration

  // Subscribe to network changes
  NetInfo.addEventListener(state => {
    connectionType = getNetworkConnectionType(state.type)
    // @ts-expect-error cellularGeneration does not exist on type
    cellularGeneration = state.details?.cellularGeneration
  })

  const spanAttributesSource: SpanAttributesSource<ReactNativeConfiguration> = {
    configure (configuration) {

    },
    requestAttributes (span) {
      span.setAttribute('bugsnag.app.in_foreground', appState.currentState === 'active')
      span.setAttribute('net.host.connection.type', connectionType)

      if (cellularGeneration && connectionType === 'cell') {
        span.setAttribute('net.host.connection.subtype', cellularGeneration)
      }
    }
  }

  return spanAttributesSource
}

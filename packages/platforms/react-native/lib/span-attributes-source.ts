import { type SpanAttributesSource } from '@bugsnag/core-performance'
import NetInfo from '@react-native-community/netinfo'
import { type AppStateStatic } from 'react-native'
import { type ReactNativeConfiguration } from './config'
import getNetworkConnectionType, { type NetworkConnectionType } from './get-network-connection-type'

export function createSpanAttributesSource (appState: AppStateStatic) {
  let connectionType: NetworkConnectionType = 'unknown'

  // Subscribe to network changes
  NetInfo.addEventListener(state => {
    connectionType = getNetworkConnectionType(state.type)
  })

  const spanAttributesSource: SpanAttributesSource<ReactNativeConfiguration> = {
    configure (configuration) {

    },
    requestAttributes (span) {
      span.setAttribute('bugsnag.app.in_foreground', appState.currentState === 'active')
      span.setAttribute('net.host.connection.type', connectionType)
    }
  }

  return spanAttributesSource
}

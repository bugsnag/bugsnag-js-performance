import { type SpanAttributesSource } from '@bugsnag/core-performance'
import NetInfo from '@react-native-community/netinfo'
import { type AppStateStatic } from 'react-native'
import { type ReactNativeConfiguration } from './config'
import getNetworkConnectionType from './get-network-connection-type'

export function createSpanAttributesSource (appState: AppStateStatic) {
  let connectionType = 'unknown' // TODO: do we need to set an initial value or will the event listener fire in the first instance?

  // Subscribe to network changes
  NetInfo.addEventListener(state => {
    connectionType = getNetworkConnectionType(state.type)
    console.log(`[BusgnagPerformance] connection state: ${JSON.stringify(state)}`)
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

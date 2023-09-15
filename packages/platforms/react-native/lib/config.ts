import {
  isBoolean,
  isStringWithLength,
  schema,
  type ConfigOption,
  type CoreSchema,
  type Configuration
} from '@bugsnag/core-performance'
import { type WrapperComponentProvider } from 'react-native'
import { isWrapperComponentProvider } from './auto-instrumentation/app-start-plugin'
import { defaultNetworkRequestCallback, isNetworkRequestCallback, type NetworkRequestCallback } from './network-request-callback'

export interface ReactNativeSchema extends CoreSchema {
  appName: ConfigOption<string>
  codeBundleId: ConfigOption<string>
  generateAnonymousId: ConfigOption<boolean>
  autoInstrumentAppStarts: ConfigOption<boolean>
  wrapperComponentProvider: ConfigOption<WrapperComponentProvider | null>
  autoInstrumentNetworkRequests: ConfigOption<boolean>
  networkRequestCallback: ConfigOption<NetworkRequestCallback>
}

export interface ReactNativeConfiguration extends Configuration {
  appName: string
  codeBundleId?: string
  generateAnonymousId?: boolean
  autoInstrumentAppStarts?: boolean
  wrapperComponentProvider?: WrapperComponentProvider | null
  autoInstrumentNetworkRequests?: boolean
  networkRequestCallback?: NetworkRequestCallback
}

function createSchema (): ReactNativeSchema {
  return {
    ...schema,
    appName: {
      defaultValue: '',
      message: 'should be a string',
      validate: isStringWithLength
    },
    codeBundleId: {
      defaultValue: '',
      message: 'should be a string',
      validate: isStringWithLength
    },
    generateAnonymousId: {
      defaultValue: true,
      message: 'should be true|false',
      validate: isBoolean
    },
    autoInstrumentAppStarts: {
      defaultValue: true,
      message: 'should be true|false',
      validate: isBoolean
    },
    wrapperComponentProvider: {
      defaultValue: null,
      message: 'should be a function',
      validate: isWrapperComponentProvider
    },
    autoInstrumentNetworkRequests: {
      defaultValue: true,
      message: 'should be true|false',
      validate: isBoolean
    },
    networkRequestCallback: {
      defaultValue: defaultNetworkRequestCallback,
      message: 'should be a function',
      validate: isNetworkRequestCallback
    }
  }
}

export default createSchema

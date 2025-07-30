import type { ConfigOption, Configuration, CoreSchema } from '@bugsnag/core-performance'
import { isBoolean, isStringOrRegExpArray, isStringWithLength, schema } from '@bugsnag/core-performance'
import type { NetworkRequestCallback } from '@bugsnag/request-tracker-performance'
import { defaultNetworkRequestCallback, isNetworkRequestCallback } from '@bugsnag/request-tracker-performance'
import type { WrapperComponentProvider } from 'react-native'
import type { ReactNativeNetworkRequestInfo } from './auto-instrumentation'
import { isWrapperComponentProvider } from './auto-instrumentation/app-start-plugin'

export interface ReactNativeSchema extends CoreSchema {
  codeBundleId: ConfigOption<string>
  generateAnonymousId: ConfigOption<boolean>
  autoInstrumentAppStarts: ConfigOption<boolean>
  wrapperComponentProvider: ConfigOption<WrapperComponentProvider | null>
  autoInstrumentNetworkRequests: ConfigOption<boolean>
  networkRequestCallback: ConfigOption<NetworkRequestCallback<ReactNativeNetworkRequestInfo>>
  tracePropagationUrls: ConfigOption<Array<string | RegExp>>
}

export interface ReactNativeConfiguration extends Configuration {
  autoInstrumentAppStarts?: boolean
  autoInstrumentNetworkRequests?: boolean
  codeBundleId?: string
  generateAnonymousId?: boolean
  networkRequestCallback?: NetworkRequestCallback<ReactNativeNetworkRequestInfo>
  wrapperComponentProvider?: WrapperComponentProvider | null
  tracePropagationUrls?: Array<string | RegExp>
}

// These config options are applied from the native SDKs and are not configurable in JS.
export type ReactNativeAttachConfiguration = Omit<ReactNativeConfiguration,
'apiKey' |
'endpoint' |
'samplingProbability' |
'appVersion' |
'releaseStage' |
'enabledReleaseStages' |
'serviceName' |
'attributeCountLimit' |
'attributeStringValueLimit' |
'attributeArrayLengthLimit'
>

function createSchema (isDevelopment = false): ReactNativeSchema {
  return {
    ...schema,
    releaseStage: {
      ...schema.releaseStage,
      defaultValue: isDevelopment ? 'development' : 'production'
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
    },
    tracePropagationUrls: {
      defaultValue: [],
      message: 'should be an array of string|RegExp',
      validate: isStringOrRegExpArray
    }
  }
}

export default createSchema

import {
  isBoolean,
  isStringWithLength,
  schema,
  type ConfigOption,
  type Configuration,
  type CoreSchema
} from '@bugsnag/core-performance'
import { type WrapperComponentProvider } from 'react-native'
import { isWrapperComponentProvider } from './auto-instrumentation/app-start-plugin'

export interface ReactNativeSchema extends CoreSchema {
  appName: ConfigOption<string>
  codeBundleId: ConfigOption<string>
  generateAnonymousId: ConfigOption<boolean>
  autoInstrumentAppStarts: ConfigOption<boolean>
  wrapperComponentProvider: ConfigOption<WrapperComponentProvider | null>
}

export interface ReactNativeConfiguration extends Configuration {
  appName: string
  codeBundleId?: string
  generateAnonymousId?: boolean
  autoInstrumentAppStarts?: boolean
  wrapperComponentProvider?: WrapperComponentProvider | null
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
    }
  }
}

export default createSchema

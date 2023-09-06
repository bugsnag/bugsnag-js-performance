import {
  isBoolean,
  isStringWithLength,
  schema,
  type ConfigOption,
  type Configuration,
  type CoreSchema
} from '@bugsnag/core-performance'

export interface ReactNativeSchema extends CoreSchema {
  appName: ConfigOption<string>
  codeBundleId: ConfigOption<string>
  generateAnonymousId: ConfigOption<boolean>
  autoInstrumentAppStarts: ConfigOption<boolean>
}

export interface ReactNativeConfiguration extends Configuration {
  appName: string
  codeBundleId?: string
  generateAnonymousId?: boolean
  autoInstrumentAppStarts?: boolean
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
    }
  }
}

export default createSchema

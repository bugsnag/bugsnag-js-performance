import {
  isStringWithLength,
  schema,
  type ConfigOption,
  type Configuration,
  type CoreSchema
} from '@bugsnag/core-performance'

export interface ReactNativeSchema extends CoreSchema {
  appName: ConfigOption<string>
  codeBundleId: ConfigOption<string>
}

export interface ReactNativeConfiguration extends Configuration {
  appName: string
  codeBundleId?: string
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
    }
  }
}

export default createSchema

import {
  isString,
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

export function createSchema (): ReactNativeSchema {
  return {
    ...schema,
    appName: {
      defaultValue: 'app',
      message: 'should be a string',
      validate: isString
    },
    codeBundleId: {
      defaultValue: '',
      message: 'should be a string',
      validate: isString
    }
  }
}

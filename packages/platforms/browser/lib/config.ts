import { schema, type CoreSchema, type ConfigOption, type Configuration } from '@bugsnag/js-performance-core'

export interface BrowserSchema extends CoreSchema {
  autoInstrumentFullPageLoads: ConfigOption<boolean>
}

export interface BrowserConfiguration extends Configuration {
  autoInstrumentFullPageLoads?: boolean
}

export function createSchema (hostname: string): BrowserSchema {
  return {
    ...schema,
    releaseStage: {
      ...schema.releaseStage,
      defaultValue: hostname === 'localhost' ? 'development' : 'production'
    },
    autoInstrumentFullPageLoads: {
      defaultValue: true,
      message: 'should be true|false',
      validate: (value): value is boolean => value === true || value === false
    },
    autoInstrumentNetworkRequests: {
      defaultValue: true,
      message: 'should be true|false',
      validate: (value): value is boolean => value === true || value === false
    }
  }
}

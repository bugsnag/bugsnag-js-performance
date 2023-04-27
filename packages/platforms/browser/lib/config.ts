import { schema, type CoreSchema } from '@bugsnag/js-performance-core'

export function createSchema (hostname: string): CoreSchema {
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

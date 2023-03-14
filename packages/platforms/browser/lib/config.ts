import { schema, type Schema } from '@bugsnag/js-performance-core'

export function createSchema (hostname: string): Schema {
  return {
    ...schema,
    releaseStage: {
      ...schema.releaseStage,
      defaultValue: hostname === 'localhost' ? 'development' : 'production'
    }
  }
}

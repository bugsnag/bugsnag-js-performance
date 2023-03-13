import { schema as coreSchema, type Schema } from '@bugsnag/js-performance-core'

export const schema: Schema = {
  ...coreSchema,
  releaseStage: {
    ...coreSchema.releaseStage,
    defaultValue: /^localhost(:\d+)?$/.test(window.location.host) ? 'development' : 'production'
  }
}

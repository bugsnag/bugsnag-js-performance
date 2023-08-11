import { ResourceAttributes, type Configuration, type InternalConfiguration } from '@bugsnag/core-performance'

export function resourceAttributesSource (config: InternalConfiguration<Configuration>) {
  const attributes = new ResourceAttributes(
    config.releaseStage,
    config.appVersion,
    'bugsnag.performance.reactnative',
    '__VERSION__'
  )

  return Promise.resolve(attributes)
}

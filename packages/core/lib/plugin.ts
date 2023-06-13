import { type InternalConfiguration, type Configuration } from './config'

export interface Plugin<C extends Configuration> {
  configure: (configuration: InternalConfiguration<C>) => void
}

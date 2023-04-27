import { type InternalConfiguration } from './config'

export interface Plugin {
  configure: (configuration: InternalConfiguration) => void
}

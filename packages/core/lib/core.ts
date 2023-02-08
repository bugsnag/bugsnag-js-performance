export interface Configuration {
  apiKey: string
  endpoint?: string
  releaseStage?: string
}

export interface BugsnagPerformance {
  start: (config: Configuration | string) => void
}

export function createClient (): BugsnagPerformance {
  return {
    start: (config: Configuration | string) => {
      if (typeof config === 'string') { config = { apiKey: config } }
      if (!config?.apiKey) throw new Error('No Bugsnag API Key set')
    }
  }
}

export default createClient

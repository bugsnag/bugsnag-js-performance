import spanFactory, { SpanFactory } from "./spanFactory"
import { CoreConfiguration, PlatformConfiguration, Span, Time } from "./types"

export interface Client<C> {
    start: (config: Partial<C> & CoreConfiguration) => void
    startSpan: (name: string, startTime?: Time) => Span
}

export interface ClientOptions<C, E> {
    clock: () => number
    configuration?: PlatformConfiguration<C>
    platformExtensions?: (factory: SpanFactory) => E
}

type BugsnagClient<C, E> = Client<C> & E

export function createClient<C, E>(options: ClientOptions<C, E>): BugsnagClient<C, E> {
  const mockDestination = () => Promise.resolve({ success: true }) // TODO: wire up destination from platform client
  const clientSpanFactory = spanFactory(options.clock, mockDestination)

  return {
    start: (config) => { console.log("start() called") },
    startSpan: (name, startTime) => clientSpanFactory.newSpan({ name, startTime }),
    ...(options.platformExtensions?.(clientSpanFactory))
  } as BugsnagClient<C, E>
}

export * from "./types"

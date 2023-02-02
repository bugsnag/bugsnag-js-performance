import { ErrorMessage } from "./errorMessage"

export interface CoreConfiguration {
    apiKey: string
    endpoint?: string
    releaseStage?: string
}

// TODO Bring more in line with validators from bugsnag-js
type OptionValidator<T> = {
    validator: (value: T) => ErrorMessage | null
    defaultValue?: () => T
}

export type PlatformConfiguration<C> = {
    [K in keyof C]: OptionValidator<C[K]>
}

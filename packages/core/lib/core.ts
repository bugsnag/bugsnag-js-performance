interface StartParams {
  apiKey: string
}

export const createClient = () => ({
  start: ({ apiKey }: StartParams) => {}
})

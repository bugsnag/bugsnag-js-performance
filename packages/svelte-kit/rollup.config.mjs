import createRollupConfig from '../../.rollup/index.mjs'

const config = createRollupConfig({
  external: [
    '@bugsnag/browser-performance',
    'svelte'
  ]
})

export default config

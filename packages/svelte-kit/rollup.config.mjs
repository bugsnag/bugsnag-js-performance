import createRollupConfig from '../../.rollup/index.mjs'

const config = createRollupConfig({
  external: [
    '@bugsnag/js-performance',
    'svelte'
  ]
})

export default config

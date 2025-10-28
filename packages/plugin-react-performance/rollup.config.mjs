import createRollupConfig from '../../.rollup/index.mjs'
import noTreeShakingPlugin from '../../.rollup/no-tree-shaking.plugin.mjs'

const config = createRollupConfig({
  external: [
    '@bugsnag/browser-performance',
    'react',
    'react/jsx-runtime'
  ]
})

config.plugins = config.plugins.concat([
  noTreeShakingPlugin('with-instrumented-component.tsx')
])

export default config


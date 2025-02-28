import createRollupConfig from '../../.rollup/index.mjs'
import noTreeShakingPlugin from '../../.rollup/no-tree-shaking.plugin.mjs'
import jsx from 'acorn-jsx'

const config = createRollupConfig({
  external: [
    '@bugsnag/browser-performance',
    'react'
  ]
})

config.acornInjectPlugins = [jsx()]
config.plugins = config.plugins.concat([
  noTreeShakingPlugin('plugin-react-performance.tsx')
])

export default config


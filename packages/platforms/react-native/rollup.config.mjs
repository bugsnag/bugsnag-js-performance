import createRollupConfig from '../../../.rollup/index.mjs'
import jsx from 'acorn-jsx'

// when functional components are used in JSX tags, rollup doesn't recognise them as actually being used and tree-shakes them away
// this plugin prevents that from happening by explicity telling rollup not to tree-shake the module
function noTreeShakingPlugin () {
  return {
    name: 'no-treeshaking-plugin',
    transform (code) {
      if (code.indexOf('AppStartPlugin') >= 0) return { moduleSideEffects: 'no-treeshake' }
    }
  }
}

const config = createRollupConfig({
  external: ['@bugsnag/delivery-fetch-performance', 'react-native', 'react', '@bugsnag/cuid', '@react-native-async-storage/async-storage']
})

config.plugins = config.plugins.concat(noTreeShakingPlugin())
config.acornInjectPlugins = [jsx()]

export default config

import createRollupConfig from '../../../.rollup/index.mjs'
import jsx from 'acorn-jsx'

export default createRollupConfig({
  external: ['@bugsnag/delivery-fetch-performance', 'react-native', 'react' '@bugsnag/cuid', '@react-native-async-storage/async-storage'],
  acornInjectPlugins: [jsx()],
})

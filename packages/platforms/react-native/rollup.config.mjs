import fs from 'fs'
import createRollupConfig from '../../../.rollup/index.mjs'

export default createRollupConfig({
  external: ['@bugsnag/delivery-fetch-performance', 'react-native', '@bugsnag/cuid'],
})

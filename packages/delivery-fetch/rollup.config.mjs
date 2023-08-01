import fs from 'fs'
import createRollupConfig from '../../.rollup/index.mjs'

export default createRollupConfig({
  internal: 'lib/delivery.ts',
})
import fs from 'fs'
import createRollupConfig from '../../.rollup/index.mjs'

export default createRollupConfig({
  external: ['@bugsnag/cuid'],
  additionalReplacements: {
    __ENABLE_BUGSNAG_TEST_CONFIGURATION__: !!process.env.ENABLE_TEST_CONFIGURATION
  }
})

import fs from 'fs'
import createRollupConfig from '../../../.rollup/index.mjs'

export default createRollupConfig({
    internal: 'lib/browser.ts',
    external: ['@bugsnag/browser-performance']
})

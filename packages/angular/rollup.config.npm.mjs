import fs from 'fs'
import createRollupConfig from '../../../.rollup/index.mjs'

export default createRollupConfig({
  external: ['@bugsnag/cuid', '@bugsnag/core-performance', '@bugsnag/browser-performance', '@angular/core', '@angular/router'],
})

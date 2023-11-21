import createRollupConfig from '../../.rollup/index.mjs'

export default createRollupConfig({
  external: [
    '@bugsnag/browser-performance',
    '@angular/core',
    '@angular/router'
  ],
})

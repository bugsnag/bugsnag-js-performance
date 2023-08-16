import fs from 'fs'
import createRollupConfig from '../../../.rollup/index.mjs'

const packageJson = JSON.parse(fs.readFileSync(`${process.cwd()}/package.json`))

export default createRollupConfig({
  external: ['@bugsnag/delivery-fetch-performance'],
  additionalReplacements: {
    name: packageJson.version,
  }
})

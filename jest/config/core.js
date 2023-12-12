/** @type {import('ts-jest').JestConfigWithTsJest} */

// these paths must be specified because otherwise typescript relies on the
// "main" field in each package.json file, which points to the compiled JS and
// we want to run Jest against the TS source
const paths = { '@bugsnag/core-performance': ['./packages/core/lib/index.ts'] }
const moduleNameMapper = { '^@bugsnag/core-performance$': ['<rootDir>/packages/core/lib/index.ts'] }

module.exports = {
  rootDir: '../../',
  displayName: 'core',
  preset: 'ts-jest/presets/js-with-ts',
  moduleNameMapper,
  testMatch: ['<rootDir>/packages/core/**/*.test.ts'],
  transform: {
    '^.+\\.m?[tj]sx?$': [
      'ts-jest',
      { tsconfig: { paths, allowJs: true } }
    ]
  }
}

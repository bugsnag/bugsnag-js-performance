/** @type {import('ts-jest').JestConfigWithTsJest} */

// these paths must be specified because otherwise typescript relies on the
// "main" field in each package.json file, which points to the compiled JS and
// we want to run Jest against the TS source
const paths = {
  '@bugsnag/core-performance': ['./packages/core/lib/index.ts'],
  '@bugsnag/browser-performance': ['./packages/platforms/browser/lib/index.ts']
}

// convert the tsconfig "paths" option into Jest's "moduleNameMapper" option
// e.g.: "{ 'path': ['./a/b'] }" -> "{ '^path$': ['<rootDir>/a/b'] }"
const moduleNameMapper = Object.fromEntries(
  Object.entries(paths)
    .map(([name, directories]) => [
      `^${name}$`,
      directories.map(directory => directory.replace('./', '<rootDir>/'))
    ])
)

module.exports = {
  collectCoverageFrom: [
    '**/packages/*/**/*.ts',
    '!**/packages/*/**/*.d.ts',
    '!**/packages/*/**/tests/**/*',
    '!<rootDir>/packages/test-utilities/**/*',
    '!<rootDir>/test/**/*'
  ],
  coverageReporters: ['json-summary', 'text'],
  transform: {
    '^.+\\.m?[tj]sx?$': [
      'ts-jest',
      { tsconfig: { paths } }
    ]
  },
  testEnvironment: 'node',
  moduleNameMapper,
  reporters: process.env.CI
    ? [['github-actions', { silent: false }], 'summary']
    : ['default']
}
